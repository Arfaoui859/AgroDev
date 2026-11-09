import threading

import pytest

from soil_analysis.lab_assisted_predictor import LabAssistedSoilPredictor


class DummyModel:
    n_features_in_ = 2

    def predict(self, frame):
        return [6.4]


def make_predictor():
    predictor = LabAssistedSoilPredictor.__new__(
        LabAssistedSoilPredictor
    )
    predictor.min_feature_coverage = 0.8
    predictor.manifest = {
        "dataset": "reference.csv",
        "dataset_sha256": "test-digest",
    }
    predictor.models = {
        "ph": {
            "features": ["nitrogen_total", "carbon_organic"],
            "metrics": {"r2": 0.5},
        }
    }
    predictor._prediction_lock = threading.Lock()
    predictor._load_model = lambda target, configuration: DummyModel()
    return predictor


def test_predict_reports_unknown_fields_instead_of_silently_ignoring():
    predictor = make_predictor()

    result = predictor.predict({
        "nitrogen_total": 1.2,
        "carbon_organic": 2.4,
        "nitrogen_totla": 9.9,
        "laboratory_name": "Example Lab",
    })

    assert result["status"] == "success"
    assert result["input_quality"]["recognized_feature_count"] == 2
    assert result["input_quality"]["ignored_input_fields"] == [
        "laboratory_name",
        "nitrogen_totla",
    ]
    assert result["input_quality"]["units_validated"] is False
    assert result["input_quality"]["laboratory_method_validated"] is False
    assert result["models"]["ph"]["status"] == "predicted"


def test_predict_discloses_missing_measurement_and_imputation():
    predictor = make_predictor()

    result = predictor.predict({
        "nitrogen_total": 1.2,
    })

    assert result["models"]["ph"]["status"] == "predicted"
    assert result["models"]["ph"]["imputed_features"] == [
        "carbon_organic"
    ]


@pytest.mark.parametrize("value", [True, float("nan"), float("inf"), "not-a-number"])
def test_lab_measurements_reject_boolean_nonfinite_and_nonnumeric_values(value):
    with pytest.raises(ValueError):
        LabAssistedSoilPredictor._normalize_value("ph", value)
