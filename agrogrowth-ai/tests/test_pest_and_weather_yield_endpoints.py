"""Fail-closed regression tests for services with unvalidated synthetic models."""

import pathlib
import sys

from fastapi.testclient import TestClient

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from pest_control.main import app as pest_app
from weather_yield_intelligence.main import app as weather_app

pest_client = TestClient(pest_app)
weather_client = TestClient(weather_app)


def test_pest_synthetic_analysis_and_treatment_are_disabled():
    response = pest_client.post(
        "/analyze-pest-problem",
        json={
            "crop_type": "tomato",
            "symptoms": ["curled leaves"],
            "affected_area_percentage": 25.0,
            "plant_health_score": 0.7,
            "weather_conditions": {
                "temperature": 28,
                "humidity": 65,
                "wind_speed": 8,
                "recent_rainfall": 2,
            },
            "farm_size": 1.5,
        },
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "PEST_MODEL_NOT_VALIDATED"

    treatment = pest_client.post(
        "/recommend-treatment",
        json={"pest_name": "aphids", "severity_level": 0.6},
    )
    assert treatment.status_code == 503

    schedule = pest_client.get("/treatment-schedule/aphids")
    assert schedule.status_code == 503


def test_pest_image_and_uncalibrated_severity_are_disabled():
    image = pest_client.post(
        "/upload-pest-image",
        files={"file": ("leaf.jpg", b"not-a-real-image", "image/jpeg")},
    )
    assert image.status_code == 503

    severity = pest_client.post(
        "/assess-severity",
        params={"pest_name": "aphids", "affected_area_percentage": 40},
    )
    assert severity.status_code == 503


def test_symptom_keyword_identification_is_not_misrepresented_as_ml():
    response = pest_client.post(
        "/identify-pest",
        json={"crop_type": "tomato", "symptoms": ["أوراق مجعدة", "إفرازات لزجة"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["identification"]["identified_pest"] == "aphids"
    assert body["model_source"] == "symptom-keyword-rules"
    assert body["field_validated"] is False


def test_pest_reference_database_remains_available():
    database = pest_client.get("/pest-database")
    assert database.status_code == 200
    assert database.json()["data"]


def test_weather_and_yield_synthetic_predictions_are_disabled():
    weather = weather_client.post(
        "/create-weather-plan",
        json={
            "location": {"latitude": 35.0, "longitude": 10.0, "region": "Tunisia"},
            "crop_options": ["wheat", "tomato"],
            "planning_horizon_months": 12,
        },
    )
    assert weather.status_code == 503

    yield_result = weather_client.post(
        "/predict-crop-yield",
        json={"crop_type": "wheat", "farm_size": 2.0},
    )
    assert yield_result.status_code == 503

    combined = weather_client.post("/combined-analysis", json={})
    assert combined.status_code == 503


def test_simulated_climate_and_yield_reference_endpoints_are_disabled():
    suitability = weather_client.post(
        "/assess-climate-suitability",
        params={"crop_type": "wheat"},
    )
    assert suitability.status_code == 503

    schedule = weather_client.post(
        "/optimize-planting-schedule",
        params={"crop_types": ["wheat", "tomato"]},
    )
    assert schedule.status_code == 503

    database = weather_client.get("/crop-yield-database")
    assert database.status_code == 503


def test_services_report_degraded_until_validated_models_exist():
    assert pest_client.get("/health").json()["production_ready"] is False
    assert weather_client.get("/health").json()["production_ready"] is False
