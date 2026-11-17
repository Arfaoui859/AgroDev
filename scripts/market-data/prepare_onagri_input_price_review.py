#!/usr/bin/env python3
"""Prepare human-reviewed ONAGRI agricultural-input price observations.

Only explicit product-name + price columns are imported. Rows are never uploaded
until a reviewer sets approved=true. The source date is taken from a date column
or, when absent, the source resource's last-modified date and clearly noted.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from urllib.request import Request, urlopen

CKAN_API = "https://catalog.data.gov.tn/api/3/action/package_show"
PACKAGES = ("pesticides", "prix-des-principaux-intrants-des-produits-agricoles")
USER_AGENT = "AgroGrowth-ONAGRI-Input-Price-Review/1.0"
NAME_ALIASES = {
    "nom commercial", "nom du produit", "nom produit", "produit", "designation",
    "désignation", "pesticide", "engrais", "product", "product name", "trade name",
    "اسم المنتج", "الاسم التجاري", "اسم المبيد", "اسم السماد", "المنتج", "المبيد",
}
PRICE_ALIASES = {
    "prix", "prix dt", "prix (dt)", "prix de vente", "prix unitaire", "prix public",
    "prix moyen", "prix de reference", "prix de référence", "montant", "price",
    "unit price", "retail price", "amount", "السعر", "الثمن", "سعر البيع", "السعر بالدينار",
}
DATE_ALIASES = {"date", "date du prix", "date de prix", "date observation", "date d'observation",
                "observed on", "observation date", "التاريخ", "تاريخ السعر"}
ACTIVE_ALIASES = {"matiere active", "matière active", "substance active", "active ingredient",
                  "ingredient actif", "المادة الفعالة", "المادة النشطة"}
PACKAGE_SIZE_ALIASES = {"contenance", "conditionnement", "taille emballage", "package size",
                        "pack size", "volume", "poids net", "net weight", "الحجم", "حجم العبوة"}
PACKAGE_UNIT_ALIASES = {"unite", "unité", "unit", "unite de vente", "unité de vente",
                        "package unit", "conditionnement unite", "وحدة", "وحدة العبوة"}


def clean(value) -> str:
    return re.sub(r"\s+", " ", str(value)).strip() if value is not None else ""


def norm(value) -> str:
    value = clean(value).casefold()
    value = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in value if not unicodedata.combining(ch))


def _find_column(headers: list[str], aliases: set[str]):
    normalized = [norm(header) for header in headers]
    for alias in aliases:
        wanted = norm(alias)
        if wanted in normalized:
            return normalized.index(wanted)
    for index, header in enumerate(normalized):
        if header and any(len(norm(alias)) >= 5 and norm(alias) in header for alias in aliases):
            return index
    return None


def parse_number(value):
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float, Decimal)):
        number = Decimal(str(value))
    else:
        raw = clean(value).replace("\\u00a0", " ").replace("TND", "").replace("DT", "").replace("د.ت", "")
        raw = raw.replace(" ", "").replace(",", ".")
        raw = re.sub(r"[^0-9.\\-]", "", raw)
        if not raw or raw in {".", "-", "-."}:
            return None
        try:
            number = Decimal(raw)
        except InvalidOperation:
            return None
    if not number.is_finite() or number <= 0:
        return None
    return float(number)


def parse_date(value):
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    raw = clean(value)
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(raw[:10], fmt).date().isoformat()
        except ValueError:
            pass
    return None


def stable_id(resource_id: str, product: str, price: float, observed_on: str, package: str) -> str:
    key = "|".join((resource_id, norm(product), str(price), observed_on, norm(package)))
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:32]


def fetch_bytes(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=45) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status} while fetching {url}")
        return response.read()


def package_resources(package_id: str) -> dict:
    payload = json.loads(fetch_bytes(f"{CKAN_API}?id={package_id}").decode("utf-8"))
    if not payload.get("success") or not isinstance(payload.get("result"), dict):
        raise RuntimeError(f"CKAN package_show failed for {package_id}")
    return payload["result"]


def parse_workbook(content: bytes, resource: dict, package_title: str):
    try:
        from openpyxl import load_workbook
    except ImportError as exc:
        raise RuntimeError("Install openpyxl to inspect ONAGRI XLSX resources") from exc
    import io

    workbook = load_workbook(filename=io.BytesIO(content), read_only=True, data_only=True)
    candidates, diagnostics = [], []
    resource_title = clean(resource.get("name") or resource.get("description") or package_title)
    resource_url = clean(resource.get("url"))
    resource_id = clean(resource.get("id"))
    source_key = "tn-onagri-input-prices-" + re.sub(r"[^a-z0-9]+", "-", resource_id.lower()).strip("-")
    resource_date = parse_date(resource.get("metadata_modified") or resource.get("last_modified"))

    for sheet in workbook.worksheets:
        header_row, indexes, samples = None, None, []
        for row_number, row in enumerate(sheet.iter_rows(values_only=True), start=1):
            values = list(row)
            labels = [clean(value) for value in values]
            if not any(labels):
                continue
            samples.append(labels[:20])
            name_idx = _find_column(labels, NAME_ALIASES)
            price_idx = _find_column(labels, PRICE_ALIASES)
            if name_idx is not None and price_idx is not None:
                header_row = row_number
                indexes = {
                    "name": name_idx, "price": price_idx,
                    "date": _find_column(labels, DATE_ALIASES),
                    "active": _find_column(labels, ACTIVE_ALIASES),
                    "package_size": _find_column(labels, PACKAGE_SIZE_ALIASES),
                    "package_unit": _find_column(labels, PACKAGE_UNIT_ALIASES),
                }
                break
            if row_number >= 20:
                break
        if header_row is None or indexes is None:
            diagnostics.append({"resource": resource_title, "sheet": sheet.title,
                                "status": "manual_price_column_mapping_required", "sample_rows": samples[:8]})
            continue

        for row_number, row in enumerate(sheet.iter_rows(min_row=header_row + 1, values_only=True), start=header_row + 1):
            values = list(row)
            def at(key):
                idx = indexes[key]
                return values[idx] if idx is not None and idx < len(values) else None
            product_name = clean(at("name"))
            price = parse_number(at("price"))
            if len(product_name) < 2 or price is None:
                continue
            observed_on = parse_date(at("date")) or resource_date
            if not observed_on:
                diagnostics.append({"resource": resource_title, "sheet": sheet.title, "row": row_number,
                                    "status": "missing_observation_date"})
                continue
            package_size = parse_number(at("package_size"))
            package_unit = clean(at("package_unit")) or None
            package_label = f"{package_size} {package_unit or ''}".strip() if package_size else (package_unit or "")
            candidates.append({
                "external_id": stable_id(resource_id, product_name, price, observed_on, package_label),
                "product_name": product_name[:180],
                "product_type": "pesticide" if "pestic" in norm(package_title + " " + resource_title + " " + sheet.title) else ("fertilizer" if any(term in norm(package_title + " " + resource_title + " " + sheet.title) for term in ("engrais", "fertilizer", "fertilisant")) else "other"),
                "active_ingredient": clean(at("active"))[:250] or None,
                "package_size": package_size,
                "package_unit": package_unit,
                "price": price,
                "currency": "TND",
                "observed_on": observed_on,
                "source_key": source_key,
                "source_name": resource_title[:160],
                "source_url": resource_url,
                "source_type": "official_open_data",
                "approved": False,
                "review_note": "Verify that the source price is per package or unit, confirm the date and package size, then set approved=true.",
                "source_sheet": sheet.title,
                "source_row": row_number,
            })
    workbook.close()
    unique = {(row["source_key"], row["external_id"]): row for row in candidates}
    return list(unique.values()), diagnostics


def discover_review():
    all_rows, all_diagnostics, sources = [], [], []
    for package_id in PACKAGES:
        package = package_resources(package_id)
        resources = [r for r in package.get("resources", [])
                     if clean(r.get("format")).upper() == "XLSX" or "spreadsheetml" in clean(r.get("mimetype")).lower()]
        for resource in resources:
            url = clean(resource.get("url"))
            if not url.startswith("https://"):
                continue
            rows, diagnostics = parse_workbook(fetch_bytes(url), resource, clean(package.get("title") or package_id))
            all_rows.extend(rows)
            all_diagnostics.extend(diagnostics)
            sources.append({"package": package_id, "resource_id": resource.get("id"),
                            "name": resource.get("name"), "url": url, "candidate_count": len(rows)})
    return {"generated_at": datetime.utcnow().isoformat() + "Z",
            "policy": {"automatic_upload": False, "approval_required": True,
                       "note": "Only manually approved, source-backed price observations can be uploaded."},
            "sources": sources, "prices": all_rows, "diagnostics": all_diagnostics}


def upload_reviewed(path: str):
    with open(path, "r", encoding="utf-8") as stream:
        review = json.load(stream)
    approved = [row for row in review.get("prices", []) if row.get("approved") is True]
    if not approved:
        raise RuntimeError("No price rows have approved=true; refusing an empty upload")
    api = os.environ.get("AGROGROWTH_API_URL", "").rstrip("/")
    token = os.environ.get("AGROGROWTH_ADMIN_TOKEN", "")
    if not api or not token:
        raise RuntimeError("Set AGROGROWTH_API_URL and AGROGROWTH_ADMIN_TOKEN")
    groups = {}
    for row in approved:
        groups.setdefault(row["source_key"], []).append(row)
    for source_key, rows in groups.items():
        first = rows[0]
        payload = {
            "source_key": source_key, "source_name": first["source_name"], "source_url": first["source_url"],
            "source_type": "official_open_data", "verification_status": "official-source",
            "prices": [{key: row.get(key) for key in ("external_id", "product_name", "product_type",
                "active_ingredient", "package_size", "package_unit", "price", "currency", "observed_on")} for row in rows],
        }
        request = Request(api + "/api/agro-market/ingest/input-prices",
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}", "User-Agent": USER_AGENT},
            method="POST")
        with urlopen(request, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
            if response.status >= 300 or not result.get("success"):
                raise RuntimeError(f"Input-price ingestion failed for {source_key}: {result}")
            print(json.dumps(result, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="onagri-input-price-review.json")
    parser.add_argument("--upload-reviewed")
    args = parser.parse_args()
    if args.upload_reviewed:
        upload_reviewed(args.upload_reviewed)
        return
    review = discover_review()
    with open(args.output, "w", encoding="utf-8") as stream:
        json.dump(review, stream, ensure_ascii=False, indent=2)
    print(f"Wrote {len(review['prices'])} unapproved price candidates to {args.output}")
    print(f"Manual review required for {len(review['diagnostics'])} rows/sheets", file=sys.stderr)


if __name__ == "__main__":
    main()
