
from pathlib import Path
import json
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

DATA_FILE = RAW_DIR / "iSDA_soil_data.csv"
METADATA_FILE = RAW_DIR / "iSDA_soil_metadata.csv"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def read_csv(path):
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return pd.read_csv(path, encoding=encoding, low_memory=False)
        except UnicodeDecodeError:
            continue

    raise ValueError(f"Could not decode CSV: {path}")


def json_safe(value):
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    return str(value)


def audit_dataframe(df, name):
    report = {
        "name": name,
        "rows": int(df.shape[0]),
        "columns_count": int(df.shape[1]),
        "columns": list(df.columns),
        "duplicate_rows": int(df.duplicated().sum()),
        "fully_empty_rows": int(df.isna().all(axis=1).sum()),
        "missing_values": {
            col: int(count)
            for col, count in df.isna().sum().items()
        },
        "dtypes": {
            col: str(dtype)
            for col, dtype in df.dtypes.items()
        },
        "numeric_summary": {},
        "categorical_values": {},
    }

    numeric = df.select_dtypes(include="number")

    for col in numeric.columns:
        report["numeric_summary"][col] = {
            key: json_safe(value)
            for key, value in numeric[col].describe().items()
        }

    for col in df.select_dtypes(include=["object", "category"]).columns:
        report["categorical_values"][col] = {
            str(key): int(value)
            for key, value in df[col].value_counts(
                dropna=False
            ).head(30).items()
        }

    return report


def main():
    print("Loading original datasets...")

    data = read_csv(DATA_FILE)
    metadata = read_csv(METADATA_FILE)

    print("Auditing soil data...")
    data_report = audit_dataframe(data, "iSDA soil data")

    print("Auditing metadata...")
    metadata_report = audit_dataframe(
        metadata, "iSDA soil metadata"
    )

    # Conservative cleaning only:
    # remove completely empty rows and exact duplicate rows.
    cleaned = data.dropna(how="all").copy()
    rows_before_duplicates = len(cleaned)
    cleaned = cleaned.drop_duplicates().copy()

    cleaning_report = {
        "original_rows": int(len(data)),
        "rows_after_empty_row_removal": int(
            len(data.dropna(how="all"))
        ),
        "rows_after_duplicate_removal": int(len(cleaned)),
        "removed_empty_rows": int(
            data.isna().all(axis=1).sum()
        ),
        "removed_exact_duplicates": int(
            rows_before_duplicates - len(cleaned)
        ),
        "columns_preserved": list(cleaned.columns),
        "note": (
            "No imputation, unit conversion, outlier removal, "
            "or target selection performed."
        ),
    }

    cleaned.to_csv(
        PROCESSED_DIR / "iSDA_soil_cleaned.csv",
        index=False
    )

    report = {
        "dataset": data_report,
        "metadata": metadata_report,
        "cleaning": cleaning_report,
    }

    report_path = PROCESSED_DIR / "data_audit_report.json"

    with open(report_path, "w", encoding="utf-8") as file:
        json.dump(
            report,
            file,
            ensure_ascii=False,
            indent=2,
            default=json_safe
        )

    print("\nAUDIT COMPLETED")
    print(f"Original rows: {len(data)}")
    print(f"Cleaned rows: {len(cleaned)}")
    print(f"Columns: {len(cleaned.columns)}")
    print(f"\nCleaned data: {PROCESSED_DIR / 'iSDA_soil_cleaned.csv'}")
    print(f"Audit report: {report_path}")


if __name__ == "__main__":
    main()
