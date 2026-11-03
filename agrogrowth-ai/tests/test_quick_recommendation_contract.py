"""
Regression test for a KeyError that made /quick-recommendation unusable.

The endpoint built its simplified payload with
`crop['profit_analysis']['profit_per_hectare']`, but the recommender emits
`net_profit`. Every request raised KeyError and answered HTTP 500, so the Node
gateway silently fell back to the rule-based engine.

The test drives the real endpoint coroutine (no mocks, no extra HTTP client
dependency) and asserts the response is well formed.
"""

import asyncio
import importlib

quick_module = importlib.import_module("crop_recommendation.main")


def test_quick_recommendation_returns_well_formed_payload():
    body = asyncio.run(
        quick_module.quick_recommendation(
            temperature=24, rainfall=350, soil_ph=6.5, farm_size=2
        )
    )
    assert body["quick_recommendations"], "expected at least one recommendation"
    top = body["quick_recommendations"][0]
    # These three keys were produced by the buggy access.
    assert top["crop_name"]
    assert isinstance(top["expected_profit_per_hectare"], (int, float))
    assert top["risk_level"]
    assert body["best_crop"] == top
