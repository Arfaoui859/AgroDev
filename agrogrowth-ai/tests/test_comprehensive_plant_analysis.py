import sys
from pathlib import Path

import pytest

AI_ROOT = Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from image_diagnosis import main


class FakeDiseaseDetector:
    def __init__(self, health=80, severity="medium"):
        self.health = health
        self.severity = severity

    def detect_plant_disease(self, image_data, plant_type):
        return {
            "health_score": {"health_score": self.health},
            "severity_assessment": {"severity_level": self.severity},
            "disease_detection": {
                "primary_disease": {
                    "disease": "early_blight",
                    "disease_name_ar": "اللفحة المبكرة",
                }
            },
            "treatment_plan": {
                "immediate_treatment": ["افحص الأوراق"],
                "prevention_measures": ["حسّن التهوية"],
                "general_care": ["راقب النبات"],
            },
        }


class FakeLeafScanner:
    def __init__(self, health=70, nutrition=65):
        self.health = health
        self.nutrition = nutrition

    def analyze_leaf_comprehensive(self, image_data, plant_type, growth_stage):
        return {
            "overall_leaf_score": {"overall_score": self.health},
            "leaf_nutrition": {
                "nutritional_health_score": self.nutrition,
                "primary_deficiency": {
                    "type": "nitrogen",
                    "name_ar": "احتمال نقص النيتروجين",
                },
            },
            "care_recommendations": ["راقب لون الأوراق"],
        }


@pytest.fixture
def fake_engines(monkeypatch):
    monkeypatch.setattr(
        main, "get_disease_detector", lambda: FakeDiseaseDetector()
    )
    monkeypatch.setattr(
        main, "get_leaf_scanner", lambda: FakeLeafScanner()
    )


def test_comprehensive_result_matches_frontend_contract(fake_engines):
    result = main._run_comprehensive_analysis(
        b"image", "tomato", "vegetative"
    )

    assert result["status"] == "success"
    assert result["overall_plant_health"]["score"] == 75
    assert result["overall_plant_health"]["components"] == {
        "disease_health": 80,
        "leaf_health": 70,
        "nutrition_health": 65,
    }

    assessment = result["combined_assessment"]
    assert assessment["action_priority"] == "medium"
    assert isinstance(assessment["primary_concerns"], list)
    assert set(assessment["monitoring_schedule"]) == {
        "immediate", "short_term", "long_term"
    }

    assert "افحص الأوراق" in result["unified_recommendations"]
    assert "راقب لون الأوراق" in result["unified_recommendations"]

    assert result["data_source"] == "heuristic"
    assert result["is_real_data"] is False
    assert result["model_source"] == "heuristic-demo"


@pytest.mark.parametrize(
    ("severity", "expected_priority"),
    [
        ("high", "high"),
        ("very_high", "very_high"),
        ("medium", "medium"),
        ("low", "low"),
        ("none", "low"),
    ],
)
def test_comprehensive_priority_follows_severity(
    monkeypatch, severity, expected_priority
):
    monkeypatch.setattr(
        main,
        "get_disease_detector",
        lambda: FakeDiseaseDetector(severity=severity),
    )
    monkeypatch.setattr(
        main, "get_leaf_scanner", lambda: FakeLeafScanner()
    )

    result = main._run_comprehensive_analysis(
        b"image", "tomato", None
    )

    assert (
        result["combined_assessment"]["action_priority"]
        == expected_priority
    )


@pytest.mark.parametrize("invalid_score", [-1, 101, float("nan")])
def test_comprehensive_rejects_invalid_scores(
    monkeypatch, invalid_score
):
    monkeypatch.setattr(
        main,
        "get_disease_detector",
        lambda: FakeDiseaseDetector(health=invalid_score),
    )
    monkeypatch.setattr(
        main, "get_leaf_scanner", lambda: FakeLeafScanner()
    )

    with pytest.raises(ValueError):
        main._run_comprehensive_analysis(
            b"image", "tomato", None
        )


def _make_png():
    from io import BytesIO
    from PIL import Image

    buffer = BytesIO()
    Image.new("RGB", (64, 64), (60, 140, 60)).save(
        buffer, format="PNG"
    )
    return buffer.getvalue()


def test_analyze_plant_endpoint_accepts_valid_image(monkeypatch):
    from fastapi.testclient import TestClient

    expected = {
        "status": "success",
        "overall_plant_health": {"score": 75, "components": {
            "disease_health": 80,
            "leaf_health": 70,
            "nutrition_health": 65,
        }},
        "combined_assessment": {
            "action_priority": "medium",
            "health_assessment": "الحالة متوسطة",
            "primary_concerns": [],
            "monitoring_schedule": {
                "immediate": "متابعة",
                "short_term": "إعادة الفحص",
                "long_term": "مراقبة دورية",
            },
        },
        "unified_recommendations": [],
        "data_source": "heuristic",
        "is_real_data": False,
        "model_source": "heuristic-demo",
    }

    monkeypatch.setattr(
        main,
        "_run_comprehensive_analysis",
        lambda image, plant, stage: expected,
    )

    with TestClient(main.app) as client:
        response = client.post(
            "/analyze-plant",
            files={"file": ("leaf.png", _make_png(), "image/png")},
            data={
                "plant_type": "tomato",
                "growth_stage": "vegetative",
                "analysis_focus": "comprehensive",
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["overall_plant_health"]["score"] == 75
    assert body["combined_assessment"]["action_priority"] == "medium"
    assert body["data_source"] == "heuristic"
    assert body["is_real_data"] is False


def test_analyze_plant_endpoint_rejects_invalid_image():
    from fastapi.testclient import TestClient

    with TestClient(main.app) as client:
        response = client.post(
            "/analyze-plant",
            files={"file": ("fake.png", b"not an image", "image/png")},
        )

    assert response.status_code == 400


def test_analyze_plant_endpoint_rejects_oversized_upload(monkeypatch):
    from fastapi.testclient import TestClient

    monkeypatch.setattr(main, "MAX_UPLOAD_SIZE", 32)

    with TestClient(main.app) as client:
        response = client.post(
            "/analyze-plant",
            files={"file": ("large.png", b"x" * 33, "image/png")},
        )

    assert response.status_code == 413

def test_comprehensive_rejects_flat_image_without_health_scores(monkeypatch):
    class FlatImageDetector(FakeDiseaseDetector):
        def detect_plant_disease(self, image_data, plant_type):
            result = super().detect_plant_disease(image_data, plant_type)
            result["image_features"] = {
                "texture_contrast": 0.0,
                "edge_density": 0.0,
            }
            return result

    class MustNotRunLeafScanner:
        def analyze_leaf_comprehensive(self, *args, **kwargs):
            raise AssertionError(
                "Leaf analysis must not run when visual evidence is insufficient"
            )

    monkeypatch.setattr(
        main, "get_disease_detector", lambda: FlatImageDetector()
    )
    monkeypatch.setattr(
        main, "get_leaf_scanner", lambda: MustNotRunLeafScanner()
    )

    result = main._run_comprehensive_analysis(b"flat-image", "tomato", None)

    assert result["status"] == "insufficient_visual_evidence"
    assert result["image_suitability"]["retake_required"] is True
    assert result["overall_plant_health"] is None
    assert result["combined_assessment"] is None
    assert result["unified_recommendations"] == []
    assert result["disease_analysis"] is None
    assert result["leaf_analysis"] is None
