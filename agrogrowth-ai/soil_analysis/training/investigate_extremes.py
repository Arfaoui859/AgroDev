from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data/processed/iSDA_soil_cleaned.csv"
OUT = BASE / "data/processed"

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

for target in targets:
    print(f"\n{'=' * 65}")
    print(f"TARGET: {target}")
    print("=" * 65)

    valid = df.dropna(subset=[target])

    print("\nQuantiles:")
    print(valid[target].quantile([
        0, 0.001, 0.01, 0.05, 0.5, 0.95, 0.99, 0.999, 1
    ]))

    print("\nDistribution by source:")
    print(
        valid.groupby("source")[target]
        .agg(["count", "min", "median", "max"])
    )

    print("\nHighest 10 values:")
    print(
        valid.nlargest(10, target)[
            [
                "source",
                "latitude",
                "longitude",
                "horizon_upper",
                "horizon_lower",
                target,
            ]
        ].to_string(index=False)
    )

OUT.mkdir(parents=True, exist_ok=True)

print("\nInvestigation completed. Original data unchanged.")