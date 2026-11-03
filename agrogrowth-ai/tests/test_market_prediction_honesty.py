"""
Market prediction must not advertise telemetry it does not have.

The forecast endpoint used to return a fixed `processing_time_ms`, a hardcoded
"68%" confidence level and a `data_sources` list naming feeds that are not
configured. Those presented synthetic model output as live market quotes. These
tests pin the honest behaviour: the payload is labelled synthetic, no invented
feed names are claimed, and an advisory is attached only when a provider is
configured.
"""

import asyncio
import importlib
import pathlib
import sys

import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

market_main = importlib.import_module("market_prediction.main")
llm = importlib.import_module("ai_common.llm_provider")

ENV_KEYS = ["AI_PROVIDER", "AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "GEMINI_API_KEY"]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    yield


def _forecast_request(**overrides):
    payload = {"crop_type": "olive", "current_price": 8.5, "forecast_days": 30}
    payload.update(overrides)
    return market_main.PriceForecastRequest(**payload)


def test_forecast_metadata_is_honest():
    response = asyncio.run(market_main.forecast_price(_forecast_request()))
    meta = response["metadata"]
    assert meta["data_source"] == "synthetic-model"
    assert meta["is_real_data"] is False
    assert meta["model_source"] == "synthetic-demo"
    # No fabricated telemetry or invented feed names.
    assert "processing_time_ms" not in meta
    assert "data_sources" not in meta
    assert "confidence_level" not in meta


def test_forecast_without_provider_has_no_advisory():
    response = asyncio.run(market_main.forecast_price(_forecast_request()))
    assert "advisory" not in response["data"]


def test_forecast_with_provider_attaches_labelled_advisory(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setattr(llm.LLMProvider, "chat", lambda self, *a, **k: "توقّع سعر الزيتون.")

    response = asyncio.run(market_main.forecast_price(_forecast_request(language="ar")))
    advisory = response["data"]["advisory"]
    assert advisory["text"] == "توقّع سعر الزيتون."
    assert advisory["language"] == "ar"
    # The numeric forecast stays labelled synthetic even with an advisory.
    assert response["metadata"]["is_real_data"] is False


def test_supply_demand_metadata_is_honest():
    request = market_main.SupplyDemandRequest(crop_type="olive", current_production=1200)
    response = asyncio.run(market_main.analyze_supply_demand(request))
    meta = response["metadata"]
    assert meta["data_source"] == "synthetic-model"
    assert meta["is_real_data"] is False
    assert "processing_time_ms" not in meta
    assert "reliability_score" not in meta


def test_health_reports_advisory_configuration(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    health = asyncio.run(market_main.health_check())
    assert health["model_source"] == "synthetic-demo"
    assert health["advisory_configured"] is True
    assert health["advisory_model_source"].endswith(":gpt-4o-mini")
