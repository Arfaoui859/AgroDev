"""
The chat endpoint must label its answer honestly.

Before this, the assistant always answered from built-in rules while /health
said "healthy" and the reply carried no provenance, so a caller could not tell
rule output from model output. These tests drive the real endpoint coroutine:

  - with no provider configured the answer is labelled rule-based and is NOT
    marked as real data;
  - with a provider configured the provider is used and the answer is labelled
    as real model output;
  - when the configured provider fails, the rule-based answer is kept and is
    still labelled rule-based (never presented as model inference).
"""

import asyncio
import importlib
import sys
from pathlib import Path

import pytest

AI_ROOT = Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

agent_main = importlib.import_module("intelligent_agent.main")
llm = importlib.import_module("ai_common.llm_provider")

ENV_KEYS = ["AI_PROVIDER", "AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "GEMINI_API_KEY"]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    yield


def _ask(message="كيف أسمد شجرة الزيتون؟"):
    return asyncio.run(
        agent_main.chat_with_assistant(agent_main.ChatQueryRequest(message=message))
    )


def test_no_provider_labels_rule_based():
    body = _ask()
    data = body["data"]
    assert data["data_source"] == "rule-based"
    assert data["is_real_data"] is False
    assert "demo" in data["model_source"]
    # The answer text itself is still produced.
    assert data["response"]["text"]


def test_configured_provider_is_used_and_labelled(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setattr(
        llm.LLMProvider, "chat", lambda self, *a, **k: "استخدم السماد العضوي في الخريف."
    )

    body = _ask()
    data = body["data"]
    assert data["data_source"] == "llm"
    assert data["is_real_data"] is True
    assert data["response"]["text"] == "استخدم السماد العضوي في الخريف."
    # The grounded rule answer is retained for reference/auditing.
    assert data["response"]["rule_based_reference"]


def test_provider_failure_falls_back_and_stays_labelled(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")

    def boom(self, *a, **k):
        raise llm.LLMError("timeout", "timed out", True)

    monkeypatch.setattr(llm.LLMProvider, "chat", boom)

    body = _ask()
    data = body["data"]
    assert data["data_source"] == "rule-based"
    assert data["is_real_data"] is False
    # The rule-based answer is returned rather than an error or empty string.
    assert data["response"]["text"]


def test_health_reports_dynamic_provenance(monkeypatch):
    import re

    monkeypatch.setenv("AI_API_KEY", "k")
    monkeypatch.setenv("AI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setenv("AI_MODEL", "gpt-4o-mini")
    health = asyncio.run(agent_main.health_check())
    assert health["llm_configured"] is True
    assert health["model_source"].endswith(":gpt-4o-mini")
    # The gateway probe must classify a configured source as real inference.
    heuristic = re.compile(r"heuristic|demo|simulat|synthetic|mock|random|placeholder|dummy", re.I)
    assert not heuristic.search(health["model_source"])


def test_health_defaults_to_heuristic_marker():
    health = asyncio.run(agent_main.health_check())
    assert health["llm_configured"] is False
    assert "demo" in health["model_source"]
