
from pathlib import Path
import pandas as pd
import json

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

report = {
    "total_rows": len(df),
    "source_distribution": (
        df["source"].value_counts(dropna=False).to_dict()
    ),
    "depth_distribution": (
        df.groupby(
            ["horizon_upper", "horizon_lower"],
            dropna=False
        ).size().reset_index(name="samples").to_dict("records")
    ),
    "targets": {},
}

for col in targets:
    values = df[col].dropna()

    report["targets"][col] = {
        "count": int(values.count()),
        "missing": int(df[col].isna().sum()),
        "min": float(values.min()) if len(values) else None,
        "median": float(values.median()) if len(values) else None,
        "max": float(values.max()) if len(values) else None,
        "by_source": {},
    }

    for source, group in df.groupby("source"):
        x = group[col].dropna()
        report["targets"][col]["by_source"][source] = {
            "count": int(len(x)),
            "median": float(x.median()) if len(x) else None,
        }

OUT.mkdir(parents=True, exist_ok=True)

with open(OUT / "dataset_profile.json", "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

print(json.dumps(report, indent=2, ensure_ascii=False))
print("\nSaved: dataset_profile.json")
