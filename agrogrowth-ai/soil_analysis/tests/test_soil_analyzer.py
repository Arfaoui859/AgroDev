
import pytest

from soil_analyzer import create_soil_analyzer


@pytest.fixture
def analyzer():
    return create_soil_analyzer()


def test_single_ph_does_not_produce_health_score(analyzer):
    result = analyzer.analyze_soil_properties({
        "ph": 6.5,
    })

    assert result["health_score"] is None
    assert result["score_available"] is False
    assert result["fertility_level"] == "بيانات غير كافية"


def test_three_score_properties_produce_indicative_score(analyzer):
    result = analyzer.analyze_soil_properties({
        "ph": 6.5,
        "organic_matter": 3.2,
        "moisture": 45,
    })

    assert result["health_score"] == 100.0
    assert result["score_available"] is True
    assert result["score_details"]["evaluated_count"] == 3
    assert result["score_details"]["is_ml_prediction"] is False


def test_npk_does_not_affect_score(analyzer):
    base = analyzer.analyze_soil_properties({
        "ph": 6.5,
        "organic_matter": 3.2,
        "moisture": 45,
    })

    with_npk = analyzer.analyze_soil_properties({
        "ph": 6.5,
        "organic_matter": 3.2,
        "moisture": 45,
        "nitrogen": 100,
        "phosphorus": 20,
        "potassium": 150,
    })

    assert base["health_score"] == with_npk["health_score"]


def test_salinity_does_not_affect_score(analyzer):
    base = analyzer.analyze_soil_properties({
        "ph": 6.5,
        "organic_matter": 3.2,
        "moisture": 45,
    })

    with_salinity = analyzer.analyze_soil_properties({
        "ph": 6.5,
        "organic_matter": 3.2,
        "moisture": 45,
        "salinity": 1.5,
    })

    assert base["health_score"] == with_salinity["health_score"]


def test_texture_classification_requires_all_three_values(analyzer):
    result = analyzer.analyze_soil_properties({
        "sand": 40,
        "silt": 40,
    })

    assert result["soil_type"]["status"] == "insufficient_texture_data"
    assert result["soil_type"]["classification"] == "Unknown"


def test_texture_percentages_must_total_approximately_100(analyzer):
    with pytest.raises(ValueError):
        analyzer.analyze_soil_properties({
            "sand": 20,
            "silt": 20,
            "clay": 20,
        })


def test_invalid_nan_is_rejected(analyzer):
    with pytest.raises(ValueError):
        analyzer.analyze_soil_properties({
            "ph": float("nan"),
        })


def test_boolean_is_not_a_numeric_measurement(analyzer):
    with pytest.raises(ValueError):
        analyzer.analyze_soil_properties({
            "ph": True,
        })


def test_temperature_alone_is_not_a_soil_assessment(analyzer):
    with pytest.raises(ValueError):
        analyzer.analyze_soil_properties({
            "temperature": 25,
        })
