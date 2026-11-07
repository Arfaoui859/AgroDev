
import json
from pathlib import Path

import pandas as pd
from sklearn.model_selection import GroupKFold

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_FILE = BASE_DIR / "data/processed/wetchem_reference.csv"
OUTPUT_FILE = BASE_DIR / "data/processed/spatial_split_audit.json"

TARGETS = [
    "ph",
    "carbon_organic",
    "nitrogen_total",
    "potassium_extractable",
    "electrical_conductivity",
    "phosphorus_extractable",
    "zinc_extractable",
]

GRID_SIZES = [0.25, 0.5]
N_SPLITS = 5

df = pd.read_csv(DATA_FILE)

required = ["longitude", "latitude"]
missing = [col for col in required if col not in df.columns]

if missing:
    raise ValueError(f"Missing coordinate columns: {missing}")

df = df.dropna(subset=required).copy()
results = {}

for cell_size in GRID_SIZES:
    data = df.copy()

    # Assign every sample to a geographic grid cell.
    data["block_lon"] = (
        data["longitude"] / cell_size
    ).apply(lambda value: int(value // 1))

    data["block_lat"] = (
        data["latitude"] / cell_size
    ).apply(lambda value: int(value // 1))

    data["spatial_block"] = (
        data["block_lon"].astype(str)
        + "_"
        + data["block_lat"].astype(str)
    )

    groups = data["spatial_block"]
    unique_groups = groups.nunique()

    if unique_groups < N_SPLITS:
        results[str(cell_size)] = {
            "status": "insufficient_spatial_blocks",
            "number_of_blocks": int(unique_groups),
        }
        continue

    splitter = GroupKFold(n_splits=N_SPLITS)
    folds = []

    for fold_number, (train_idx, test_idx) in enumerate(
        splitter.split(data, groups=groups),
        start=1,
    ):
        train = data.iloc[train_idx]
        test = data.iloc[test_idx]

        train_groups = set(train["spatial_block"])
        test_groups = set(test["spatial_block"])

        # Same geographic block must never appear in both sets.
        overlapping_blocks = train_groups.intersection(test_groups)

        # Exact coordinate overlap check.
        train_coords = set(
            zip(train["longitude"], train["latitude"])
        )
        test_coords = set(
            zip(test["longitude"], test["latitude"])
        )
        overlapping_coordinates = train_coords.intersection(
            test_coords
        )

        target_counts = {
            target: {
                "train": int(train[target].notna().sum()),
                "test": int(test[target].notna().sum()),
            }
            for target in TARGETS
            if target in data.columns
        }

        folds.append({
            "fold": fold_number,
            "train_rows": int(len(train)),
            "test_rows": int(len(test)),
            "train_blocks": int(len(train_groups)),
            "test_blocks": int(len(test_groups)),
            "overlapping_blocks": len(overlapping_blocks),
            "overlapping_exact_coordinates": len(
                overlapping_coordinates
            ),
            "target_counts": target_counts,
            "test_depth_distribution": {
                f"{upper}-{lower}": int(count)
                for (upper, lower), count in (
                    test.groupby(
                        ["horizon_upper", "horizon_lower"]
                    ).size().items()
                )
            } if {
                "horizon_upper", "horizon_lower"
            }.issubset(test.columns) else {},
        })

    block_sizes = groups.value_counts()

    results[str(cell_size)] = {
        "status": "completed",
        "number_of_blocks": int(unique_groups),
        "smallest_block": int(block_sizes.min()),
        "largest_block": int(block_sizes.max()),
        "average_samples_per_block": round(
            float(block_sizes.mean()), 2
        ),
        "folds": folds,
        "all_folds_have_zero_block_overlap": all(
            fold["overlapping_blocks"] == 0 for fold in folds
        ),
        "all_folds_have_zero_coordinate_overlap": all(
            fold["overlapping_exact_coordinates"] == 0
            for fold in folds
        ),
    }

report = {
    "dataset_rows": int(len(df)),
    "validation_method": "GroupKFold",
    "number_of_folds": N_SPLITS,
    "grouping_method": "fixed longitude/latitude grid cells",
    "grid_sizes_degrees": GRID_SIZES,
    "results": results,
    "training_performed": False,
}

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE.write_text(
    json.dumps(report, indent=2, ensure_ascii=False),
    encoding="utf-8",
)

print(json.dumps(report, indent=2, ensure_ascii=False))
print(f"\nReport saved to: {OUTPUT_FILE}")
