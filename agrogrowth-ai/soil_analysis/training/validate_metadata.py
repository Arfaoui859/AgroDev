
from pathlib import Path
import pandas as pd
import json

BASE = Path(__file__).resolve().parents[1]
RAW = BASE / "data" / "raw"
OUT = BASE / "data" / "processed"

data = pd.read_csv(RAW / "iSDA_soil_data.csv")
metadata = pd.read_csv(RAW / "iSDA_soil_metadata.csv")

<<<<<<< HEAD
# Explicit corrections documented for this dataset.
corrections = {
    "longitude": "Longitude of soil sampling location",
    "latitude": "Latitude of soil sampling location",
=======
# Metadata naming differences
aliases = {
>>>>>>> b049e4d ( ai soil)
    "potassium_etractable": "potassium_extractable",
    "zn_mehlich3": "zinc_extractable",
}

<<<<<<< HEAD
metadata_report = {
    "csv_columns": list(data.columns),
    "metadata_columns": metadata["column_name"].tolist(),
    "corrections_required": corrections,
    "unmatched_metadata_names": [
        name for name in metadata["column_name"]
        if name not in data.columns
        and name not in corrections
    ],
    "missing_csv_columns": [
        name for name in data.columns
        if name not in metadata["column_name"]
        and name not in corrections.values()
    ],
    "units": dict(zip(metadata["column_name"], metadata["unit"])),
    "status": "review_required_before_training"
=======
metadata_names = set(metadata["column_name"].dropna())
csv_names = set(data.columns)

normalized_metadata_names = {
    aliases.get(name, name) for name in metadata_names
}

missing_in_csv = sorted(normalized_metadata_names - csv_names)
missing_in_metadata = sorted(csv_names - normalized_metadata_names)

units = {}
for _, row in metadata.iterrows():
    name = aliases.get(row["column_name"], row["column_name"])
    unit = row["unit"]
    units[name] = None if pd.isna(unit) else str(unit)

report = {
    "rows": len(data),
    "columns": len(data.columns),
    "metadata_aliases_applied": aliases,
    "missing_in_csv": missing_in_csv,
    "missing_in_metadata": missing_in_metadata,
    "units": units,
    "targets_candidate_counts": {
        col: int(data[col].notna().sum())
        for col in [
            "ph",
            "carbon_organic",
            "nitrogen_total",
            "potassium_extractable",
            "electrical_conductivity",
            "phosphorus_extractable",
            "zinc_extractable"
        ]
    },
    "status": (
        "column_mapping_valid"
        if not missing_in_csv and not missing_in_metadata
        else "mapping_review_required"
    )
>>>>>>> b049e4d ( ai soil)
}

OUT.mkdir(parents=True, exist_ok=True)

with open(OUT / "metadata_validation.json", "w", encoding="utf-8") as f:
<<<<<<< HEAD
    json.dump(metadata_report, f, indent=2, ensure_ascii=False)

print(json.dumps(metadata_report, indent=2, ensure_ascii=False))
=======
    json.dump(report, f, indent=2, ensure_ascii=False)

print(json.dumps(report, indent=2, ensure_ascii=False))
>>>>>>> b049e4d ( ai soil)
