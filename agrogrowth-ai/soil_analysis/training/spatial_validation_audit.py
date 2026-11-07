
import json
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_FILE = BASE_DIR / "data/processed/wetchem_reference.csv"
OUTPUT_FILE = BASE_DIR / "data/processed/spatial_validation_audit.json"

df = pd.read_csv(DATA_FILE)

required = [
    "longitude",
    "latitude",
    "horizon_upper",
    "horizon_lower",
]

missing_columns = [c for c in required if c not in df.columns]
if missing_columns:
    raise ValueError(f"Missing columns: {missing_columns}")

geo = df.dropna(subset=["longitude", "latitude"]).copy()

# Exact coordinate groups: samples collected at identical coordinates.
exact_groups = (
    geo.groupby(["longitude", "latitude"])
    .size()
)

# Same coordinate and same depth interval.
depth_groups = (
    geo.groupby([
        "longitude",
        "latitude",
        "horizon_upper",
        "horizon_lower",
    ])
    .size()
)

def grid_report(cell_size):
    data = geo.copy()

    data["grid_lon"] = (
        data["longitude"] / cell_size
    ).apply(lambda x: int(x // 1))

    data["grid_lat"] = (
        data["latitude"] / cell_size
    ).apply(lambda x: int(x // 1))

    groups = data.groupby(["grid_lon", "grid_lat"]).size()

    return {
        "cell_size_degrees": cell_size,
        "number_of_spatial_blocks": int(len(groups)),
        "blocks_with_one_sample": int((groups == 1).sum()),
        "blocks_with_multiple_samples": int((groups > 1).sum()),
        "largest_block_samples": int(groups.max()),
        "samples_in_blocks": int(groups.sum()),
    }

report = {
    "dataset": str(DATA_FILE),
    "total_rows": int(len(df)),
    "rows_with_coordinates": int(len(geo)),
    "coordinate_summary": {
        "unique_exact_locations": int(len(exact_groups)),
        "locations_with_multiple_samples": int(
            (exact_groups > 1).sum()
        ),
        "largest_exact_location_group": int(exact_groups.max()),
        "unique_location_depth_combinations": int(
            len(depth_groups)
        ),
        "location_depth_combinations_repeated": int(
            (depth_groups > 1).sum()
        ),
    },
    "geographic_extent": {
        "longitude_min": float(geo["longitude"].min()),
        "longitude_max": float(geo["longitude"].max()),
        "latitude_min": float(geo["latitude"].min()),
        "latitude_max": float(geo["latitude"].max()),
    },
    "spatial_grid_analysis": [
        grid_report(0.1),
        grid_report(0.25),
        grid_report(0.5),
    ],
    "depth_intervals": {
        f"{upper}-{lower}": int(count)
        for (upper, lower), count in (
            geo.groupby(["horizon_upper", "horizon_lower"]).size().items()
        )
    },
}

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE.write_text(
    json.dumps(report, indent=2, ensure_ascii=False),
    encoding="utf-8",
)

print(json.dumps(report, indent=2, ensure_ascii=False))
print(f"\nReport saved to: {OUTPUT_FILE}")
