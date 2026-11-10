"""Memory-aware production inference for laboratory-assisted soil ML models."""

import gc
import json
import math
import threading
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models" / "production"
MANIFEST_PATH = MODEL_DIR / "manifest.json"


class LabAssistedSoilPredictor:
    def __init__(self, min_feature_coverage: float = 1.0):
        if min_feature_coverage != 1.0:
            raise ValueError(
                "Complete laboratory feature coverage (1.0) is required; "
                "these estimators have no validated missing-value imputer."
            )

        if not MANIFEST_PATH.is_file():
            raise FileNotFoundError(
                f"Model manifest not found: {MANIFEST_PATH}"
            )

        self.min_feature_coverage = min_feature_coverage

        with MANIFEST_PATH.open("r", encoding="utf-8") as file:
            self.manifest = json.load(file)

        scope = self.manifest.get("prediction_scope")
        configurations = self.manifest.get("models", {})

        if not configurations:
            raise RuntimeError("No production models found in manifest.")

        if scope is None:
            scopes = {
                config.get("prediction_scope")
                for config in configurations.values()
            }
            if scopes != {"lab_assisted_only"}:
                raise ValueError(
                    f"Unexpected model prediction scopes: {scopes}"
                )
        elif scope != "lab_assisted_only":
            raise ValueError(
                f"Unexpected model prediction scope: {scope}"
            )

        # Metadata only. No model is loaded into memory here.
        self.models = {}

        for target, config in configurations.items():
            features = config.get("features", [])
            artifact_name = config.get("artifact")

            if not features or not artifact_name:
                raise ValueError(
                    f"Invalid manifest configuration: {target}"
                )

            if "carbon_total" in features:
                raise ValueError(
                    f"{target} unexpectedly uses carbon_total."
                )

            artifact_path = (MODEL_DIR / artifact_name).resolve()

            if not artifact_path.is_relative_to(MODEL_DIR.resolve()):
                raise ValueError(
                    f"Invalid artifact path for {target}."
                )

            if not artifact_path.is_file():
                raise FileNotFoundError(
                    f"Missing model artifact: {artifact_path}"
                )

            self.models[target] = {
                "artifact_path": artifact_path,
                "features": features,
                "metrics": config.get("metrics", {}),
            }

        # Only one prediction pipeline may load models at a time.
        self._prediction_lock = threading.Lock()

    def _load_model(self, target: str, configuration: dict):
        model = joblib.load(configuration["artifact_path"])

        expected_features = len(configuration["features"])
        actual_features = getattr(model, "n_features_in_", None)

        if actual_features != expected_features:
            del model
            raise RuntimeError(
                f"{target}: expected {expected_features} features, "
                f"loaded model has {actual_features}."
            )

        return model

    @staticmethod
    def _normalize_value(name: str, value: Any):
        if value is None:
            return None

        if isinstance(value, bool):
            raise ValueError(
                f"{name} must be numeric, not boolean."
            )

        try:
            number = float(value)
        except (TypeError, ValueError):
            raise ValueError(
                f"{name} must be a numeric value."
            )

        if not math.isfinite(number):
            raise ValueError(
                f"{name} must be finite."
            )

        return number

    def predict(self, lab_values: dict) -> dict:
        if not isinstance(lab_values, dict):
            raise ValueError("lab_values must be a dictionary.")

        results = {}

        with self._prediction_lock:
            for target, configuration in self.models.items():
                features = configuration["features"]
                normalized = {}

                for feature in features:
                    normalized[feature] = self._normalize_value(
                        feature, lab_values.get(feature)
                    )

                available = [
                    name for name, value in normalized.items()
                    if value is not None
                ]
                missing = [
                    name for name, value in normalized.items()
                    if value is None
                ]

                coverage = len(available) / len(features)

                if coverage < self.min_feature_coverage:
                    results[target] = {
                        "status": "insufficient_input",
                        "coverage": round(coverage, 3),
                        "required_coverage": self.min_feature_coverage,
                        "available_features": len(available),
                        "required_features": len(features),
                        "missing_features": missing,
                        "prediction": None,
                    }
                    continue

                model = None
                row = None

                try:
                    # Load only this target's model.
                    model = self._load_model(target, configuration)

                    row = pd.DataFrame(
                        [[normalized[name] for name in features]],
                        columns=features,
                    )

                    prediction = model.predict(row)[0]

                    results[target] = {
                        "status": "predicted",
                        "prediction": float(prediction),
                        "coverage": round(coverage, 3),
                        "imputed_features": missing,
                        "metrics": configuration["metrics"],
                    }

                finally:
                    # Release this model before loading the next one.
                    del row
                    del model
                    gc.collect()

        return {
            "status": "success",
            "prediction_scope": "lab_assisted_only",
            "field_validated": False,
            "tunisia_validated": False,
            "dataset": self.manifest.get("dataset"),
            "dataset_sha256": self.manifest.get("dataset_sha256"),
            "models": results,
        }
