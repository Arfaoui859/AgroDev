import importlib.util
import io
import unittest
from pathlib import Path
from openpyxl import Workbook

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "market-data" / "prepare_onagri_catalog_review.py"
SPEC = importlib.util.spec_from_file_location("onagri_catalog_review", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class OnagriCatalogReviewTests(unittest.TestCase):
    def workbook_bytes(self, rows):
        workbook = Workbook()
        sheet = workbook.active
        for row in rows:
            sheet.append(row)
        stream = io.BytesIO()
        workbook.save(stream)
        return stream.getvalue()

    def test_classifies_pesticide_and_fertilizer_sources(self):
        self.assertEqual(MODULE.classify_product_type("Pesticides", "Prix des herbicides"), "pesticide")
        self.assertEqual(MODULE.classify_product_type("engrais", "Prix des engrais"), "fertilizer")
        self.assertEqual(MODULE.classify_product_type("Semences", "Liste de semences"), "seed")

    def test_extracts_candidates_without_claiming_homologation(self):
        content = self.workbook_bytes([
            ["Liste ONAGRI"], ["Nom commercial", "Matière active", "Fabricant", "Culture"],
            ["Produit Alpha", "Substance A", "Fabricant X", "Tomate"],
            ["Produit Beta", "Substance B", "Fabricant Y", "Pomme de terre"],
        ])
        resource = {"id": "resource-123", "name": "Prix des insecticides", "url": "https://example.org/file.xlsx"}
        candidates, diagnostics = MODULE.parse_workbook(content, resource, "Pesticides")
        self.assertEqual(len(candidates), 2)
        self.assertEqual(candidates[0]["product_type"], "pesticide")
        self.assertEqual(candidates[0]["active_ingredient"], "Substance A")
        self.assertEqual(candidates[0]["registration_status"], "unverified")
        self.assertFalse(candidates[0]["approved"])
        self.assertEqual(candidates[0]["target_crops"], ["Tomate"])
        self.assertEqual(diagnostics, [])

    def test_unknown_workbook_layout_is_not_guessed(self):
        content = self.workbook_bytes([["Titre"], ["Colonne A", "Colonne B"], ["foo", "bar"]])
        resource = {"id": "resource-unknown", "name": "Workbook", "url": "https://example.org/file.xlsx"}
        candidates, diagnostics = MODULE.parse_workbook(content, resource, "ONAGRI")
        self.assertEqual(candidates, [])
        self.assertEqual(diagnostics[0]["status"], "manual_mapping_required")

    def test_external_ids_are_stable_and_source_scoped(self):
        first = MODULE.stable_id("resource-a", "Produit X", "Actif")
        self.assertEqual(first, MODULE.stable_id("resource-a", "Produit X", "Actif"))
        self.assertNotEqual(first, MODULE.stable_id("resource-b", "Produit X", "Actif"))


if __name__ == "__main__":
    unittest.main()
