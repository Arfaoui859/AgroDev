
import json
from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    ExtraTreesRegressor,
    HistGradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.dummy import DummyRegressor
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GroupKFold
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_FILE = BASE_DIR / "data/processed/wetchem_reference.csv"
OUTPUT_FILE = BASE_DIR / "data/processed/model_benchmark_report.json"

TARGETS = [
    "ph",
    "carbon_organic",
    "nitrogen_total",
    "potassium_extractable",
    "electrical_conductivity",
    "phosphorus_extractable",
    "zinc_extractable",
]

METADATA = {
    "longitude",
    "latitude",
    "start_date",
    "end_date",
    "source",
    "horizon_upper",
    "horizon_lower",
    "carbon_total",
    "block_lon",
    "block_lat",
    "spatial_block",
}

GRID_SIZE = 0.25
N_SPLITS = 5
RANDOM_STATE = 42

df = pd.read_csv(DATA_FILE)

required_columns = {
    "longitude",
    "latitude",
    "horizon_upper",
    "horizon_lower",
    *TARGETS,
}

missing_columns = required_columns - set(df.columns)

if missing_columns:
    raise ValueError(
        f"Missing required columns: {sorted(missing_columns)}"
    )

# Initial experiment: topsoil 0-20 cm only.
df = df[
    (df["horizon_upper"] == 0)
    & (df["horizon_lower"] == 20)
].copy()

df = df.dropna(subset=["longitude", "latitude"])

if df.empty:
    raise ValueError("No topsoil rows with valid coordinates.")

# Spatial grouping.
df["block_lon"] = np.floor(
    df["longitude"] / GRID_SIZE
).astype(int)

df["block_lat"] = np.floor(
    df["latitude"] / GRID_SIZE
).astype(int)

df["spatial_block"] = (
    df["block_lon"].astype(str)
    + "_"
    + df["block_lat"].astype(str)
)

# Candidate predictors:
# all numeric soil measurements, excluding metadata and spatial identifiers.
feature_columns = [
    col
    for col in df.select_dtypes(include="number").columns
    if col not in METADATA
    and df[col].notna().any()
]

if not feature_columns:
    raise ValueError("No numeric soil predictors found.")

models = {
    "median_baseline": DummyRegressor(strategy="median"),

    "random_forest": RandomForestRegressor(
        n_estimators=300,
        min_samples_leaf=2,
        max_features=0.8,
        n_jobs=-1,
        random_state=RANDOM_STATE,
    ),

    "extra_trees": ExtraTreesRegressor(
        n_estimators=300,
        min_samples_leaf=2,
        max_features=0.8,
        n_jobs=-1,
        random_state=RANDOM_STATE,
    ),

    "hist_gradient_boosting": HistGradientBoostingRegressor(
        max_iter=200,
        learning_rate=0.05,
        max_leaf_nodes=15,
        l2_regularization=1.0,
        early_stopping=False,
        random_state=RANDOM_STATE,
    ),
}

results = {
    "dataset": "afsis_wetchem",
    "depth_interval_cm": "0-20",
    "rows": int(len(df)),
    "spatial_grid_degrees": GRID_SIZE,
    "validation": "GroupKFold",
    "folds": N_SPLITS,
    "feature_policy": (
        "Other measured numeric soil properties; "
        "target excluded per experiment; metadata and coordinates excluded."
    ),
    "candidate_features": feature_columns,
    "targets": {},
    "production_models_saved": False,
}

for target in TARGETS:
    if target not in df.columns:
        continue

    subset = df.dropna(subset=[target]).copy()

    if subset.empty:
        results["targets"][target] = {
            "status": "no_target_samples",
        }
        continue

    # Exclude the current target from its own predictors.
    predictors = [
        col for col in feature_columns
        if col != target
    ]

    # Remove predictors with no values in this target's subset.
    predictors = [
        col for col in predictors
        if subset[col].notna().any()
    ]

    if not predictors:
        results["targets"][target] = {
            "status": "no_available_predictors",
            "samples": int(len(subset)),
        }
        continue

    X = subset[predictors].copy()
    y = subset[target].astype(float)
    groups = subset["spatial_block"]

    if groups.nunique() < N_SPLITS:
        results["targets"][target] = {
            "status": "insufficient_spatial_groups",
            "groups": int(groups.nunique()),
        }
        continue

    splitter = GroupKFold(n_splits=N_SPLITS)

    target_results = {
        "samples": int(len(subset)),
        "spatial_groups": int(groups.nunique()),
        "predictors": predictors,
        "models": {},
    }

    for model_name, estimator in models.items():
        predictions = np.full(len(subset), np.nan)
        fold_results = []

        for fold, (train_idx, test_idx) in enumerate(
            splitter.split(X, y, groups),
            start=1,
        ):
            pipeline = Pipeline([
                (
                    "imputer",
                    SimpleImputer(
                        strategy="median",
                        add_indicator=True,
                    ),
                ),
                ("model", estimator),
            ])

            X_train = X.iloc[train_idx]
            X_test = X.iloc[test_idx]
            y_train = y.iloc[train_idx]
            y_test = y.iloc[test_idx]

            pipeline.fit(X_train, y_train)

            fold_predictions = pipeline.predict(X_test)
            predictions[test_idx] = fold_predictions

            fold_results.append({
                "fold": fold,
                "train_samples": int(len(train_idx)),
                "test_samples": int(len(test_idx)),
                "mae": float(
                    mean_absolute_error(y_test, fold_predictions)
                ),
                "rmse": float(
                    np.sqrt(
                        mean_squared_error(y_test, fold_predictions)
                    )
                ),
                "r2": float(
                    r2_score(y_test, fold_predictions)
                ),
            })

        valid_predictions = np.isfinite(predictions)

        if not valid_predictions.all():
            raise RuntimeError(
                f"Incomplete out-of-fold predictions for {target}/{model_name}"
            )

        overall_mae = mean_absolute_error(y, predictions)
        overall_rmse = np.sqrt(mean_squared_error(y, predictions))
        overall_r2 = r2_score(y, predictions)

        target_results["models"][model_name] = {
            "fold_results": fold_results,
            "out_of_fold_metrics": {
                "mae": float(overall_mae),
                "rmse": float(overall_rmse),
                "r2": float(overall_r2),
                "evaluated_samples": int(valid_predictions.sum()),
            },
        }

    results["targets"][target] = target_results

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE.write_text(
    json.dumps(results, indent=2, ensure_ascii=False),
    encoding="utf-8",
)

print(json.dumps(results, indent=2, ensure_ascii=False))
print(f"\nReport saved to: {OUTPUT_FILE}")
