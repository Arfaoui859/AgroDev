import asyncio
from types import SimpleNamespace

from image_diagnosis import main


class FakeProvider:
    def is_configured(self):
        return False


def run_health_with_detector(monkeypatch, detector):
    async def immediate_offload(function, *args, **kwargs):
        return function(*args, **kwargs)

    monkeypatch.setattr(main, "get_provider", lambda: FakeProvider())
    monkeypatch.setattr(main, "get_disease_detector", lambda: detector)
    monkeypatch.setattr(main, "offload", immediate_offload)
    return asyncio.run(main.health())


def test_health_reports_loaded_trained_onnx_model(monkeypatch):
    classifier = SimpleNamespace(MODEL_SOURCE="mobilenetv3-plantvillage-v1")
    detector = SimpleNamespace(
        ml_classifier=classifier,
        inference_mode="onnx",
    )

    health = run_health_with_detector(monkeypatch, detector)

    assert health["status"] == "healthy"
    assert health["model_source"] == "mobilenetv3-plantvillage-v1"
    assert health["disease_classifier_loaded"] is True
    assert health["disease_classifier_source"] == "mobilenetv3-plantvillage-v1"
    assert health["disease_detector_inference_mode"] == "onnx"


def test_health_reports_heuristic_when_onnx_model_is_unavailable(monkeypatch):
    detector = SimpleNamespace(
        ml_classifier=None,
        inference_mode="heuristic",
    )

    health = run_health_with_detector(monkeypatch, detector)

    assert health["status"] == "degraded"
    assert health["production_ready"] is False
    assert health["model_source"] == main.DEFAULT_DISEASE_MODEL_SOURCE
    assert health["disease_classifier_loaded"] is False
    assert health["disease_classifier_source"] is None
    assert health["disease_detector_inference_mode"] == "heuristic"


# ---------------------------------------------------------------------------
# Derived-block honesty: severity / health score / affected area / treatment /
# risk are computed from image-colour heuristics even when the *classification*
# came from the trained ONNX model. Each derived block must be labelled as
# heuristic and not field-validated, so a caller can never present an estimate
# as model inference or a measured value.
# ---------------------------------------------------------------------------
def test_derived_analysis_blocks_are_labelled_heuristic():
    import numpy as np

    from image_diagnosis.plant_disease_detector import create_plant_disease_detector

    detector = create_plant_disease_detector()
    # A plain green image is enough to exercise the full analysis pipeline.
    image = np.zeros((224, 224, 3), dtype=np.uint8)
    image[:, :, 1] = 180

    result = detector.detect_plant_disease(image, "tomato")

    assert result["derived_analysis_source"] == "image-feature-heuristics"
    assert result["field_validated"] is False
    for block_name in (
        "severity_assessment",
        "health_score",
        "affected_areas",
        "treatment_plan",
        "risk_assessment",
        "environmental_analysis",
    ):
        block = result[block_name]
        assert block["source"] == "image-feature-heuristics", block_name
        assert block["field_validated"] is False, block_name
        assert block["derived_from"] == "image-colour-heuristics", block_name


def test_render_installs_image_diagnosis_runtime_requirements():
    from pathlib import Path

    render_config = (Path(__file__).resolve().parents[2] / "render.yaml").read_text(
        encoding="utf-8"
    )
    service_marker = "\n    name: agrogrowth-image-diagnosis\n"
    assert service_marker in render_config
    service_block = render_config.split(service_marker, 1)[1]
    service_block = service_block.split("\n  - type:", 1)[0]

    assert "pip install -r image_diagnosis/requirements.txt" in service_block
    assert "pip install -r requirements.txt" not in service_block



def test_supported_diseases_exposes_the_model_label_catalogue(monkeypatch):
    classifier = SimpleNamespace(
        MODEL_SOURCE="mobilenetv3-plantvillage-v1",
        idx_to_class={
            0: "Apple___Apple_scab",
            1: "Tomato___healthy",
        },
    )
    detector = SimpleNamespace(
        ml_classifier=classifier,
        inference_mode="onnx",
        disease_database={
            "healthy": {
                "name_ar": "صحي",
                "description": "حالة سليمة",
                "severity": "none",
                "treatment": [],
                "prevention": [],
            }
        },
    )

    async def immediate_offload(function, *args, **kwargs):
        return function(*args, **kwargs)

    monkeypatch.setattr(main, "get_disease_detector", lambda: detector)
    monkeypatch.setattr(main, "offload", immediate_offload)

    response = asyncio.run(main.supported_diseases())

    assert response["classifier_loaded"] is True
    assert response["model_source"] == "mobilenetv3-plantvillage-v1"
    assert response["model_class_count"] == 2
    assert response["model_classes"] == [
        {
            "index": 0,
            "class_name": "Apple___Apple_scab",
            "crop": "Apple",
            "condition": "Apple_scab",
        },
        {
            "index": 1,
            "class_name": "Tomato___healthy",
            "crop": "Tomato",
            "condition": "healthy",
        },
    ]
