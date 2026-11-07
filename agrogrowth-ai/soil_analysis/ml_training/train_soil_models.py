"""
Runtime loader for trained AgroGrowth soil ML models.

Models are optional at application startup: if no trained artifacts exist,
the API remains available but clearly reports that ML predictions are unavailable.
It never silently falls back to deterministic rules while claiming ML.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

API_TO_DATASET = {
    "ph": "soil_pH",
    "sand": "soil_sand",
    "silt": "soil_silt",
    "clay": "soil_clay",
    "organic_matter": "soil_SOM",
    "nitrogen": "soil_N",
    "potassium": "soil_K",
    "phosphorus": "soil_P",
}

INPUT_TO_FEATURE = {
    "ph": "soil_pH",
    "sand": "soil_sand",
    "silt": "soil_silt",
    "clay": "soil_clay",
    "organic_matter": "soil_SOM",
    "latitude": "latitude",
    "longitude": "longitude",
    "elevation": "elevation",
    "depth_top": "depth_top",
    "depth_bottom": "depth_bottom",
}


class SoilMLPredictor:

    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = Path(
            model_dir
            or os.getenv("SOIL_ML_MODEL_DIR", "models/soil_ml")
        )
        self.models: Dict[str, Dict[str, Any]] = {}
        self.manifest: Dict[str, Any] = {}
        self.load_error: Optional[str] = None
        self._load()

    def _load(self) -> None:
        manifest_path = self.model_dir / "manifest.json"

        if not manifest_path.exists():
            self.load_error = "trained_manifest_not_found"
            logger.warning(
                "Soil ML artifacts not found at %s", self.model_dir
            )
            return

        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                self.manifest = json.load(f)

            for target, info in self.manifest.get("results", {}).items():
                if info.get("status") != "trained":
                    continue

                model_path = self.model_dir / info["model_file"]
                if not model_path.exists():
                    logger.error("Missing model artifact: %s", model_path)
                    continue

                self.models[target] = joblib.load(model_path)

            self.load_error = None

        except Exception as exc:
            self.load_error = f"model_load_error: {type(exc).__name__}"
            logger.exception("Unable to load Soil ML artifacts")

    def status(self) -> Dict[str, Any]:
        return {
            "available": bool(self.models),
            "model_source": "trained_supervised_ml" if self.models else "not_available",
            "loaded_models": sorted(self.models.keys()),
            "training_dataset": self.manifest.get("training_dataset"),
            "trained_at_utc": self.manifest.get("trained_at_utc"),
            "load_error": self.load_error,
            "evaluation": {
                target: info.get("holdout")
                for target, info in self.manifest.get("results", {}).items()
                if info.get("status") == "trained"
            },
        }

    @staticmethod
    def _build_feature_input(
        sensor_data: Dict[str, Any],
        location: Optional[Dict[str, Any]],
        feature_columns: list[str],
    ) -> pd.DataFrame:
        location = location or {}

        values = {
            "soil_pH": sensor_data.get("ph"),
            "soil_sand": sensor_data.get("sand"),
            "soil_silt": sensor_data.get("silt"),
            "soil_clay": sensor_data.get("clay"),
            "soil_SOM": sensor_data.get("organic_matter"),
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
            "elevation": location.get("elevation"),
            "depth_top": sensor_data.get("depth_top"),
            "depth_bottom": sensor_data.get("depth_bottom"),
        }

        row = {}
        for column in feature_columns:
            value = values.get(column)
            if value is None:
                row[column] = np.nan
            else:
                try:
                    number = float(value)
                    row[column] = number if np.isfinite(number) else np.nan
                except (TypeError, ValueError):
                    row[column] = np.nan

        return pd.DataFrame([row], columns=feature_columns)

    def predict_missing(
        self,
        sensor_data: Dict[str, Any],
        location: Optional[Dict[str, Any]] = None,
        phosphorus_method: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.models:
            return {
                "status": "ml_models_unavailable",
                "message": (
                    "No successfully trained Soil ML models are installed. "
                    "Run the training pipeline and deploy the generated artifacts."
                ),
                "predictions": {},
            }

        predictions: Dict[str, Any] = {}
        skipped: Dict[str, str] = {}

        for target, artifact in self.models.items():

            # Do not replace values already measured/supplied by the user.
            api_key = target
            if api_key in sensor_data and sensor_data[api_key] is not None:
                continue

            required_method = artifact.get("required_method")
            if required_method:
                supplied = (phosphorus_method or "").strip().lower().replace(" ", "")
                expected = required_method.strip().lower().replace(" ", "")
                aliases = {"bray": "bray1", "bray1": "bray1", "olsen": "olsen"}
                if aliases.get(supplied, supplied) != aliases.get(expected, expected):
                    skipped[target] = (
                        f"Model requires phosphorus extraction method '{required_method}'."
                    )
                    continue

            X = self._build_feature_input(
                sensor_data,
                location,
                artifact["feature_columns"],
            )

            # Require at least two real, relevant feature values. Remaining
            # missing values are handled by the training pipeline's imputer.
            supplied_count = int(X.notna().sum(axis=1).iloc[0])
            if supplied_count < 2:
                skipped[target] = "insufficient_input_features"
                continue

            model = artifact["model"]
            value = float(model.predict(X)[0])

            # Tree spread is reported as dispersion, NOT calibrated confidence.
            spread = None
            try:
                fitted_model = model.named_steps["model"]
                imputed = model.named_steps["imputer"].transform(X)
                tree_predictions = np.array(
                    [tree.predict(imputed)[0] for tree in fitted_model.estimators_],
                    dtype=float,
                )
                spread = float(np.std(tree_predictions))
            except Exception:
                spread = None

            predictions[target] = {
                "predicted_value": round(value, 4),
                "uncertainty_std": (
                    round(spread, 4) if spread is not None else None
                ),
                "uncertainty_note": (
                    "Standard deviation across ensemble trees; not a calibrated "
                    "confidence interval and not a laboratory measurement."
                ),
                "source": "trained_supervised_ml",
                "training_dataset": self.manifest.get("training_dataset"),
                "unit": "dataset_standardized_unit",
                "requires_unit_metadata_confirmation": True,
            }

        return {
            "status": "predictions_generated" if predictions else "no_predictions",
            "model_source": "trained_supervised_ml",
            "predictions": predictions,
            "skipped": skipped,
            "warning": (
                "Predictions are statistical estimates from public training data. "
                "They are not laboratory measurements and require local validation."
            ),
        }
