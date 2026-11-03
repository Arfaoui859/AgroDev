"""
Tests for the Python LLM provider adapter.

The adapter is what turns the rule-based assistant into a real provider-backed
one. These tests pin the contract:

  - with no credentials it reports unconfigured and the default provenance
    carries a heuristic marker, so the gateway never labels rules as real;
  - a configured OpenAI-compatible provider is called with the right wire
    format and its text is returned;
  - a configured Gemini provider uses the native generateContent format;
  - HTTP errors, timeouts and malformed bodies raise LLMError instead of
    fabricating a result;
  - retryable failures are retried up to AI_MAX_RETRIES.

No real network call is made: httpx.Client.post is monkeypatched.
"""

import json
import pathlib
import sys

import httpx
import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from ai_common import llm_provider as lp  # noqa: E402

ENV_KEYS = [
    "AI_PROVIDER",
    "AI_BASE_URL",
    "AI_API_KEY",
    "AI_MODEL",
    "AI_TIMEOUT_MS",
    "AI_MAX_RETRIES",
    "OPENAI_API_KEY",
    "OPENROUTER_API_KEY",
    "GROQ_API_KEY",
    "TOGETHER_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    yield


def _response(status: int, body) -> httpx.Response:
    return httpx.Response(
        status_code=status,
        content=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )


class _Recorder:
    """Stands in for httpx.Client, recording the last request."""

    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def post(self, url, headers=None, json=None):  # noqa: A002 - httpx signature
        self.calls.append({"url": url, "headers": headers, "json": json})
        item = self.responses[min(len(self.calls) - 1, len(self.responses) - 1)]
        if isinstance(item, Exception):
            raise item
        return item


def _patch_client(monkeypatch, recorder):
    class _Client:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return recorder

        def __exit__(self, *a):
            return False

    monkeypatch.setattr(lp.httpx, "Client", _Client)


def test_unconfigured_reports_heuristic_default():
    cfg = lp.resolve_config()
    assert cfg.kind == "none"
    assert lp.is_configured() is False
    assert lp.model_source() == lp.DEFAULT_MODEL_SOURCE
    assert "demo" in lp.model_source()


def test_unknown_message_source_marker_detected_by_gateway_regex():
    import re

    gateway = re.compile(r"heuristic|demo|simulat|synthetic|mock|random|placeholder|dummy", re.I)
    assert gateway.search(lp.DEFAULT_MODEL_SOURCE)


def test_openai_compatible_success(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_MODEL", "gpt-4o-mini")
    rec = _Recorder([_response(200, {"choices": [{"message": {"content": "مرحبا"}}]})])
    _patch_client(monkeypatch, rec)

    text = lp.get_provider().chat([{"role": "user", "content": "hi"}])
    assert text == "مرحبا"
    assert rec.calls[0]["url"] == "https://api.openai.com/v1/chat/completions"
    assert rec.calls[0]["headers"]["Authorization"] == "Bearer k"
    assert rec.calls[0]["json"]["model"] == "gpt-4o-mini"


def test_openrouter_key_autoselects_provider(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "k")
    cfg = lp.resolve_config()
    assert cfg.provider == "openrouter"
    assert cfg.base_url == "https://openrouter.ai/api/v1"


def test_local_base_url_needs_no_key(monkeypatch):
    monkeypatch.setenv("AI_BASE_URL", "http://localhost:11434/v1")
    assert lp.is_configured() is True
    assert lp.resolve_config().provider == "openai-compatible"


def test_gemini_uses_native_format(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    monkeypatch.setenv("AI_MODEL", "gemini-1.5-flash")
    rec = _Recorder(
        [_response(200, {"candidates": [{"content": {"parts": [{"text": "ok"}]}}]})]
    )
    _patch_client(monkeypatch, rec)

    text = lp.get_provider().chat(
        [{"role": "system", "content": "sys"}, {"role": "user", "content": "q"}]
    )
    assert text == "ok"
    assert "generateContent" in rec.calls[0]["url"]
    assert "key=k" in rec.calls[0]["url"]
    assert rec.calls[0]["json"]["systemInstruction"]["parts"][0]["text"] == "sys"


def test_http_error_raises_not_fabricates(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_MAX_RETRIES", "0")
    _patch_client(monkeypatch, _Recorder([_response(400, {"error": "bad"})]))

    with pytest.raises(lp.LLMError) as exc:
        lp.get_provider().chat([{"role": "user", "content": "hi"}])
    assert exc.value.kind == "http"
    assert exc.value.retryable is False


def test_timeout_raises_and_is_retryable(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_MAX_RETRIES", "1")
    rec = _Recorder([httpx.TimeoutException("slow"), httpx.TimeoutException("slow")])
    _patch_client(monkeypatch, rec)

    with pytest.raises(lp.LLMError) as exc:
        lp.get_provider().chat([{"role": "user", "content": "hi"}])
    assert exc.value.kind == "timeout"
    assert len(rec.calls) == 2  # retried once


def test_retryable_then_success(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_MAX_RETRIES", "1")
    rec = _Recorder(
        [
            _response(500, {"error": "upstream"}),
            _response(200, {"choices": [{"message": {"content": "recovered"}}]}),
        ]
    )
    _patch_client(monkeypatch, rec)

    assert lp.get_provider().chat([{"role": "user", "content": "hi"}]) == "recovered"
    assert len(rec.calls) == 2


def test_malformed_body_raises_protocol_error(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_MAX_RETRIES", "0")
    _patch_client(monkeypatch, _Recorder([_response(200, {"unexpected": True})]))

    with pytest.raises(lp.LLMError) as exc:
        lp.get_provider().chat([{"role": "user", "content": "hi"}])
    assert exc.value.kind == "protocol"


def test_chat_requires_a_configured_provider():
    with pytest.raises(lp.LLMError) as exc:
        lp.get_provider().chat([{"role": "user", "content": "hi"}])
    assert exc.value.kind == "unconfigured"


def test_extract_json_handles_fences_and_raw():
    assert lp.extract_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert lp.extract_json('prefix {"b": 2} suffix') == {"b": 2}
    assert lp.extract_json("no json here") is None
