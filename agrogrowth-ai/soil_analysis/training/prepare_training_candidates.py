from pathlib import Path
import json
import pandas as pd

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data/processed/iSDA_soil_cleaned.csv"
OUT = BASE / "data/processed"

df = pd.read_csv(DATA)

reference = df[df["source"] == "afsis_wetchem"].copy()
spectral = df[df["source"] == "afsis_spectral"].copy()

reference.to_csv(
    OUT / "wetchem_reference.csv",
    index=False
)

spectral.to_csv(
    OUT / "spectral_derived.csv",
    index=False
)

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
    "reference_dataset": {
        "source": "afsis_wetchem",
        "rows": len(reference),
        "targets": {
            col: int(reference[col].notna().sum())
            for col in targets
        },
    },
    "spectral_dataset": {
        "source": "afsis_spectral",
        "rows": len(spectral),
        "targets": {
            col: int(spectral[col].notna().sum())
            for col in targets
        },
    },
    "training_status": "not_trained",
    "warning": (
        "Spectral-derived values must not be treated as "
        "independent laboratory ground truth."
    ),
}

with open(
    OUT / "training_candidates_report.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

print(json.dumps(report, indent=2, ensure_ascii=False))
print("\nTraining candidates prepared. No model trained.")