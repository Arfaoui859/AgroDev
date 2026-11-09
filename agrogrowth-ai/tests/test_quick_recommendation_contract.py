"""The quick endpoint must not expose a recommender trained on synthetic data."""

import asyncio
import importlib
import pathlib
import sys

import pytest
from fastapi import HTTPException

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

quick_module = importlib.import_module("crop_recommendation.main")


def test_quick_recommendation_fails_closed_for_synthetic_model():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            quick_module.quick_recommendation(
                temperature=24, rainfall=350, soil_ph=6.5, farm_size=2
            )
        )
    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == "CROP_MODEL_NOT_VALIDATED"
