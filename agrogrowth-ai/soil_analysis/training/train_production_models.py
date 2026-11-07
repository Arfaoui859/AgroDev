
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn

from sklearn.ensemble import (
    RandomForestRegressor,
    ExtraTreesRegressor,
    HistGradientBoostingRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data/processed/wetchem_reference.csv"
OUTPUT_DIR = ROOT / "models/production"

RANDOM_STATE = 42
N_SPLITS = 5

MODEL_CONFIGS = {
    "ph": "random_forest",
    "carbon_organic": "random_forest",
    "nitrogen_total": "extra_trees",
    "electrical_conductivity": "random_forest",
    "phosphorus_extractable": "extra_trees",
    "potassium_extractable": "extra_trees",
    "zinc_extractable": "hist_gradient_boosting",
}

ANALYTE_COLUMNS = [
    "aluminium_extractable",
    "boron_extractable",
    "calcium_extractable",
    "carbon_organic",
    "carbon_total",
    "copper_extractable",
    "electrical_conductivity",
    "iron_extractable",
    "magnesium_extractable",
    "manganese_extractable",
    "nitrogen_total",
    "ph",
    "phosphorus_extractable",
    "potassium_extractable",
    "sodium_extractable",
    "sulphur_extractable",
    "zinc_extractable",
]


def make_model(model_name: str) -> Pipeline:
    if model_name == "random_forest":
        estimator = RandomForestRegressor(
            n_estimators=500,
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )

    elif model_name == "extra_trees":
        estimator = ExtraTreesRegressor(
            n_estimators=500,
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )

    elif model_name == "hist_gradient_boosting":
        estimator = HistGradientBoostingRegressor(
            max_iter=300,
            learning_rate=0.05,
            max_leaf_nodes=15,
            l2_regularization=1.0,
            random_state=RANDOM_STATE,
        )

    else:
        raise ValueError(f"Unknown model: {model_name}")

    return Pipeline([
        (
            "imputer",
            SimpleImputer(
                strategy="median",
                keep_empty_features=True,
            ),
        ),
        ("model", estimator),
    ])


def calculate_groups(df: pd.DataFrame) -> np.ndarray:
    lat = np.floor(
        df["latitude"].to_numpy() / 0.25
    ).astype(int)

    lon = np.floor(
        df["longitude"].to_numpy() / 0.25
    ).astype(int)

    return np.array([
        f"{latitude}:{longitude}"
        for latitude, longitude in zip(lat, lon)
    ])


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as file:
        for chunk in iter(
            lambda: file.read(1024 * 1024),
            b"",
        ):
            digest.update(chunk)

    return digest.hexdigest()


def main():
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_FILE}"
        )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("Loading dataset...")
    df = pd.read_csv(DATA_FILE)

    required = set(
        ANALYTE_COLUMNS
        + [
            "latitude",
            "longitude",
            "horizon_lower",
            "horizon_upper",
        ]
    )

    missing = required - set(df.columns)

    if missing:
        raise ValueError(
            f"Missing columns: {sorted(missing)}"
        )

    original_rows = len(df)

    # -------------------------------------------------
    # 1. TOPSOIL FILTER: 0-20 CM
    # -------------------------------------------------

    lower = df[
        ["horizon_lower", "horizon_upper"]
    ].min(axis=1)

    upper = df[
        ["horizon_lower", "horizon_upper"]
    ].max(axis=1)

    df = df.loc[
        (lower == 0) & (upper == 20)
    ].copy()

    # Coordinates are used only for spatial grouping.
    df = df.dropna(
        subset=["latitude", "longitude"]
    )

    df = df[
        df["latitude"].between(-90, 90)
        & df["longitude"].between(-180, 180)
    ].copy()

    if df.empty:
        raise RuntimeError(
            "No eligible 0-20 cm samples found."
        )

    # -------------------------------------------------
    # 2. NUMERIC CLEANING
    # -------------------------------------------------

    for column in ANALYTE_COLUMNS:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    df[ANALYTE_COLUMNS] = df[
        ANALYTE_COLUMNS
    ].replace(
        [np.inf, -np.inf],
        np.nan,
    )

    # -------------------------------------------------
    # 3. REMOVE COMPLETELY EMPTY FEATURES
    # -------------------------------------------------

    usable_analytes = [
        column
        for column in ANALYTE_COLUMNS
        if df[column].notna().any()
    ]

    excluded_empty_analytes = [
        column
        for column in ANALYTE_COLUMNS
        if column not in usable_analytes
    ]

    print("\nDATASET PROFILE")
    print("=" * 55)
    print(f"Original rows: {original_rows}")
    print(f"Eligible topsoil rows: {len(df)}")
    print(f"Usable analytes: {len(usable_analytes)}")

    print("\nUsable features:")
    for column in usable_analytes:
        print(
            f" - {column}: "
            f"{df[column].notna().sum()} observed values"
        )

    print("\nExcluded completely empty features:")
    for column in excluded_empty_analytes:
        print(f" - {column}")

    if not usable_analytes:
        raise RuntimeError(
            "No usable analytes available."
        )

    # -------------------------------------------------
    # 4. INITIALIZE REPORT
    # -------------------------------------------------

    created_at = datetime.now(
        timezone.utc
    ).isoformat()

    dataset_hash = sha256_file(DATA_FILE)

    report = {
        "created_at": created_at,
        "dataset": str(
            DATA_FILE.relative_to(ROOT)
        ),
        "dataset_sha256": dataset_hash,
        "original_rows": int(original_rows),
        "rows_after_depth_filter": int(len(df)),
        "depth_interval_cm": [0, 20],
        "usable_analytes": usable_analytes,
        "excluded_empty_analytes": (
            excluded_empty_analytes
        ),
        "validation": {
            "method": "GroupKFold",
            "spatial_grid_degrees": 0.25,
            "folds": N_SPLITS,
            "spatial_buffer": False,
        },
        "synthetic_data_used": False,
        "prediction_scope": "lab_assisted_only",
        "models": {},
        "skipped_models": {},
    }

    manifest_models = {}

    # -------------------------------------------------
    # 5. TRAIN EACH TARGET
    # -------------------------------------------------

    for target, model_name in MODEL_CONFIGS.items():

        print("\n" + "=" * 55)
        print(f"TRAINING TARGET: {target}")
        print("=" * 55)

        if target not in usable_analytes:
            reason = "Target contains no observed values."

            report["skipped_models"][target] = reason
            print(f"SKIPPED: {reason}")
            continue

        features = [
            column
            for column in usable_analytes
            if column != target
        ]

        if not features:
            reason = "No usable predictor features."

            report["skipped_models"][target] = reason
            print(f"SKIPPED: {reason}")
            continue

        target_df = df.dropna(
            subset=[target]
        ).copy()

        X = target_df[features]
        y = target_df[target].astype(float)

        groups = calculate_groups(target_df)
        unique_groups = np.unique(groups)

        if len(target_df) < 100:
            reason = (
                f"Insufficient samples: {len(target_df)}"
            )

            report["skipped_models"][target] = reason
            print(f"SKIPPED: {reason}")
            continue

        if len(unique_groups) < N_SPLITS:
            reason = (
                f"Insufficient spatial groups: "
                f"{len(unique_groups)}"
            )

            report["skipped_models"][target] = reason
            print(f"SKIPPED: {reason}")
            continue

        # -------------------------------------------------
        # 6. SPATIAL CROSS VALIDATION
        # -------------------------------------------------

        predictions = np.full(
            len(target_df),
            np.nan,
            dtype=float,
        )

        cv = GroupKFold(
            n_splits=N_SPLITS
        )

        for fold, (train_idx, valid_idx) in enumerate(
            cv.split(X, y, groups),
            start=1,
        ):
            model = make_model(model_name)

            model.fit(
                X.iloc[train_idx],
                y.iloc[train_idx],
            )

            fold_predictions = model.predict(
                X.iloc[valid_idx]
            )

            predictions[valid_idx] = fold_predictions

            print(
                f"Fold {fold}/{N_SPLITS} completed "
                f"({len(train_idx)} train, "
                f"{len(valid_idx)} validation)"
            )

        valid = np.isfinite(predictions)

        if not valid.any():
            reason = "No valid out-of-fold predictions."

            report["skipped_models"][target] = reason
            print(f"SKIPPED: {reason}")
            continue

        # -------------------------------------------------
        # 7. METRICS
        # -------------------------------------------------

        y_valid = y.iloc[valid]

        metrics = {
            "r2": float(
                r2_score(
                    y_valid,
                    predictions[valid],
                )
            ),
            "mae": float(
                mean_absolute_error(
                    y_valid,
                    predictions[valid],
                )
            ),
            "rmse": float(
                np.sqrt(
                    mean_squared_error(
                        y_valid,
                        predictions[valid],
                    )
                )
            ),
            "oof_samples": int(valid.sum()),
            "training_samples": int(len(target_df)),
            "spatial_groups": int(len(unique_groups)),
        }

        # -------------------------------------------------
        # 8. FINAL FIT
        # -------------------------------------------------

        print("Fitting final model...")

        final_model = make_model(model_name)

        final_model.fit(
            X,
            y,
        )

        artifact_name = f"{target}.joblib"
        artifact_path = OUTPUT_DIR / artifact_name

        joblib.dump(
            final_model,
            artifact_path,
        )

        model_info = {
            "artifact": artifact_name,
            "model_type": model_name,
            "target": target,
            "features": features,
            "metrics": metrics,
            "prediction_scope": "lab_assisted_only",
            "field_validated": False,
            "tunisia_validated": False,
        }

        manifest_models[target] = model_info
        report["models"][target] = model_info

        print(f"R2: {metrics['r2']:.4f}")
        print(f"MAE: {metrics['mae']:.4f}")
        print(f"RMSE: {metrics['rmse']:.4f}")
        print(f"Samples: {len(target_df)}")
        print(f"Features: {len(features)}")
        print(f"Artifact: {artifact_path}")

    # -------------------------------------------------
    # 9. FINALIZE MANIFEST
    # -------------------------------------------------

    if not manifest_models:
        raise RuntimeError(
            "No models were successfully trained."
        )

    manifest = {
        "format_version": 1,
        "created_at": created_at,
        "sklearn_version": sklearn.__version__,
        "joblib_version": joblib.__version__,
        "dataset": str(
            DATA_FILE.relative_to(ROOT)
        ),
        "dataset_sha256": dataset_hash,
        "depth_interval_cm": [0, 20],
        "usable_analytes": usable_analytes,
        "excluded_empty_analytes": (
            excluded_empty_analytes
        ),
        "validation": report["validation"],
        "models": manifest_models,
        "limitations": [
            "Lab-assisted predictions only.",
            "Requires laboratory analyte features.",
            "Not validated for direct farmer field inputs.",
            "Not validated for Tunisia-specific field conditions.",
            "Spatial validation has no exclusion buffer.",
            "CV metrics are not field-trial results.",
        ],
    }

    # Write JSON reports.
    (OUTPUT_DIR / "manifest.json").write_text(
        json.dumps(
            manifest,
            indent=2,
        ),
        encoding="utf-8",
    )

    (OUTPUT_DIR / "training_report.json").write_text(
        json.dumps(
            report,
            indent=2,
        ),
        encoding="utf-8",
    )

    # -------------------------------------------------
    # 10. SUMMARY
    # -------------------------------------------------

    print("\n" + "=" * 55)
    print("TRAINING COMPLETED")
    print("=" * 55)

    print(
        f"Models trained: {len(manifest_models)}"
    )

    print(
        f"Models skipped: {len(report['skipped_models'])}"
    )

    print(
        f"Excluded empty features: "
        f"{excluded_empty_analytes}"
    )

    print(f"Output directory: {OUTPUT_DIR}")
    print("Manifest: manifest.json")
    print("Report: training_report.json")


if __name__ == "__main__":
    main()
