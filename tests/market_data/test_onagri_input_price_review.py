import io
import unittest
from datetime import date
from openpyxl import Workbook

from scripts.market_data.prepare_onagri_input_price_review import parse_workbook, parse_number, parse_date


class OnagriInputPriceReviewTests(unittest.TestCase):
    def workbook_bytes(self, rows):
        workbook = Workbook()
        sheet = workbook.active
        for row in rows:
            sheet.append(row)
        buffer = io.BytesIO()
        workbook.save(buffer)
        workbook.close()
        return buffer.getvalue()

    def test_extracts_explicit_product_price_and_date(self):
        content = self.workbook_bytes([
            ["Nom commercial", "Prix de vente (DT)", "Date", "Contenance", "Unité"],
            ["Herbicide A", "42,500", date(2026, 11, 10), 1, "L"],
        ])
        rows, diagnostics = parse_workbook(content, {
            "id": "resource-1", "name": "Prix pesticides", "url": "https://example.test/prices.xlsx",
            "metadata_modified": "2026-11-11T10:00:00",
        }, "Pesticides")
        self.assertEqual(diagnostics, [])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["product_name"], "Herbicide A")
        self.assertEqual(rows[0]["price"], 42.5)
        self.assertEqual(rows[0]["package_size"], 1.0)
        self.assertEqual(rows[0]["package_unit"], "L")
        self.assertEqual(rows[0]["observed_on"], "2026-11-10")
        self.assertFalse(rows[0]["approved"])

    def test_does_not_invent_price_when_no_price_column_exists(self):
        content = self.workbook_bytes([["Nom commercial", "Matière active"], ["Product B", "X"]])
        rows, diagnostics = parse_workbook(content, {
            "id": "resource-2", "name": "Catalogue", "url": "https://example.test/catalog.xlsx",
        }, "Pesticides")
        self.assertEqual(rows, [])
        self.assertEqual(diagnostics[0]["status"], "manual_price_column_mapping_required")

    def test_uses_resource_modified_date_only_as_fallback(self):
        content = self.workbook_bytes([["Produit", "Prix"], ["Product C", 18.75]])
        rows, _ = parse_workbook(content, {
            "id": "resource-3", "name": "Prices", "url": "https://example.test/prices.xlsx",
            "metadata_modified": "2026-10-30T09:00:00",
        }, "Agricultural inputs")
        self.assertEqual(rows[0]["observed_on"], "2026-10-30")

    def test_parse_helpers(self):
        self.assertEqual(parse_number("1 250,500 DT"), 1250.5)
        self.assertEqual(parse_date("17/11/2026"), "2026-11-17")


if __name__ == "__main__":
    unittest.main()
