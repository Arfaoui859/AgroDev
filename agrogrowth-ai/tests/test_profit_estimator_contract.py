"""
Regression tests for the crop profitability estimator.

`estimate_crop_profitability` called `self._generate_investment_recommendations`,
a method that did not exist. Every request to /estimate-profit therefore raised
AttributeError and the endpoint returned HTTP 500. These tests exercise the real
estimator so a missing method or a broken call path fails immediately.
"""

import pathlib
import sys

import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from crop_recommendation.profit_estimator import create_profit_estimator  # noqa: E402


@pytest.fixture(scope="module")
def estimator():
    return create_profit_estimator()


def test_estimate_returns_investment_recommendations(estimator):
    result = estimator.estimate_crop_profitability(
        {"crop_name": "wheat", "farm_size": 2.0}
    )
    assert "investment_recommendations" in result
    recs = result["investment_recommendations"]
    assert isinstance(recs, dict)
    assert recs["recommendation"]
    assert 0.0 <= recs["investment_attractiveness_score"] <= 1.0
    assert recs["next_steps"]


def test_estimate_produces_financial_and_risk_analyses(estimator):
    result = estimator.estimate_crop_profitability(
        {"crop_name": "olive", "farm_size": 3.0}
    )
    assert result["financial_analysis"]["net_profit"] is not None
    assert result["financial_analysis"]["roi_percent"] is not None
    assert result["risk_analysis"]["overall_risk_level"] in {"منخفض", "متوسط", "عالي"}


def test_compare_ranks_crops(estimator):
    result = estimator.compare_crop_profitability(
        [
            {"crop_name": "wheat", "farm_size": 2.0},
            {"crop_name": "olive", "farm_size": 2.0},
        ]
    )
    assert result["rankings"]["by_roi"]
    assert result["best_overall_crop"] is not None


def test_unknown_crop_is_rejected_not_faked(estimator):
    with pytest.raises(Exception):
        estimator.estimate_crop_profitability(
            {"crop_name": "not_a_real_crop", "farm_size": 1.0}
        )
