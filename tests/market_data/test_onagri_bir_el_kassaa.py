import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "market-data" / "ingest_onagri_bir_el_kassaa.py"
SPEC = importlib.util.spec_from_file_location("onagri_collector", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class OnagriBirElKassaaParserTests(unittest.TestCase):
    def test_month_title(self):
        self.assertEqual(MODULE.month_from_title("Mercuriale Bir El Kassaa Juillet 2026"), (2026, 7))
        self.assertEqual(MODULE.month_from_title("Mercuriale Bir El Kassaa Mars 2026"), (2026, 3))
        self.assertIsNone(MODULE.month_from_title("Mercuriale sans période"))

    def test_monthly_average_and_supply_are_normalized(self):
        html = """
        <table><tr>
          <td>27</td><td>14 %</td><td>2 021</td><td>2 307</td>
          <td>4 %</td><td>500</td><td>522</td><td>فلفل حلو</td>
        </tr></table>
        """
        rows = MODULE.extract_prices(
            html, "Mercuriale Bir El Kassaa Juillet 2026",
            "https://www.onagri.nat.tn/uploads/report.html",
        )
        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(row["market_location"], "Bir El Kassaa")
        self.assertEqual(row["aggregation_period"], "monthly")
        self.assertEqual(row["price_date"], "2026-07-01")
        self.assertEqual(row["period_end"], "2026-07-31")
        self.assertEqual(row["price_per_kg"], 2.307)
        self.assertEqual(row["previous_year_price"], 2.021)
        self.assertEqual(row["supply_quantity_tons"], 522.0)
        self.assertEqual(row["supply_change_percent"], 4.0)
        self.assertEqual(row["price_change_percent"], 14.0)
        self.assertEqual(row["observation_days"], 27)
        self.assertNotIn("price_min", row)
        self.assertNotIn("price_max", row)
        self.assertIn("document_url", row["raw_source"])

    def test_arabic_commodity_ids_are_stable_and_distinct(self):
        self.assertNotEqual(MODULE.slug("طماطم"), MODULE.slug("بطاطا"))
        self.assertEqual(MODULE.slug("طماطم"), MODULE.slug("طماطم"))

    def test_number_parser_handles_arabic_digits_and_spaces(self):
        self.assertEqual(MODULE.parse_number("٨ ٠٠٠"), 8000.0)
        self.assertEqual(MODULE.parse_number("-12 %"), -12.0)


if __name__ == "__main__":
    unittest.main()
