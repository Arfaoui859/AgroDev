"""Regression tests for the lab-assisted soil inference contract.

These tests use the committed model manifest but replace model loading with a
small in-memory test double. They never retrain or claim to validate the models.
"""
from __future__ import annotations

import math

import pytest

from soil_analysis.lab_assisted_predictor import LabAssistedSoilPredictor


class _ConstantRegressor:
    def __init__(self, feature_count: int, value: float = 6.5):
        self.n_features_in_ = feature_count
        self.value = value

    def predict(self, frame):
        assert frame.shape == (1, self.n_features_in_)
        return [self.value]


def _complete_feature_payload(predictor: LabAssistedSoilPredictor) -> dict[str, float]:
    features = {
        feature
        for config in predictor.models.values()
        for feature in config["features"]
    }
    return {feature: 1.0 for feature in features}


def test_incomplete_lab_panel_is_rejected_without_loading_models(monkeypatch):
    predictor = LabAssistedSoilPredictor()
    payload = _complete_feature_payload(predictor)
    # aluminium_extractable is required by every model in the committed manifest.
    payload.pop("aluminium_extractable")

    def unexpected_load(*_args, **_kwargs):
        raise AssertionError("A model must not run with missing lab features")

    monkeypatch.setattr(predictor, "_load_model", unexpected_load)
    result = predictor.predict(payload)

    assert result["status"] == "success"
    assert result["prediction_scope"] == "lab_assisted_only"
    assert len(result["models"]) == 7
    assert all(item["status"] == "insufficient_input" for item in result["models"].values())
    assert all(item["prediction"] is None for item in result["models"].values())


def test_complete_lab_panel_uses_all_seven_model_contracts(monkeypatch):
    predictor = LabAssistedSoilPredictor()
    payload = _complete_feature_payload(predictor)
    loaded_targets = []

    def load_test_model(target, configuration):
        loaded_targets.append(target)
        return _ConstantRegressor(len(configuration["features"]))

    monkeypatch.setattr(predictor, "_load_model", load_test_model)
    result = predictor.predict(payload)

    assert result["status"] == "success"
    assert result["prediction_scope"] == "lab_assisted_only"
    assert result["field_validated"] is False
    assert result["tunisia_validated"] is False
    assert set(loaded_targets) == set(predictor.models)
    assert all(item["status"] == "predicted" for item in result["models"].values())
    assert all(math.isfinite(item["prediction"]) for item in result["models"].values())


@pytest.mark.parametrize("value", [True, float("nan"), float("inf"), "-inf", "not-a-number"])
def test_invalid_measurements_are_rejected(value):
    predictor = LabAssistedSoilPredictor()
    with pytest.raises(ValueError):
        predictor.predict({"aluminium_extractable": value})


@pytest.mark.parametrize("coverage", [0, -0.1, 1.01, 2])
def test_invalid_feature_coverage_threshold_is_rejected(coverage):
    with pytest.raises(ValueError):
        LabAssistedSoilPredictor(min_feature_coverage=coverage)
