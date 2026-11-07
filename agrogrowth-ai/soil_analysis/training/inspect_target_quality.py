from pathlib import Path
import json
import pandas as pd

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data" / "processed" / "iSDA_soil_cleaned.csv"
OUT = BASE / "data" / "processed"

df = pd.read_csv(DATA)

targets = [
    "ph",
    "carbon_organic",
    "nitrogen_total",
    "potassium_extractable",
    "electrical_conductivity",
    "phosphorus_extractable",
    "zinc_extractable",
]

report = {}

for target in targets:
    valid = df[df[target].notna()].copy()
    q1 = valid[target].quantile(0.25)
    q3 = valid[target].quantile(0.75)
    iqr = q3 - q1

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    suspicious = valid[
        (valid[target] < lower) |
        (valid[target] > upper)
    ]

    report[target] = {
        "count": int(len(valid)),
        "q1": float(q1),
        "median": float(valid[target].median()),
        "q3": float(q3),
        "iqr_lower_bound": float(lower),
        "iqr_upper_bound": float(upper),
        "suspicious_count": int(len(suspicious)),
        "suspicious_by_source": (
            suspicious["source"].value_counts().to_dict()
        ),
        "suspicious_examples": suspicious[
            ["source", "latitude", "longitude",
             "horizon_upper", "horizon_lower", target]
        ].head(10).to_dict("records"),
    }

OUT.mkdir(parents=True, exist_ok=True)

with open(
    OUT / "target_quality_report.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

print(json.dumps(report, indent=2, ensure_ascii=False))
print("\nSaved: target_quality_report.json")