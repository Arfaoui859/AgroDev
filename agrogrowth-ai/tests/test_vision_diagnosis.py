"""
The image diagnosis endpoint must label its diagnosis honestly.

The service ships a trained MobileNetV3 PlantVillage ONNX classifier (38
classes) plus an optional multimodal vision provider. These tests pin the
contract for the case where the trained classifier is *not* available: a
configured provider must then be used and the result labelled as a vision-model
output; when no provider is configured (or it fails) the endpoint must fail
closed rather than return a heuristic guess as a diagnosis.

The classifier is forced absent with a fixture so the test is deterministic
regardless of whether `onnxruntime` is installed in the environment.

No network call is made: the provider's vision method is monkeypatched.
"""

import asyncio
import importlib
import io
import sys
from pathlib import Path

import pytest
from PIL import Image

AI_ROOT = Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

image_main = importlib.import_module("image_diagnosis.main")
llm = importlib.import_module("ai_common.llm_provider")
bridge = importlib.import_module("ai_common.vision_bridge")

ENV_KEYS = ["AI_PROVIDER", "AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "GEMINI_API_KEY"]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    yield


@pytest.fixture(autouse=True)
def force_no_onnx_classifier(monkeypatch):
    """Force the trained classifier to be absent so the fail-closed / provider
    paths are exercised even when `onnxruntime` (and the ONNX artifact) are
    available in the test environment."""
    detector = image_main.get_disease_detector()
    monkeypatch.setattr(detector, "ml_classifier", None, raising=False)
    monkeypatch.setattr(detector, "inference_mode", "heuristic", raising=False)
    yield


class _FakeUpload:
    def __init__(self, data: bytes, content_type="image/png", filename="leaf.png"):
        self._data = data
        self.content_type = content_type
        self.filename = filename

    async def read(self, size=-1):
        if size is None or size < 0:
            return self._data
        return self._data[:size]


def _png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), (60, 140, 60)).save(buf, format="PNG")
    return buf.getvalue()


def _detect():
    return asyncio.run(
        image_main.detect_plant_disease(_FakeUpload(_png_bytes()), plant_type="tomato")
    )


def test_no_provider_fails_closed_without_onnx_classifier():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as error:
        _detect()
    assert error.value.status_code == 503
    assert error.value.detail["code"] == "DISEASE_CLASSIFIER_NOT_LOADED"


def test_configured_provider_is_used_and_labelled(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_VISION_MODEL", "gpt-4o-mini")

    def fake_image_json(self, image_b64, mime_type, prompt, **kwargs):
        return {
            "disease": "early_blight",
            "disease_name_ar": "اللفحة المبكرة",
            "confidence": 0.82,
            "severity": "high",
            "description": "بقع بنية دائرية",
            "treatment": ["مبيد نحاسي"],
            "prevention": ["دورة زراعية"],
        }

    monkeypatch.setattr(llm.LLMProvider, "chat_image_json", fake_image_json)

    result = _detect()
    assert result.data_source == "vision-model"
    assert result.is_real_data is True
    assert result.disease_detection["detection_method"] == "vision_model"
    assert result.disease_detection["primary_disease"]["disease"] == "early_blight"
    assert result.disease_detection["matched_catalogue"] is True


def test_provider_failure_fails_closed_without_onnx_classifier(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")

    def boom(self, *a, **k):
        raise llm.LLMError("timeout", "timed out", True)

    monkeypatch.setattr(llm.LLMProvider, "chat_image_json", boom)

    from fastapi import HTTPException

    with pytest.raises(HTTPException) as error:
        _detect()
    assert error.value.status_code == 503
    assert error.value.detail["code"] == "DISEASE_CLASSIFIER_NOT_LOADED"


def test_hallucinated_label_is_flagged(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")

    monkeypatch.setattr(
        llm.LLMProvider,
        "chat_image_json",
        lambda self, *a, **k: {"disease": "totally-made-up", "confidence": 0.9},
    )

    result = _detect()
    # The diagnosis is returned but flagged as not matching the catalogue.
    assert result.data_source == "vision-model"
    assert result.disease_detection["matched_catalogue"] is False


def test_vision_bridge_returns_none_without_provider():
    assert bridge.diagnose_with_vision(b"abc", "image/png", "tomato", {}) is None


def test_vision_bridge_returns_none_on_empty_image(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    assert bridge.diagnose_with_vision(b"", "image/png", "tomato", {}) is None


def test_confidence_is_clamped(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setattr(
        llm.LLMProvider,
        "chat_image_json",
        lambda self, *a, **k: {"disease": "early_blight", "confidence": 5},
    )
    out = bridge.diagnose_with_vision(b"abc", "image/png", "tomato", {})
    assert out["confidence"] == 1.0


def test_health_reports_vision_configured_without_claiming_request_usage(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_VISION_MODEL", "gpt-4o-mini")

    health = asyncio.run(image_main.health())

    assert health["status"] == "degraded"
    assert health["production_ready"] is False
    assert health["vision_configured"] is True
    assert health["vision_provider_configured"] is True
    assert health["model_source"] == "heuristic-demo"
    assert "No Tunisia field validation is implied." in health["disclaimer"]
