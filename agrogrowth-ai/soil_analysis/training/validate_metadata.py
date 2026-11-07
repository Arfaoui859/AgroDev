
from pathlib import Path
import pandas as pd
import json

BASE = Path(__file__).resolve().parents[1]
RAW = BASE / "data" / "raw"
OUT = BASE / "data" / "processed"

data = pd.read_csv(RAW / "iSDA_soil_data.csv")
metadata = pd.read_csv(RAW / "iSDA_soil_metadata.csv")

# Explicit corrections documented for this dataset.
corrections = {
    "longitude": "Longitude of soil sampling location",
    "latitude": "Latitude of soil sampling location",
    "potassium_etractable": "potassium_extractable",
    "zn_mehlich3": "zinc_extractable",
}

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
}

OUT.mkdir(parents=True, exist_ok=True)

with open(OUT / "metadata_validation.json", "w", encoding="utf-8") as f:
    json.dump(metadata_report, f, indent=2, ensure_ascii=False)

print(json.dumps(metadata_report, indent=2, ensure_ascii=False))
