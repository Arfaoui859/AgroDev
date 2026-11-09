"""Production market endpoints fail closed until real data feeds exist."""

import asyncio
import importlib
import pathlib
import sys

import pytest
from fastapi import HTTPException

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

market_main = importlib.import_module("market_prediction.main")


def test_price_forecast_is_unavailable_without_verified_feed():
    request = market_main.PriceForecastRequest(
        crop_type="olive", current_price=8.5, forecast_days=30
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(market_main.forecast_price(request))
    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == "LIVE_MARKET_FEED_NOT_CONFIGURED"


def test_supply_demand_is_unavailable_without_verified_data():
    request = market_main.SupplyDemandRequest(
        crop_type="olive", current_production=1200
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(market_main.analyze_supply_demand(request))
    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == "VERIFIED_MARKET_DATA_NOT_CONFIGURED"


def test_market_conditions_and_history_fail_closed():
    with pytest.raises(HTTPException) as conditions:
        asyncio.run(market_main.get_market_conditions("olive"))
    assert conditions.value.status_code == 503

    with pytest.raises(HTTPException) as history:
        asyncio.run(market_main.get_historical_performance("olive"))
    assert history.value.status_code == 503


def test_health_reports_degraded_until_market_feed_is_configured():
    health = asyncio.run(market_main.health_check())
    assert health["status"] == "degraded"
    assert health["production_ready"] is False
    assert health["model_source"] == "synthetic-demo"
