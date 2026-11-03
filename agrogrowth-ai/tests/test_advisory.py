"""
The shared advisory layer must be honest about its provenance.

`narrate()` adds a natural-language explanation on top of a service's numeric
analysis. It must return None (so the caller keeps its structured result
labelled non-LLM) when no provider is configured or the call fails, and it must
never invent the underlying numbers — the analysis is passed to the model as
the only source of truth.
"""

import importlib
import pathlib
import sys

import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

advisory = importlib.import_module("ai_common.advisory")
llm = importlib.import_module("ai_common.llm_provider")

ENV_KEYS = ["AI_PROVIDER", "AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "GEMINI_API_KEY"]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    yield


def test_returns_none_without_provider():
    assert advisory.narrate({"health_score": 0.7}, task="explain") is None


def test_returns_none_for_empty_analysis(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    assert advisory.narrate({}, task="explain") is None


def test_success_returns_labelled_text(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_MODEL", "gpt-4o-mini")
    monkeypatch.setattr(
        llm.LLMProvider, "chat", lambda self, *a, **k: "نصيحة للمزارع."
    )

    out = advisory.narrate({"health_score": 0.7}, task="explain", language="ar")
    assert out["text"] == "نصيحة للمزارع."
    assert out["language"] == "ar"
    assert out["model_source"].endswith(":gpt-4o-mini")


def test_failure_returns_none(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")

    def boom(self, *a, **k):
        raise llm.LLMError("timeout", "timed out", True)

    monkeypatch.setattr(llm.LLMProvider, "chat", boom)
    assert advisory.narrate({"health_score": 0.7}, task="explain") is None


def test_blank_reply_returns_none(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setattr(llm.LLMProvider, "chat", lambda self, *a, **k: "   ")
    assert advisory.narrate({"health_score": 0.7}, task="explain") is None


def test_analysis_is_sent_as_source_of_truth(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    captured = {}

    def capture(self, messages, **kwargs):
        captured["messages"] = messages
        return "ok"

    monkeypatch.setattr(llm.LLMProvider, "chat", capture)
    advisory.narrate(
        {"health_score": 0.42, "fertility_level": "low"},
        task="Explain this soil analysis.",
        language="fr",
    )
    user_text = captured["messages"][-1]["content"]
    assert "0.42" in user_text
    assert "low" in user_text
    # The requested language must reach the prompt.
    assert "French" in user_text
