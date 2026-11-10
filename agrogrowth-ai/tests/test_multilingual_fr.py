"""
French ("fr") support for the numeric AI services.

The SPA used to send only ``ar`` or ``en``; it now sends the selected locale,
which includes ``fr``. These tests prove the three affected services accept a
French request, keep their canonical machine-readable payload intact, and —
when an LLM provider is configured — ask for the advisory in French.

Language is advisory metadata: the structured fields used for matching
(pest identifiers, crop codes, severities, dates) are never translated.
"""

import pathlib
import sys

import pytest
from fastapi.testclient import TestClient

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

pest_main = pytest.importorskip("pest_control.main")
irr_main = pytest.importorskip("irrigation_optimization.main")
wy_main = pytest.importorskip("weather_yield_intelligence.main")
advisory = pytest.importorskip("ai_common.advisory")
llm = pytest.importorskip("ai_common.llm_provider")

pest_client = TestClient(pest_main.app)
irr_client = TestClient(irr_main.app)
wy_client = TestClient(wy_main.app)

ENV_KEYS = ["AI_PROVIDER", "AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "GEMINI_API_KEY"]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    yield


def test_language_names_include_french():
    assert advisory.LANGUAGE_NAMES["fr"] == "French"
    assert advisory._language_name("fr") == "French"
    # Case-insensitive, as the SPA may send "FR".
    assert advisory._language_name("FR") == "French"


def test_narrate_requests_french_and_reports_it(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_MODEL", "gpt-4o-mini")
    captured = {}

    def fake_chat(self, messages, *a, **k):
        captured["messages"] = messages
        return "Conseil pour l'agriculteur."

    monkeypatch.setattr(llm.LLMProvider, "chat", fake_chat)
    out = advisory.narrate({"health_score": 0.7}, task="explain", language="fr")

    assert out is not None
    assert out["language"] == "fr"
    # The instruction sent to the model names French.
    joined = " ".join(m["content"] for m in captured["messages"])
    assert "French" in joined


def test_pest_accepts_french_and_keeps_canonical_fields():
    resp = pest_client.post(
        "/analyze-pest-problem",
        json={
            "crop_type": "tomato",
            "symptoms": ["أوراق مجعدة", "إفرازات لزجة"],
            "affected_area_percentage": 25.0,
            "plant_health_score": 0.7,
            "farm_size": 1.5,
            "language": "fr",
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    data = body["data"]
    # Canonical, machine-readable fields are unchanged by the locale.
    assert data["pest_identification"]["identified_pest"]
    assert isinstance(data["pest_identification"]["confidence_score"], float)
    assert len(data["treatment_recommendations"]) > 0


def test_irrigation_accepts_french_and_keeps_canonical_fields():
    resp = irr_client.post(
        "/optimize-irrigation",
        json={
            "crop_type": "wheat",
            "growth_stage": "vegetative",
            "weather_data": {"temperature": 28, "humidity": 60},
            "soil_data": {"moisture_percentage": 45},
            "farm_size": 1.0,
            "days_ahead": 7,
            "language": "fr",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    # Numeric schedule fields are locale-independent.
    assert data["water_requirements"]["daily_requirement_mm"] >= 0
    assert isinstance(data["irrigation_schedule"], list)


def test_weather_plan_accepts_french():
    resp = wy_client.post(
        "/create-weather-plan",
        json={
            "location": {"latitude": 35.0, "longitude": 10.0, "elevation": 100, "region": "Tunisia"},
            "historical_weather": {
        "temperature": 22, "humidity": 60, "rainfall": 15,
        "wind_speed": 4, "solar_radiation": 20,
        "recent_rainfall": 10, "annual_rainfall": 450,
        "temperature_variation": 8
    },
            "current_conditions": {
        "temperature": 22, "humidity": 60, "rainfall": 15,
        "wind_speed": 4, "solar_radiation": 20,
        "recent_rainfall": 10, "annual_rainfall": 450,
        "temperature_variation": 8
    },
            "crop_options": ["wheat", "tomato"],
            "planning_horizon_months": 12,
            "language": "fr",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["climate_analysis"]["climate_zone"]
    assert isinstance(data["crop_suitability"], list)


def test_yield_prediction_accepts_french():
    resp = wy_client.post(
        "/predict-crop-yield",
        json={
            "crop_type": "wheat",
            "location": {"latitude": 35.0, "longitude": 10.0, "elevation": 100, "region": "Tunisia"},
            "weather_data": {
        "temperature": 22, "humidity": 60, "rainfall": 15,
        "wind_speed": 4, "solar_radiation": 20,
        "recent_rainfall": 10, "annual_rainfall": 450,
        "temperature_variation": 8
    },
            "soil_data": {"ph": 6.8, "fertility_score": 0.75, "organic_matter": 3.5, "moisture_percentage": 45, "soil_type": "loam"},
            "management_practices": {"irrigation_efficiency": 0.85, "fertilizer_application_rate": 1.0, "pest_management_score": 0.85, "disease_control_score": 0.8, "organic_farming": false},
            "farm_size": 2.0,
            "language": "fr",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["yield_prediction"]["predicted_yield_kg_ha"] >= 0


@pytest.mark.parametrize("lang", ["ar", "ar-tn", "fr", "en"])
def test_all_supported_languages_are_accepted(lang):
    resp = pest_client.post(
        "/analyze-pest-problem",
        json={"crop_type": "tomato", "symptoms": ["أوراق مجعدة"], "language": lang},
    )
    assert resp.status_code == 200, resp.text


def test_unknown_language_does_not_break_the_service():
    # An unexpected value must not 500; the advisory falls back to Arabic.
    resp = pest_client.post(
        "/analyze-pest-problem",
        json={"crop_type": "tomato", "symptoms": ["أوراق مجعدة"], "language": "de"},
    )
    assert resp.status_code == 200, resp.text
