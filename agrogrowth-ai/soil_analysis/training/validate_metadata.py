
from pathlib import Path
import json

import pandas as pd


BASE = Path(__file__).resolve().parents[1]
RAW = BASE / "data" / "raw"
OUT = BASE / "data" / "processed"

DATA_FILE = RAW / "iSDA_soil_data.csv"
METADATA_FILE = RAW / "iSDA_soil_metadata.csv"

# Normalize known naming differences between the dataset
# and its metadata. These are aliases, not fabricated columns.
ALIASES = {
    "potassium_etractable": "potassium_extractable",
    "zn_mehlich3": "zinc_extractable",
}

# The source metadata CSV labels these analytes as mg/kg, but the
# iSDA analytical metadata/FAQ documents total nitrogen and organic
# carbon in g/kg. Apply explicit, auditable unit corrections here.
UNIT_OVERRIDES = {
    "carbon_organic": "g/kg",
    "carbon_total": "g/kg",
    "nitrogen_total": "g/kg",
}

TARGET_COLUMNS = [
    "ph",
    "carbon_organic",
    "nitrogen_total",
    "potassium_extractable",
    "electrical_conductivity",
    "phosphorus_extractable",
    "zinc_extractable",
]


def main():
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_FILE}")

    if not METADATA_FILE.exists():
        raise FileNotFoundError(
            f"Metadata file not found: {METADATA_FILE}"
        )

    data = pd.read_csv(DATA_FILE)
    metadata = pd.read_csv(METADATA_FILE)

    if "column_name" not in metadata.columns:
        raise ValueError(
            "Metadata CSV must contain a 'column_name' column"
        )

    metadata_names = {
        str(name).strip()
        for name in metadata["column_name"].dropna()
    }

    csv_names = set(data.columns)

    normalized_metadata_names = {
        ALIASES.get(name, name)
        for name in metadata_names
    }

    missing_in_csv = sorted(
        normalized_metadata_names - csv_names
    )

    missing_in_metadata = sorted(
        csv_names - normalized_metadata_names
    )

    units = {}

    if "unit" in metadata.columns:
        for _, row in metadata.iterrows():
            raw_name = row["column_name"]

            if pd.isna(raw_name):
                continue

            name = str(raw_name).strip()
            normalized_name = ALIASES.get(name, name)

            unit = row["unit"]
            units[normalized_name] = (
                None if pd.isna(unit) else str(unit)
            )

    units.update(UNIT_OVERRIDES)

    target_candidate_counts = {
        column: int(data[column].notna().sum())
        for column in TARGET_COLUMNS
        if column in data.columns
    }

    missing_targets = sorted(
        set(TARGET_COLUMNS) - csv_names
    )

    report = {
        "rows": int(len(data)),
        "columns": int(len(data.columns)),
        "csv_columns": list(data.columns),
        "metadata_columns": sorted(metadata_names),
        "metadata_aliases_applied": ALIASES,
        "missing_in_csv": missing_in_csv,
        "missing_in_metadata": missing_in_metadata,
        "missing_target_columns": missing_targets,
        "units": units,
        "unit_overrides_applied": UNIT_OVERRIDES,
        "targets_candidate_counts": target_candidate_counts,
        "status": (
            "column_mapping_valid"
            if not missing_in_csv
            and not missing_in_metadata
            and not missing_targets
            else "mapping_review_required"
        ),
    }

    OUT.mkdir(parents=True, exist_ok=True)

    output_file = OUT / "metadata_validation.json"

    with output_file.open("w", encoding="utf-8") as file:
        json.dump(
            report,
            file,
            indent=2,
            ensure_ascii=False,
        )

    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"\nReport saved to: {output_file}")


if __name__ == "__main__":
    main()
