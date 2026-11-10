"""
The numeric services must expose a farmer-facing advisory when a provider is
configured, and must label the numeric analysis and the advisory separately.

Soil screening uses user-supplied measurements and deterministic rules; crop recommendations use a demo source. The advisory is LLM-produced. These tests
drive the real endpoint coroutines and assert both labels are present and
correct, so a client can never mistake synthetic numbers for field data or
rule text for model text.
"""

import asyncio
import importlib
import pathlib
import sys

import pytest
from pydantic import ValidationError

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

soil_main = importlib.import_module("soil_analysis.main")
crop_main = importlib.import_module("crop_recommendation.main")
llm = importlib.import_module("ai_common.llm_provider")

ENV_KEYS = ["AI_PROVIDER", "AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "GEMINI_API_KEY"]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    yield


def _soil_request(**overrides):
    payload = {
        "sensor_data": {
            "ph": 6.5,
            "nitrogen": 40,
            "phosphorus": 25,
            "potassium": 180,
            "organic_matter": 2.5,
            "moisture": 22,
            "salinity": 1.2,
            "temperature": 24,
        }
    }
    payload.update(overrides)
    return soil_main.SoilAnalysisRequest(**payload)


def _crop_request(**overrides):
    payload = {
        "temperature": 24,
        "annual_rainfall": 350,
        "soil_ph": 6.5,
        "soil_quality_score": 0.7,
        "water_availability": 0.65,
        "target_market_price": 2.4,
        "farmer_experience_years": 6,
        "available_capital": 12000,
        "farm_size": 3.0,
        "risk_tolerance": 0.4,
    }
    payload.update(overrides)
    return crop_main.CropRecommendationRequest(**payload)


def test_crop_recommendation_requires_explicit_farm_and_market_inputs():
    with pytest.raises(ValidationError):
        crop_main.CropRecommendationRequest(
            temperature=24,
            annual_rainfall=350,
            soil_ph=6.5,
        )


def test_soil_without_provider_has_no_advisory_and_is_labelled_synthetic():
    result = asyncio.run(soil_main.analyze_soil(_soil_request()))
    assert result.data_source == "user_supplied_input"
    assert result.is_real_data is None
    assert result.model_source == soil_main.get_soil_model_source()
    assert result.advisory is None


def test_soil_with_provider_adds_labelled_advisory(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setattr(llm.LLMProvider, "chat", lambda self, *a, **k: "نصيحة تربة.")

    result = asyncio.run(soil_main.analyze_soil(_soil_request(language="ar")))
    # Input measurements and model provenance are reported separately.
    assert result.data_source == "user_supplied_input"
    assert result.is_real_data is None
    assert result.model_source == soil_main.get_soil_model_source()
    assert result.advisory["text"] == "نصيحة تربة."
    assert result.advisory["language"] == "ar"


def test_soil_advisory_failure_does_not_break_analysis(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")

    def boom(self, *a, **k):
        raise llm.LLMError("timeout", "timed out", True)

    monkeypatch.setattr(llm.LLMProvider, "chat", boom)
    result = asyncio.run(soil_main.analyze_soil(_soil_request()))
    assert result.advisory is None
    assert result.health_score is not None


def test_crop_without_provider_is_labelled_synthetic():
    result = asyncio.run(crop_main.recommend_crops(_crop_request()))
    assert result.data_source == crop_main.get_crop_recommender_source()
    assert result.is_real_data is False
    assert result.advisory is None
    assert result.recommendations


def test_crop_with_provider_adds_labelled_advisory(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setattr(llm.LLMProvider, "chat", lambda self, *a, **k: "نصيحة محاصيل.")

    result = asyncio.run(crop_main.recommend_crops(_crop_request(language="ar")))
    assert result.is_real_data is False
    assert result.advisory["text"] == "نصيحة محاصيل."


def test_soil_health_reports_advisory_configured(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    health = asyncio.run(soil_main.health_check())
    assert health["advisory_configured"] is True
    assert health["model_source"] == soil_main.get_soil_model_source()
