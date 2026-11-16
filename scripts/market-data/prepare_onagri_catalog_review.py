#!/usr/bin/env python3
"""Prepare a human-reviewed ONAGRI agricultural-input catalog import.

The ONAGRI CKAN workbooks have multiple layouts and are not a pesticide
homologation certificate. This tool discovers XLSX resources, extracts only
rows with an explicit product-name column, and writes candidates marked
approved=false / registration_status=unverified. It never uploads candidates
automatically. A reviewer must explicitly approve rows before --upload-reviewed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from urllib.request import Request, urlopen

CKAN_API = "https://catalog.data.gov.tn/api/3/action/package_show"
PACKAGES = ("pesticides", "engrais", "prix-des-principaux-intrants-des-produits-agricoles")
USER_AGENT = "AgroGrowth-ONAGRI-Catalog-Review/1.0 (+official-open-data-review)"
NAME_ALIASES = {"nom commercial", "nom du produit", "nom produit", "produit", "designation", "désignation", "pesticide", "engrais", "اسم المنتج", "الاسم التجاري", "اسم المبيد", "اسم السماد", "المبيد", "السماد", "المنتج"}
ACTIVE_ALIASES = {"matiere active", "matiere active principale", "substance active", "active ingredient", "ingredient actif", "المادة الفعالة", "المادة النشطة"}
COMPOSITION_ALIASES = {"composition", "composition npk", "formulation", "التركيبة"}
MANUFACTURER_ALIASES = {"fabricant", "fournisseur", "societe", "société", "manufacturer", "الشركة"}
REGISTRATION_ALIASES = {"numero homologation", "n homologation", "numero agrement", "registration number", "رقم التسجيل", "رقم المصادقة"}
CROP_ALIASES = {"culture", "cultures", "culture cible", "cultures cibles", "target crops", "المحصول", "المحاصيل"}


def clean(value) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def norm(value) -> str:
    value = clean(value).casefold()
    value = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in value if not unicodedata.combining(ch))


def stable_id(resource_id: str, trade_name: str, ingredient: str = "") -> str:
    key = "|".join((resource_id, norm(trade_name), norm(ingredient)))
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


def classify_product_type(*labels: str) -> str:
    value = norm(" ".join(labels))
    if any(word in value for word in ("pesticide", "pesticides", "herbicide", "insecticide", "fongicide", "fungicide", "مبيد")):
        return "pesticide"
    if any(word in value for word in ("engrais", "fertilizer", "fertilisant", "ammonitre", "dap", "phosphate", "سماد")):
        return "fertilizer"
    if any(word in value for word in ("semence", "seed", "grain", "بذور")):
        return "seed"
    if any(word in value for word in ("plant", "plants", "plantule", "شتلة", "شتلات")):
        return "seedling"
    if any(word in value for word in ("amendement", "compost", "soil amendment", "محسن تربة")):
        return "soil_amendment"
    if any(word in value for word in ("outillage", "outil", "equipment", "materiel", "matériel", "mecanisation")):
        return "equipment"
    return "other"


def _find_column(headers: list[str], aliases: set[str]):
    normalized = [norm(header) for header in headers]
    for alias in aliases:
        wanted = norm(alias)
        if wanted in normalized:
            return normalized.index(wanted)
    for index, header in enumerate(normalized):
        if header and any(len(norm(alias)) >= 6 and norm(alias) in header for alias in aliases):
            return index
    return None


def parse_workbook(content: bytes, resource: dict, package_title: str) -> tuple[list[dict], list[dict]]:
    try:
        from openpyxl import load_workbook
    except ImportError as exc:
        raise RuntimeError("Install openpyxl to inspect ONAGRI XLSX resources") from exc

    import io
    workbook = load_workbook(filename=io.BytesIO(content), read_only=True, data_only=True)
    candidates, diagnostics = [], []
    resource_title = clean(resource.get("name") or resource.get("description") or "ONAGRI resource")
    resource_url = clean(resource.get("url"))
    resource_id = clean(resource.get("id"))
    source_key = "tn-onagri-catalog-" + re.sub(r"[^a-z0-9]+", "-", resource_id.lower()).strip("-")
    for sheet in workbook.worksheets:
        sample, header_row, indexes = [], None, None
        for row_number, row in enumerate(sheet.iter_rows(values_only=True), start=1):
            values = [clean(value) for value in row]
            if not any(values):
                continue
            sample.append(values[:20])
            name_index = _find_column(values, NAME_ALIASES)
            if name_index is not None:
                header_row = row_number
                indexes = {
                    "name": name_index, "active": _find_column(values, ACTIVE_ALIASES),
                    "composition": _find_column(values, COMPOSITION_ALIASES),
                    "manufacturer": _find_column(values, MANUFACTURER_ALIASES),
                    "registration": _find_column(values, REGISTRATION_ALIASES),
                    "crops": _find_column(values, CROP_ALIASES),
                }
                break
            if row_number >= 15:
                break
        if header_row is None or indexes is None:
            diagnostics.append({"resource": resource_title, "sheet": sheet.title, "status": "manual_mapping_required", "sample_rows": sample[:8]})
            continue
        for row_number, row in enumerate(sheet.iter_rows(min_row=header_row + 1, values_only=True), start=header_row + 1):
            values = list(row)
            def value_at(key):
                index = indexes[key]
                return clean(values[index]) if index is not None and index < len(values) else ""
            trade_name = value_at("name")
            if not trade_name or len(trade_name) < 2:
                continue
            ingredient = value_at("active")
            product_type = classify_product_type(package_title, resource_title, sheet.title)
            if product_type == "other":
                product_type = classify_product_type(trade_name, ingredient)
            if product_type == "equipment":
                product_type = "other"
            candidates.append({
                "external_id": stable_id(resource_id, trade_name, ingredient),
                "product_type": product_type, "trade_name": trade_name[:180],
                "active_ingredient": ingredient[:250] or None,
                "composition": value_at("composition")[:500] or None,
                "manufacturer": value_at("manufacturer")[:180] or None,
                "registration_number": value_at("registration")[:100] or None,
                "registration_status": "unverified",
                "target_crops": [value_at("crops")[:100]] if value_at("crops") else [],
                "target_pests_diseases": [], "approved_uses": [], "label_url": None,
                "active": True, "approved": False,
                "review_note": "Review product identity and cross-check pesticide registration against the Ministry's latest homologation register before approval.",
                "source_key": source_key, "source_name": resource_title[:160], "source_url": resource_url,
                "source_type": "official_open_data",
                "source_updated_at": clean(resource.get("metadata_modified") or resource.get("last_modified")) or None,
                "source_sheet": sheet.title, "source_row": row_number,
            })
    workbook.close()
    unique = {}
    for item in candidates:
        unique[(item["source_key"], item["external_id"])] = item
    return list(unique.values()), diagnostics


def discover_review() -> dict:
    all_candidates, all_diagnostics, sources = [], [], []
    for package_id in PACKAGES:
        package = package_resources(package_id)
        resources = [r for r in package.get("resources", []) if clean(r.get("format")).upper() == "XLSX" or "spreadsheetml" in clean(r.get("mimetype")).lower()]
        for resource in resources:
            url = clean(resource.get("url"))
            if not url.startswith("https://"):
                continue
            candidates, diagnostics = parse_workbook(fetch_bytes(url), resource, clean(package.get("title") or package_id))
            all_candidates.extend(candidates)
            all_diagnostics.extend(diagnostics)
            sources.append({"package": package_id, "resource_id": resource.get("id"), "name": resource.get("name"), "url": url, "candidate_count": len(candidates)})
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "policy": {"automatic_upload": False, "registration_status_default": "unverified", "approval_required": True,
                   "note": "ONAGRI catalog/pricing spreadsheets are not treated as proof of current pesticide homologation."},
        "sources": sources, "products": all_candidates, "diagnostics": all_diagnostics,
    }


def upload_reviewed(path: str) -> None:
    with open(path, "r", encoding="utf-8") as stream:
        review = json.load(stream)
    approved = [row for row in review.get("products", []) if row.get("approved") is True]
    if not approved:
        raise RuntimeError("No products have approved=true; refusing an empty upload")
    api = os.environ.get("AGROGROWTH_API_URL", "").rstrip("/")
    token = os.environ.get("AGROGROWTH_ADMIN_TOKEN", "")
    if not api or not token:
        raise RuntimeError("Set AGROGROWTH_API_URL and AGROGROWTH_ADMIN_TOKEN")
    groups = {}
    for row in approved:
        status = row.get("registration_status", "unverified")
        if status not in {"unverified", "registered_tunisia", "expired", "prohibited", "not_applicable"}:
            raise RuntimeError(f"Invalid registration_status for {row.get('trade_name')}")
        key = row.get("source_key")
        if not key:
            raise RuntimeError("Approved product has no source_key")
        groups.setdefault(key, []).append(row)
    for source_key, rows in groups.items():
        first = rows[0]
        payload = {
            "source_key": source_key, "source_name": first["source_name"], "source_url": first["source_url"],
            "source_type": "official_open_data",
            "products": [{k: v for k, v in row.items() if k in {
                "external_id", "product_type", "trade_name", "active_ingredient", "composition",
                "manufacturer", "registration_number", "registration_status", "target_crops",
                "target_pests_diseases", "approved_uses", "label_url", "active",
            }} for row in rows],
        }
        request = Request(api + "/api/agro-market/ingest/products",
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}", "User-Agent": USER_AGENT},
            method="POST")
        with urlopen(request, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
            if response.status >= 300 or not result.get("success"):
                raise RuntimeError(f"Catalog ingestion failed for {source_key}: {result}")
            print(json.dumps(result, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="onagri-catalog-review.json")
    parser.add_argument("--upload-reviewed", help="Upload only rows manually marked approved=true")
    args = parser.parse_args()
    if args.upload_reviewed:
        upload_reviewed(args.upload_reviewed)
        return
    review = discover_review()
    with open(args.output, "w", encoding="utf-8") as stream:
        json.dump(review, stream, ensure_ascii=False, indent=2)
    print(f"Wrote {len(review['products'])} unapproved product candidates to {args.output}")
    print(f"Manual mapping required for {len(review['diagnostics'])} workbook sheets", file=sys.stderr)


if __name__ == "__main__":
    main()
