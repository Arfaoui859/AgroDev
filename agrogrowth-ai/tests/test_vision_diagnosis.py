"""
The image diagnosis endpoint must label its diagnosis honestly.

The service ships a heuristic detector. When a multimodal provider is
configured it must be used and the result labelled real; when it is not (or it
fails) the heuristic result must be labelled as heuristic. This mirrors the
Node-side contract so a farmer is never shown a heuristic guess as a model
prediction.

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


def test_no_provider_labels_heuristic():
    result = _detect()
    assert result.data_source == "heuristic"
    assert result.is_real_data is False
    assert result.model_source == "feature-based-heuristics"
    assert result.disease_detection["detection_method"] == "feature_based_heuristics"


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


def test_provider_failure_falls_back_and_stays_labelled(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")

    def boom(self, *a, **k):
        raise llm.LLMError("timeout", "timed out", True)

    monkeypatch.setattr(llm.LLMProvider, "chat_image_json", boom)

    result = _detect()
    assert result.data_source == "heuristic"
    assert result.is_real_data is False


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

    assert health["status"] == "healthy"
    assert health["vision_configured"] is True
    assert health["vision_provider_configured"] is True
    assert health["model_source"] == "heuristic-demo"
    assert "No scientific validation is implied." in health["disclaimer"]
