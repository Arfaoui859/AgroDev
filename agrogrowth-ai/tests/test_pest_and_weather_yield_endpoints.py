"""
Endpoint regression tests for the previously broken AI services.

Both the pest-control and weather/yield services imported cleanly, reported
healthy, and passed the existing suite, yet every main endpoint raised
`AttributeError` on undefined helper methods (returning HTTP 500). These tests
drive the real service coroutines end to end and assert a serialisable,
well-formed payload — the check that would have caught the outage.

A FastAPI TestClient is used so the response actually goes through the JSON
encoder; that is what surfaced the numpy-scalar serialisation failure in the
pest service.
"""

import numpy as np
import pytest
from fastapi.testclient import TestClient

pest_main = pytest.importorskip("pest_control.main")
wy_main = pytest.importorskip("weather_yield_intelligence.main")

pest_client = TestClient(pest_main.app)
wy_client = TestClient(wy_main.app)


# --------------------------------------------------------------------------
# Pest control
# --------------------------------------------------------------------------

def test_pest_analyze_problem_returns_full_analysis():
    resp = pest_client.post(
        "/analyze-pest-problem",
        json={
            "crop_type": "tomato",
            "symptoms": ["أوراق مجعدة", "إفرازات لزجة"],
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
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["pest_identification"]["identified_pest"]
    assert 0.0 <= data["pest_identification"]["confidence_score"] <= 1.0
    assert len(data["treatment_recommendations"]) > 0
    # The schedule is what crashed before the helpers existed.
    assert data["treatment_schedule"]["total_applications"] >= 1


@pytest.mark.parametrize(
    "symptoms,expected",
    [
        (["أوراق مجعدة", "إفرازات لزجة"], "aphids"),
        (["نقط صفراء صغيرة", "خيوط عنكبوتية"], "spider_mites"),
        (["طبقة بيضاء", "مسحوق أبيض"], "powdery_mildew"),
    ],
)
def test_pest_identification_matches_symptom_keywords(symptoms, expected):
    resp = pest_client.post(
        "/identify-pest", json={"crop_type": "tomato", "symptoms": symptoms}
    )
    assert resp.status_code == 200, resp.text
    identified = resp.json()["data"]["identification"]["identified_pest"]
    assert identified == expected


def test_pest_recommend_treatment_and_severity():
    rec = pest_client.post(
        "/recommend-treatment",
        json={"pest_name": "aphids", "severity_level": 0.6, "farm_size": 2.0,
              "organic_preference": True},
    )
    assert rec.status_code == 200, rec.text
    assert len(rec.json()["data"]) > 0

    sev = pest_client.post(
        "/assess-severity",
        params={"pest_name": "aphids", "affected_area_percentage": 40,
                "plant_health_score": 0.5, "temperature": 32, "humidity": 85},
    )
    assert sev.status_code == 200, sev.text
    assert sev.json()["data"]["above_threshold"] is True


def test_pest_database_and_prevention_are_json_serialisable():
    db = pest_client.get("/pest-database")
    assert db.status_code == 200
    assert len(db.json()["data"]) > 0

    prev = pest_client.get("/prevention-measures/tomato")
    assert prev.status_code == 200
    assert len(prev.json()["data"]) > 0


# --------------------------------------------------------------------------
# Weather & yield
# --------------------------------------------------------------------------

def test_weather_plan_returns_seasonal_plan():
    resp = wy_client.post(
        "/create-weather-plan",
        json={
            "location": {"latitude": 35.0, "longitude": 10.0, "region": "تونس"},
            "crop_options": ["wheat", "tomato", "olive"],
            "planning_horizon_months": 12,
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["climate_analysis"]["climate_zone"]["zone_type"]
    assert len(data["crop_suitability"]) == 3
    assert len(data["seasonal_plan"]["monthly_plans"]) == 12


def test_yield_prediction_returns_economic_analysis():
    resp = wy_client.post(
        "/predict-crop-yield",
        json={
            "crop_type": "wheat",
            "farm_size": 2.0,
            "weather_data": {"temperature": 22, "humidity": 60,
                             "annual_rainfall": 450, "recent_rainfall": 10},
            "soil_data": {"ph": 6.8, "fertility_score": 0.75,
                          "organic_matter": 3.5, "moisture_percentage": 45},
            "management_practices": {"irrigation_efficiency": 0.85,
                                     "fertilizer_application_rate": 1.0,
                                     "pest_management_score": 0.85,
                                     "disease_control_score": 0.8},
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["yield_prediction"]["predicted_yield_kg_ha"] > 0
    assert "profitability" in data["economic_analysis"]
    assert data["confidence_metrics"]["confidence_score"] > 0


def test_weather_plan_is_deterministic_for_same_input():
    """The seasonal outlook must not contain random jitter between calls."""
    payload = {
        "location": {"latitude": 35.0, "longitude": 10.0, "region": "تونس"},
        "crop_options": ["wheat", "tomato"],
        "planning_horizon_months": 12,
    }
    first = wy_client.post("/create-weather-plan", json=payload).json()["data"]
    second = wy_client.post("/create-weather-plan", json=payload).json()["data"]
    assert (
        first["crop_suitability"][0]["suitability_score"]
        == second["crop_suitability"][0]["suitability_score"]
    )
