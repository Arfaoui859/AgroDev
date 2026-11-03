"""
Real LLM provider adapter for the AgroGrowth Python AI microservices.

The microservices ship deterministic agronomic rules so they work with no
credentials at all. When a provider *is* configured, the assistant should use
it and say so, instead of always answering from the rules while the health
endpoint claims "healthy".

Two protocol families are supported, matching the Node adapter in
`server/services/providers/llmProvider.ts` so a single set of environment
variables configures the whole platform:

  1. "openai-compatible" — POST {base}/chat/completions
     (OpenAI, OpenRouter, Groq, Together, Ollama, vLLM, ...)
  2. "gemini"            — POST /v1beta/models/{model}:generateContent

Environment (all optional; when unset the caller must fall back to the
deterministic rules and label the answer as such):

  AI_PROVIDER     "openai-compatible" | "gemini" | "openai" | "openrouter" |
                  "groq" | "ollama". Optional label; the effective protocol is
                  derived from it plus the available credentials.
  AI_BASE_URL     openai-compatible endpoint (defaults per provider)
  AI_API_KEY      bearer token (provider-specific keys are also honoured)
  AI_MODEL        model used unless overridden
  AI_TIMEOUT_MS   request timeout (default 30000)
  AI_MAX_RETRIES  bounded retries (default 1)

Provider-specific keys are accepted so an existing deployment does not have to
be renamed: OPENAI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, TOGETHER_API_KEY,
GEMINI_API_KEY / GOOGLE_API_KEY.
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

# The provenance string reported when no provider is configured. It contains
# the word "demo" so the Node gateway probe classifies it as non-real.
DEFAULT_MODEL_SOURCE = "rule-based-demo"

DEFAULT_BASE_URLS: Dict[str, str] = {
    "openai": "https://api.openai.com/v1",
    "openrouter": "https://openrouter.ai/api/v1",
    "groq": "https://api.groq.com/openai/v1",
    "together": "https://api.together.xyz/v1",
    "ollama": "http://localhost:11434/v1",
}

DEFAULT_MODELS: Dict[str, str] = {
    "openai": "gpt-4o-mini",
    "openrouter": "openai/gpt-4o-mini",
    "groq": "llama-3.1-8b-instant",
    "together": "meta-llama/Llama-3.2-3B-Instruct-Turbo",
    "ollama": "llama3.1",
    "gemini": "gemini-1.5-flash",
}


class LLMError(RuntimeError):
    """Raised when a configured provider cannot produce a result."""

    def __init__(self, kind: str, message: str, retryable: bool = False):
        super().__init__(message)
        self.kind = kind
        self.retryable = retryable


@dataclass
class LLMConfig:
    kind: str  # "openai-compatible" | "gemini" | "none"
    provider: str
    base_url: Optional[str]
    api_key: Optional[str]
    model: str
    timeout_s: float
    max_retries: int


def _env(*names: str) -> Optional[str]:
    for name in names:
        value = os.environ.get(name)
        if value and value.strip():
            return value.strip()
    return None


def _first_env(*names: str) -> Optional[str]:
    return _env(*names)


def resolve_config() -> LLMConfig:
    """Resolve the effective provider configuration from the environment."""
    label = (_first_env("AI_PROVIDER") or "").lower()
    timeout_ms = int(_first_env("AI_TIMEOUT_MS") or "30000")
    max_retries = int(_first_env("AI_MAX_RETRIES") or "1")

    api_key = _first_env("AI_API_KEY")
    base_url = _first_env("AI_BASE_URL")
    provider = label

    # Provider-specific keys auto-select their provider when no explicit label.
    if not api_key:
        for candidate, key_env in (
            ("openai", "OPENAI_API_KEY"),
            ("openrouter", "OPENROUTER_API_KEY"),
            ("groq", "GROQ_API_KEY"),
            ("together", "TOGETHER_API_KEY"),
        ):
            key = _env(key_env)
            if key:
                api_key = key
                if not provider:
                    provider = candidate
                break

    gemini_key = _first_env("GEMINI_API_KEY", "GOOGLE_API_KEY")
    if not api_key and gemini_key:
        api_key = gemini_key
        if not provider:
            provider = "gemini"

    if not provider:
        if base_url:
            provider = "openai-compatible"
        elif api_key:
            provider = "openai"
        else:
            provider = "none"

    # Gemini uses the native wire format; everything else is OpenAI-compatible.
    if provider == "gemini" or label == "gemini":
        kind = "gemini" if (gemini_key or label == "gemini") else "none"
    else:
        kind = "openai-compatible" if (api_key or base_url) else "none"

    if kind == "none":
        return LLMConfig(
            kind="none",
            provider="none",
            base_url=None,
            api_key=None,
            model="",
            timeout_s=timeout_ms / 1000,
            max_retries=max_retries,
        )

    if kind == "gemini":
        model = _first_env("AI_MODEL") or DEFAULT_MODELS["gemini"]
        return LLMConfig(
            kind="gemini",
            provider="gemini",
            base_url=None,
            api_key=api_key,
            model=model,
            timeout_s=timeout_ms / 1000,
            max_retries=max_retries,
        )

    resolved_base = base_url or DEFAULT_BASE_URLS.get(provider, DEFAULT_BASE_URLS["openai"])
    model = _first_env("AI_MODEL") or DEFAULT_MODELS.get(provider, DEFAULT_MODELS["openai"])
    return LLMConfig(
        kind="openai-compatible",
        provider=provider,
        base_url=resolved_base.rstrip("/"),
        api_key=api_key,
        model=model,
        timeout_s=timeout_ms / 1000,
        max_retries=max_retries,
    )


def is_configured() -> bool:
    return resolve_config().kind != "none"


def model_source() -> str:
    """Provenance string for /health. Contains a heuristic marker when unset."""
    cfg = resolve_config()
    if cfg.kind == "none":
        return DEFAULT_MODEL_SOURCE
    return f"{cfg.provider}:{cfg.model}"


def extract_json(text: str) -> Optional[Any]:
    """Best-effort JSON extraction from a model reply (fenced or raw)."""
    if not text:
        return None
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    candidate = fenced.group(1) if fenced else None
    if candidate is None:
        brace = re.search(r"\{[\s\S]*\}", text)
        candidate = brace.group(0) if brace else None
    if candidate is None:
        return None
    try:
        return json.loads(candidate)
    except (ValueError, TypeError):
        return None


class LLMProvider:
    """Stateless client for the configured text LLM."""

    def __init__(self, config: Optional[LLMConfig] = None):
        self._config = config

    @property
    def config(self) -> LLMConfig:
        # Resolved on every access rather than cached: the environment can
        # change at runtime (and tests reconfigure providers between cases), and
        # a stale cache would silently route to the wrong protocol or model.
        if self._config is not None:
            return self._config
        return resolve_config()

    def is_configured(self) -> bool:
        return self.config.kind != "none"

    def model_source(self) -> str:
        cfg = self.config
        if cfg.kind == "none":
            return DEFAULT_MODEL_SOURCE
        return f"{cfg.provider}:{cfg.model}"

    def chat(
        self,
        messages: List[Dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> str:
        """Send a chat completion request, returning the assistant text.

        Raises LLMError on any failure so callers fall back explicitly rather
        than receiving fabricated text.
        """
        cfg = self.config
        if cfg.kind == "none":
            raise LLMError("unconfigured", "No LLM provider is configured")

        last_error: Optional[LLMError] = None
        for attempt in range(cfg.max_retries + 1):
            try:
                if cfg.kind == "gemini":
                    return self._chat_gemini(messages, temperature, max_tokens, json_mode)
                return self._chat_openai(messages, temperature, max_tokens, json_mode)
            except LLMError as exc:
                last_error = exc
                if not exc.retryable or attempt == cfg.max_retries:
                    raise
                logger.warning(
                    "LLM call failed (attempt %d/%d): %s",
                    attempt + 1,
                    cfg.max_retries + 1,
                    exc,
                )
        raise last_error or LLMError("unknown", "LLM call failed")

    def chat_json(
        self,
        messages: List[Dict[str, str]],
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Optional[Any]:
        """Chat and parse a JSON object/array from the reply, or None."""
        text = self.chat(messages, temperature=temperature, max_tokens=max_tokens, json_mode=True)
        return extract_json(text)

    # -- protocol implementations -------------------------------------------

    def _chat_openai(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> str:
        cfg = self.config
        url = f"{cfg.base_url}/chat/completions"
        headers = {"Content-Type": "application/json"}
        if cfg.api_key:
            headers["Authorization"] = f"Bearer {cfg.api_key}"
        payload: Dict[str, Any] = {
            "model": cfg.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        data = self._post(url, headers, payload)
        try:
            return data["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMError("protocol", f"Unexpected provider response shape: {exc}") from exc

    def _chat_gemini(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> str:
        cfg = self.config
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{cfg.model}:generateContent?key={cfg.api_key}"
        )
        # Gemini takes system text separately and a flat contents list.
        system_text = "\n\n".join(m["content"] for m in messages if m.get("role") == "system")
        contents = [
            {"role": "user" if m.get("role") != "assistant" else "model",
             "parts": [{"text": m.get("content", "")}]}
            for m in messages
            if m.get("role") != "system"
        ]
        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }
        if system_text:
            payload["systemInstruction"] = {"parts": [{"text": system_text}]}
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        data = self._post(url, {"Content-Type": "application/json"}, payload)
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"] or ""
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMError("protocol", f"Unexpected Gemini response shape: {exc}") from exc

    def _post(self, url: str, headers: Dict[str, str], payload: Dict[str, Any]) -> Any:
        cfg = self.config
        try:
            with httpx.Client(timeout=cfg.timeout_s) as client:
                response = client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException as exc:
            raise LLMError("timeout", f"Provider request timed out after {cfg.timeout_s}s", True) from exc
        except httpx.HTTPError as exc:
            raise LLMError("network", f"Provider request failed: {exc}", True) from exc

        if response.status_code == 429 or response.status_code >= 500:
            raise LLMError(
                "http",
                f"Provider responded with HTTP {response.status_code}: {response.text[:200]}",
                True,
            )
        if response.status_code >= 400:
            raise LLMError(
                "http",
                f"Provider responded with HTTP {response.status_code}: {response.text[:200]}",
                False,
            )
        try:
            return response.json()
        except ValueError as exc:
            raise LLMError("protocol", f"Provider returned non-JSON body: {exc}") from exc


_default_provider: Optional[LLMProvider] = None


def get_provider() -> LLMProvider:
    """Process-wide provider (configuration is read lazily per call)."""
    global _default_provider
    if _default_provider is None:
        _default_provider = LLMProvider()
    return _default_provider
