
"""
Feature Availability & Ablation Audit — AgroGrowth Soil AI

Purpose:
- Audit which measured laboratory features are available for each target.
- Compare full lab-assisted features against restricted feature scenarios.
- Evaluate with spatial GroupKFold (5 folds, 0.25-degree blocks).
- Prevent target leakage.
- Never generate synthetic data.
- Never save production models.

Input:
    data/processed/wetchem_reference.csv

Output:
    data/processed/feature_availability_audit.json
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from sklearn.base import clone
from sklearn.ensemble import (
    ExtraTreesRegressor,
    RandomForestRegressor,
    HistGradientBoostingRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.dummy import DummyRegressor


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data" / "processed"

INPUT_FILE = DATA_DIR / "wetchem_reference.csv"
OUTPUT_FILE = DATA_DIR / "feature_availability_audit.json"

RANDOM_STATE = 42
N_SPLITS = 5
SPATIAL_BLOCK_SIZE = 0.25

TARGETS = [
    "ph",
    "carbon_organic",
    "nitrogen_total",
    "potassium_extractable",
    "electrical_conductivity",
    "phosphorus_extractable",
    "zinc_extractable",
]

# Laboratory analytes that can be used as predictors.
LAB_FEATURES = [
    "aluminium_extractable",
    "boron_extractable",
    "calcium_extractable",
    "carbon_organic",
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

# These are API concepts, not automatically equivalent to iSDA fields.
# Only exact, scientifically defensible matches are included.
USER_INPUT_SCENARIOS = {
    "direct_measurements": {
        "ph": ["ph"],
        "carbon_organic": [],
        "nitrogen_total": [],
        "potassium_extractable": [],
        "electrical_conductivity": [],
        "phosphorus_extractable": [],
        "zinc_extractable": [],
    },
    "lab_measurements_if_available": {
        "ph": ["ph"],
        "carbon_organic": ["carbon_organic"],
        "nitrogen_total": ["nitrogen_total"],
        "potassium_extractable": ["potassium_extractable"],
        "electrical_conductivity": ["electrical_conductivity"],
        "phosphorus_extractable": ["phosphorus_extractable"],
        "zinc_extractable": ["zinc_extractable"],
    },
}

# Explicitly unavailable in the current iSDA reference CSV.
UNSUPPORTED_API_INPUTS = [
    "moisture",
    "sand",
    "silt",
    "clay",
    "organic_matter",
]

EXCLUDED_FEATURES = {
    "latitude",
    "longitude",
    "horizon_upper",
    "horizon_lower",
    "spatial_block",
    "spatial_block_x",
    "spatial_block_y",
}

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s",
)
logger = logging.getLogger("feature_availability_audit")


# ---------------------------------------------------------------------
# Model candidates
# ---------------------------------------------------------------------

def build_models() -> dict[str, Any]:
    return {
        "median_baseline": DummyRegressor(strategy="median"),

        "random_forest": RandomForestRegressor(
            n_estimators=300,
            min_samples_leaf=2,
            max_features=0.8,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),

        "extra_trees": ExtraTreesRegressor(
            n_estimators=300,
            min_samples_leaf=2,
            max_features=0.8,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),

        "hist_gradient_boosting": HistGradientBoostingRegressor(
            max_iter=200,
            learning_rate=0.05,
            max_leaf_nodes=15,
            l2_regularization=1.0,
            random_state=RANDOM_STATE,
        ),
    }


def build_pipeline(model: Any) -> Pipeline:
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", clone(model)),
    ])


# ---------------------------------------------------------------------
# Data validation
# ---------------------------------------------------------------------

def load_dataset() -> pd.DataFrame:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {INPUT_FILE}"
        )

    df = pd.read_csv(INPUT_FILE)

    required = {
        "longitude",
        "latitude",
        "horizon_upper",
        "horizon_lower",
        *TARGETS,
    }

    missing = sorted(required - set(df.columns))

    if missing:
        raise ValueError(
            f"Required columns missing from dataset: {missing}"
        )

    if df.empty:
        raise ValueError("Dataset is empty.")

    for col in required:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.replace([np.inf, -np.inf], np.nan)

    df = df.dropna(
        subset=[
            "longitude",
            "latitude",
            "horizon_upper",
            "horizon_lower",
        ]
    ).copy()

    # Benchmark is restricted to topsoil 0–20 cm.
    df = df[
        (df["horizon_upper"] == 0)
        & (df["horizon_lower"] == 20)
    ].copy()

    if df.empty:
        raise ValueError(
            "No topsoil rows found for horizon 0–20 cm."
        )

    logger.info("Loaded %s topsoil reference rows.", len(df))

    return df.reset_index(drop=True)


# ---------------------------------------------------------------------
# Spatial grouping
# ---------------------------------------------------------------------

def add_spatial_blocks(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()

    result["spatial_block_x"] = np.floor(
        result["longitude"] / SPATIAL_BLOCK_SIZE
    ).astype(int)

    result["spatial_block_y"] = np.floor(
        result["latitude"] / SPATIAL_BLOCK_SIZE
    ).astype(int)

    result["spatial_block"] = (
        result["spatial_block_x"].astype(str)
        + "_"
        + result["spatial_block_y"].astype(str)
    )

    return result


# ---------------------------------------------------------------------
# Feature definitions
# ---------------------------------------------------------------------

def available_features(
    df: pd.DataFrame,
    target: str,
    requested_features: list[str],
) -> list[str]:

    return [
        feature
        for feature in requested_features
        if feature in df.columns
        and feature != target
        and feature not in EXCLUDED_FEATURES
        and feature in LAB_FEATURES
    ]


def lab_assisted_features(
    df: pd.DataFrame,
    target: str,
) -> list[str]:

    return available_features(
        df,
        target,
        LAB_FEATURES,
    )


# ---------------------------------------------------------------------
# Spatial cross-validation
# ---------------------------------------------------------------------

def evaluate_scenario(
    df: pd.DataFrame,
    target: str,
    features: list[str],
    scenario_name: str,
) -> dict[str, Any]:

    if not features:
        return {
            "status": "not_evaluable",
            "reason": "No valid measured predictor features available.",
            "features": [],
            "models": {},
        }

    # Target must be measured and finite.
    subset = df.dropna(subset=[target]).copy()

    if len(subset) < N_SPLITS:
        return {
            "status": "not_evaluable",
            "reason": "Insufficient target observations.",
            "features": features,
            "models": {},
        }

    # Drop features that have no observations in this target subset.
    features = [
        feature
        for feature in features
        if subset[feature].notna().any()
    ]

    if not features:
        return {
            "status": "not_evaluable",
            "reason": "All candidate predictors are missing.",
            "features": [],
            "models": {},
        }

    X = subset[features].copy()
    y = subset[target].astype(float)

    groups = subset["spatial_block"].astype(str)

    number_of_groups = groups.nunique()

    if number_of_groups < N_SPLITS:
        return {
            "status": "not_evaluable",
            "reason": (
                f"Only {number_of_groups} spatial groups; "
                f"{N_SPLITS} required."
            ),
            "features": features,
            "models": {},
        }

    cv = GroupKFold(n_splits=N_SPLITS)
    model_results = {}

    for model_name, model in build_models().items():
        oof_predictions = np.full(len(subset), np.nan)
        fold_results = []

        for fold, (train_idx, test_idx) in enumerate(
            cv.split(X, y, groups),
            start=1,
        ):
            X_train = X.iloc[train_idx]
            X_test = X.iloc[test_idx]

            y_train = y.iloc[train_idx]
            y_test = y.iloc[test_idx]

            # No training on empty target values.
            if y_train.empty or y_test.empty:
                continue

            pipeline = build_pipeline(model)
            pipeline.fit(X_train, y_train)

            predictions = pipeline.predict(X_test)

            oof_predictions[test_idx] = predictions

            fold_results.append({
                "fold": fold,
                "train_rows": int(len(train_idx)),
                "test_rows": int(len(test_idx)),
                "train_spatial_blocks": int(
                    groups.iloc[train_idx].nunique()
                ),
                "test_spatial_blocks": int(
                    groups.iloc[test_idx].nunique()
                ),
                "mae": float(
                    mean_absolute_error(y_test, predictions)
                ),
                "r2": (
                    float(r2_score(y_test, predictions))
                    if len(y_test) >= 2
                    else None
                ),
            })

        valid = np.isfinite(oof_predictions)

        if not valid.any():
            continue

        model_results[model_name] = {
            "oof_mae": float(
                mean_absolute_error(
                    y.iloc[valid],
                    oof_predictions[valid],
                )
            ),
            "oof_r2": (
                float(
                    r2_score(
                        y.iloc[valid],
                        oof_predictions[valid],
                    )
                )
                if valid.sum() >= 2
                else None
            ),
            "oof_rows": int(valid.sum()),
            "folds": fold_results,
        }

    return {
        "status": "evaluated",
        "scenario": scenario_name,
        "features": features,
        "feature_count": len(features),
        "target_rows": int(len(subset)),
        "spatial_blocks": int(number_of_groups),
        "models": model_results,
    }


# ---------------------------------------------------------------------
# Main audit
# ---------------------------------------------------------------------

def run_audit() -> dict[str, Any]:
    df = add_spatial_blocks(load_dataset())

    audit: dict[str, Any] = {
        "audit_name": "AgroGrowth Feature Availability & Ablation Audit",
        "dataset": str(INPUT_FILE.name),
        "dataset_rows_topsoil": int(len(df)),
        "validation": {
            "method": "GroupKFold",
            "folds": N_SPLITS,
            "spatial_block_degrees": SPATIAL_BLOCK_SIZE,
            "target_depth_cm": "0-20",
            "random_state": RANDOM_STATE,
        },
        "unsupported_api_inputs": UNSUPPORTED_API_INPUTS,
        "targets": {},
        "production_models_saved": False,
        "synthetic_data_used": False,
    }

    for target in TARGETS:
        logger.info("Auditing target: %s", target)

        target_report = {
            "target_observations": int(df[target].notna().sum()),
            "target_missing": int(df[target].isna().sum()),
            "lab_assisted": None,
            "user_input_scenarios": {},
        }

        full_features = lab_assisted_features(df, target)

        target_report["lab_assisted"] = evaluate_scenario(
            df,
            target,
            full_features,
            "lab_assisted",
        )

        for scenario_name, mapping in USER_INPUT_SCENARIOS.items():
            requested = mapping.get(target, [])

            selected = available_features(
                df,
                target,
                requested,
            )

            target_report["user_input_scenarios"][
                scenario_name
            ] = evaluate_scenario(
                df,
                target,
                selected,
                scenario_name,
            )

        audit["targets"][target] = target_report

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            audit,
            file,
            ensure_ascii=False,
            indent=2,
            allow_nan=False,
        )

    logger.info("Audit completed.")
    logger.info("Report saved to: %s", OUTPUT_FILE)

    return audit


if __name__ == "__main__":
    report = run_audit()

    print(json.dumps(
        {
            "dataset_rows_topsoil": report["dataset_rows_topsoil"],
            "targets_audited": len(report["targets"]),
            "output": str(OUTPUT_FILE),
            "production_models_saved": False,
            "synthetic_data_used": False,
        },
        ensure_ascii=False,
        indent=2,
    ))
