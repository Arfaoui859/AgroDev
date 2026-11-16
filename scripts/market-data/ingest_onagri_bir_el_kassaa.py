#!/usr/bin/env python3
"""Import the latest published ONAGRI Bir El Kassaa monthly mercuriales.

Uses only Python's standard library. It imports monthly aggregate prices (not
daily quotes), preserves the source HTML row, and never invents min/max prices.
"""
from __future__ import annotations

import calendar
import json
import os
import re
import sys
import unicodedata
from datetime import date
from html.parser import HTMLParser
from urllib.parse import urljoin
from urllib.request import Request, urlopen

INDEX_URL = "https://www.onagri.nat.tn/Marche-de-gros-bir-el-kasaa/fr/62"
SOURCE_KEY = "tn-onagri-bir-el-kassaa"
MONTHS = {
    "janvier": 1, "fevrier": 2, "février": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "aout": 8, "août": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12, "décembre": 12,
}
ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")


def fetch(url: str) -> str:
    req = Request(url, headers={"User-Agent": "AgroGrowth-ONAGRI-Market-Collector/1.0 (+official-source-monitoring)"})
    with urlopen(req, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"ONAGRI returned HTTP {response.status} for {url}")
        return response.read().decode("utf-8", errors="replace")


class IndexParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self._href = None
        self._text = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            self._href = dict(attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            label = " ".join(" ".join(self._text).split())
            if "Mercuriale Bir El Kassaa" in label:
                self.links.append((label, self._href))
            self._href = None
            self._text = []


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows = []
        self._row = None
        self._cell = None

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag == "tr":
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in ("td", "th") and self._cell is not None and self._row is not None:
            self._row.append(" ".join(" ".join(self._cell).split()))
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self._row:
                self.rows.append(self._row)
            self._row = None
            self._cell = None


def parse_number(value: str):
    value = (value or "").translate(ARABIC_DIGITS).replace("\u00a0", " ").strip()
    value = value.replace("%", "").replace(" ", "").replace(",", ".")
    value = re.sub(r"[^0-9.-]", "", value)
    if not value or value in ("-", ".", "-."):
        return None
    try:
        return float(value)
    except ValueError:
        return None


def month_from_title(title: str):
    normalized = title.lower()
    year_match = re.search(r"20\d{2}", normalized)
    if not year_match:
        return None
    for name, month in MONTHS.items():
        if re.search(rf"\b{re.escape(name)}\b", normalized):
            return int(year_match.group()), month
    return None


def slug(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "commodity"


def extract_prices(html: str, title: str, document_url: str):
    period = month_from_title(title)
    if not period:
        raise ValueError(f"Cannot determine month/year from ONAGRI title: {title}")
    year, month = period
    start = date(year, month, 1)
    end = date(year, month, calendar.monthrange(year, month)[1])
    parser = TableParser()
    parser.feed(html)
    prices = []
    for cells in parser.rows:
        if len(cells) < 8:
            continue
        cells = cells[-8:]
        # The official table order is: observation days, price change %,
        # price 2025, price 2026, supply change %, supply 2025, supply 2026,
        # commodity name. The displayed report title supplies the year.
        crop = cells[7].strip()
        days = parse_number(cells[0])
        price_change = parse_number(cells[1])
        price_2026_millimes = parse_number(cells[3])
        supply_change = parse_number(cells[4])
        supply_2026_tons = parse_number(cells[6])
        if not crop or price_2026_millimes is None or price_2026_millimes <= 0:
            continue
        prices.append({
            "external_id": f"{year}-{month:02d}:{slug(crop)}",
            "crop_name": crop,
            "market_location": "Bir El Kassaa",
            "price_kind": "wholesale",
            "price_per_kg": round(price_2026_millimes / 1000.0, 3),
            "price_date": start.isoformat(),
            "period_start": start.isoformat(),
            "period_end": end.isoformat(),
            "aggregation_period": "monthly",
            "unit": "kg",
            "currency": "TND",
            "supply_quantity_tons": supply_2026_tons,
            "supply_change_percent": supply_change,
            "price_change_percent": price_change,
            "observation_days": int(days) if days is not None else None,
            "raw_source": {
                "document_title": title,
                "document_url": document_url,
                "price_2025_millimes_per_kg": parse_number(cells[2]),
                "price_2026_millimes_per_kg": price_2026_millimes,
                "supply_2025_tons": parse_number(cells[5]),
                "supply_2026_tons": supply_2026_tons,
                "source_cells": cells,
            },
        })
    return prices


def main():
    index_html = fetch(INDEX_URL)
    index = IndexParser()
    index.feed(index_html)
    # ONAGRI lists the newest monthly mercuriales first. Keep a small rolling
    # window to backfill recent months safely; unique source IDs make reruns safe.
    reports = []
    seen = set()
    for title, href in index.links:
        url = urljoin(INDEX_URL, href)
        if url in seen:
            continue
        seen.add(url)
        if month_from_title(title):
            reports.append((title, url))
        if len(reports) == 6:
            break
    if not reports:
        raise RuntimeError("No monthly Mercuriale Bir El Kassaa documents found on the official ONAGRI index")
    all_prices = []
    for title, url in reports:
        parsed = extract_prices(fetch(url), title, url)
        all_prices.extend(parsed)
        print(f"Parsed {len(parsed)} monthly commodity rows from {title}", file=sys.stderr)
    # Keep only the latest occurrence of each period/crop if the publisher repeats rows.
    unique = {row["external_id"]: row for row in all_prices}
    payload = {
        "source_key": SOURCE_KEY,
        "source_name": "ONAGRI - Mercuriale du marché de gros de Bir El Kassaa",
        "source_url": INDEX_URL,
        "source_type": "permitted_scrape",
        "verification_status": "official-source",
        "prices": list(unique.values()),
    }
    if os.getenv("DRY_RUN", "").lower() in ("1", "true", "yes"):
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return
    api = os.environ.get("AGROGROWTH_API_URL", "").rstrip("/")
    token = os.environ.get("AGROGROWTH_ADMIN_TOKEN", "")
    if not api or not token:
        raise RuntimeError("Set AGROGROWTH_API_URL and AGROGROWTH_ADMIN_TOKEN, or use DRY_RUN=1")
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = Request(
        api + "/api/agro-market/ingest/market-prices",
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        method="POST",
    )
    with urlopen(req, timeout=60) as response:
        result = json.loads(response.read().decode("utf-8"))
        print(json.dumps(result, ensure_ascii=False))
        if response.status >= 300 or not result.get("success"):
            raise RuntimeError("AgroGrowth ingestion endpoint did not confirm success")


if __name__ == "__main__":
    main()
