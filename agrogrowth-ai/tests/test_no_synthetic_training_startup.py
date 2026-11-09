"""Production service construction must never train on generated demo samples."""

import pathlib
import sys

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from crop_recommendation.crop_recommender import create_crop_recommender
from weather_yield_intelligence.smart_weather_crop_planner import (
    create_smart_weather_crop_planner,
)
from weather_yield_intelligence.yield_predictor_ai import create_yield_predictor_ai
from pest_control.pest_control_recommender import create_pest_control_recommender
from irrigation_optimization.smart_irrigation_optimizer import (
    create_smart_irrigation_optimizer,
)


def test_synthetic_crop_model_is_not_trained_at_startup():
    service = create_crop_recommender()
    assert service.is_trained is False
    assert service.model_source == "synthetic-demo-disabled"


def test_synthetic_weather_and_yield_models_are_not_trained_at_startup():
    weather = create_smart_weather_crop_planner()
    yield_model = create_yield_predictor_ai()
    assert weather.is_trained is False
    assert weather.model_source == "synthetic-demo-disabled"
    assert yield_model.is_trained is False
    assert yield_model.model_source == "synthetic-demo-disabled"


def test_synthetic_pest_and_irrigation_models_are_not_trained_at_startup():
    pest = create_pest_control_recommender()
    irrigation = create_smart_irrigation_optimizer()
    assert pest.is_trained is False
    assert pest.model_source == "synthetic-demo-disabled"
    assert irrigation.is_trained is False
    assert irrigation.model_source == "synthetic-demo-disabled"
