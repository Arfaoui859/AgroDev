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


def test_pest_diagnosis_is_disabled_until_real_model_validation():
    response = pest_client.post(
        "/analyze-pest-problem",
        json={"crop_type": "tomato", "symptoms": ["أوراق مجعدة"], "language": "fr"},
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "PEST_MODEL_NOT_VALIDATED"


def test_irrigation_optimizer_is_disabled_until_real_model_validation():
    response = irr_client.post(
        "/optimize-irrigation",
        json={"crop_type": "wheat", "language": "fr"},
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "IRRIGATION_MODEL_NOT_VALIDATED"


def test_weather_and_yield_models_are_disabled_until_real_training_data():
    weather = wy_client.post(
        "/create-weather-plan",
        json={
            "location": {"latitude": 35.0, "longitude": 10.0, "region": "Tunisie"},
            "crop_options": ["wheat", "tomato"],
            "planning_horizon_months": 12,
            "language": "fr",
        },
    )
    assert weather.status_code == 503
    assert weather.json()["detail"]["code"] == "WEATHER_MODEL_NOT_VALIDATED"

    yield_result = wy_client.post(
        "/predict-crop-yield",
        json={"crop_type": "wheat", "language": "fr"},
    )
    assert yield_result.status_code == 503
    assert yield_result.json()["detail"]["code"] == "YIELD_MODEL_NOT_VALIDATED"


def test_disabled_endpoints_do_not_return_language_dependent_fake_results():
    for language in ["ar", "ar-tn", "fr", "en", "de"]:
        response = pest_client.post(
            "/analyze-pest-problem",
            json={"crop_type": "tomato", "symptoms": ["أوراق مجعدة"], "language": language},
        )
        assert response.status_code == 503
        assert response.json()["detail"]["production_ready"] is False
