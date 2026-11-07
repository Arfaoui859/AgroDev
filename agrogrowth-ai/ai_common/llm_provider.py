
"""
AgroGrowth LLM provider adapter.

Supports:
- OpenAI
- OpenRouter
- Groq
- Together
- Ollama
- vLLM
- Any OpenAI-compatible endpoint
- Gemini native API

No credentials => explicit deterministic/rule-based fallback.
"""

from __future__ import annotations

import json
import logging
import os
import random
import re
import time

from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any, Dict, List, Optional

import httpx


logger = logging.getLogger(__name__)

DEFAULT_MODEL_SOURCE = "rule-based-demo"
DEFAULT_MAX_RETRY_DELAY_S = 30.0

DEFAULT_BASE_URLS = {
    "openai": "https://api.openai.com/v1",
    "openrouter": "https://openrouter.ai/api/v1",
    "groq": "https://api.groq.com/openai/v1",
    "together": "https://api.together.xyz/v1",
    "ollama": "http://localhost:11434/v1",
    "vllm": "http://localhost:8000/v1",
}

DEFAULT_MODELS = {
    "openai": "gpt-4o-mini",
    "openrouter": "openai/gpt-4o-mini",
    "groq": "llama-3.1-8b-instant",
    "together": "meta-llama/Llama-3.2-3B-Instruct-Turbo",
    "ollama": "llama3.1",
    "vllm": "default",
    "gemini": "gemini-flash-latest",
}

OPENAI_COMPATIBLE_PROVIDERS = {
    "openai",
    "openrouter",
    "groq",
    "together",
    "ollama",
    "vllm",
    "openai-compatible",
}


class LLMError(RuntimeError):
    def __init__(
        self,
        kind: str,
        message: str,
        retryable: bool = False,
        retry_after_s: Optional[float] = None,
    ):
        super().__init__(message)
        self.kind = kind
        self.retryable = retryable
        self.retry_after_s = retry_after_s


@dataclass
class LLMConfig:
    kind: str
    provider: str
    base_url: Optional[str]
    api_key: Optional[str]
    model: str
    timeout_s: float
    max_retries: int
    retry_base_s: float = 0.4
    retry_max_s: float = DEFAULT_MAX_RETRY_DELAY_S


def _env(*names: str) -> Optional[str]:
    for name in names:
        value = os.getenv(name)
        if value and value.strip():
            return value.strip()
    return None


def _positive_int_env(name: str, default: int) -> int:
    value = _env(name)

    try:
        return int(value) if value is not None else default
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be an integer") from exc


def _none_config(
    timeout_ms: int,
    retries: int,
    retry_base_ms: int,
    retry_max_ms: int,
) -> LLMConfig:
    return LLMConfig(
        kind="none",
        provider="none",
        base_url=None,
        api_key=None,
        model="",
        timeout_s=timeout_ms / 1000,
        max_retries=retries,
        retry_base_s=retry_base_ms / 1000,
        retry_max_s=retry_max_ms / 1000,
    )


def parse_retry_after(value: Optional[str]) -> Optional[float]:
    if not value:
        return None

    try:
        return max(0.0, float(value.strip()))
    except (TypeError, ValueError):
        pass

    try:
        when = parsedate_to_datetime(value.strip())

        if when.tzinfo is None:
            when = when.replace(tzinfo=timezone.utc)

        return max(
            0.0,
            (when - datetime.now(timezone.utc)).total_seconds(),
        )

    except (TypeError, ValueError, OverflowError):
        return None


def backoff_delay_s(
    attempt: int,
    base_s: float,
    max_s: float = DEFAULT_MAX_RETRY_DELAY_S,
    retry_after_s: Optional[float] = None,
) -> float:
    cap = max(0.0, max_s)

    if retry_after_s is not None:
        return min(max(0.0, retry_after_s), cap)

    ceiling = min(
        max(0.0, base_s) * (2 ** max(0, attempt)),
        cap,
    )

    return random.uniform(0.0, ceiling)


def resolve_config() -> LLMConfig:
    label = (_env("AI_PROVIDER") or "").lower()

    timeout_ms = _positive_int_env("AI_TIMEOUT_MS", 30000)
    retries = _positive_int_env("AI_MAX_RETRIES", 1)
    retry_base_ms = _positive_int_env("AI_RETRY_BASE_MS", 400)
    retry_max_ms = _positive_int_env("AI_RETRY_MAX_MS", 30000)

    if timeout_ms <= 0:
        raise ValueError("AI_TIMEOUT_MS must be greater than zero")

    if retries < 0 or retries > 5:
        raise ValueError("AI_MAX_RETRIES must be between 0 and 5")

    if retry_base_ms < 0 or retry_max_ms < 0:
        raise ValueError("AI retry delays cannot be negative")

    base_url = _env("AI_BASE_URL")
    api_key = _env("AI_API_KEY")
    provider = label

    specific_keys = {
        "openai": _env("OPENAI_API_KEY"),
        "openrouter": _env("OPENROUTER_API_KEY"),
        "groq": _env("GROQ_API_KEY"),
        "together": _env("TOGETHER_API_KEY"),
    }

    gemini_key = _env("GEMINI_API_KEY", "GOOGLE_API_KEY")

    # Explicit provider selection.
    if label == "none":
        return _none_config(
            timeout_ms,
            retries,
            retry_base_ms,
            retry_max_ms,
        )

    # Resolve provider-specific credentials.
    if not api_key:
        if label == "gemini":
            api_key = gemini_key

        elif label in specific_keys:
            api_key = specific_keys[label]

        else:
            for candidate, key in specific_keys.items():
                if key:
                    provider = candidate
                    api_key = key
                    break

            if not api_key and gemini_key:
                provider = "gemini"
                api_key = gemini_key

    # Automatic provider selection.
    if not provider:
        if base_url:
            provider = "openai-compatible"

        elif api_key:
            provider = "openai"

        else:
            provider = "none"

    # No configured provider is a valid operating mode.
    if provider == "none":
        return _none_config(
            timeout_ms,
            retries,
            retry_base_ms,
            retry_max_ms,
        )

    # Gemini native API.
    if provider == "gemini":
        if not api_key:
            return _none_config(
                timeout_ms,
                retries,
                retry_base_ms,
                retry_max_ms,
            )

        return LLMConfig(
            kind="gemini",
            provider="gemini",
            base_url=None,
            api_key=api_key,
            model=_env("AI_MODEL") or DEFAULT_MODELS["gemini"],
            timeout_s=timeout_ms / 1000,
            max_retries=retries,
            retry_base_s=retry_base_ms / 1000,
            retry_max_s=retry_max_ms / 1000,
        )

    # OpenAI-compatible providers.
    if provider not in OPENAI_COMPATIBLE_PROVIDERS:
        raise ValueError(f"Unsupported AI_PROVIDER: {provider}")

    # A custom URL can be used without a key for local vLLM/Ollama.
    if not api_key and not base_url and provider not in {"ollama", "vllm"}:
        return _none_config(
            timeout_ms,
            retries,
            retry_base_ms,
            retry_max_ms,
        )

    if provider in {"ollama", "vllm"} and not base_url:
        base_url = DEFAULT_BASE_URLS[provider]

    resolved_base = (
        base_url
        or DEFAULT_BASE_URLS.get(
            provider,
            DEFAULT_BASE_URLS["openai"],
        )
    ).rstrip("/")

    model_default = DEFAULT_MODELS.get(
        provider,
        DEFAULT_MODELS["openai"],
    )

    return LLMConfig(
        kind="openai-compatible",
        provider=provider,
        base_url=resolved_base,
        api_key=api_key,
        model=_env("AI_MODEL") or model_default,
        timeout_s=timeout_ms / 1000,
        max_retries=retries,
        retry_base_s=retry_base_ms / 1000,
        retry_max_s=retry_max_ms / 1000,
    )


def is_configured() -> bool:
    try:
        return resolve_config().kind != "none"

    except (ValueError, TypeError):
        logger.exception("Invalid LLM configuration")
        return False


def model_source() -> str:
    cfg = resolve_config()

    if cfg.kind == "none":
        return DEFAULT_MODEL_SOURCE

    return f"{cfg.provider}:{cfg.model}"


def extract_json(text: str) -> Optional[Any]:
    if not isinstance(text, str) or not text.strip():
        return None

    candidates = []

    fenced = re.search(
        r"```(?:json)?\s*([\s\S]*?)\s*```",
        text,
        re.I,
    )

    if fenced:
        candidates.append(fenced.group(1).strip())

    candidates.append(text.strip())

    match = re.search(r"[\[{][\s\S]*[\]}]", text)

    if match:
        candidates.append(match.group(0))

    for candidate in candidates:
        try:
            return json.loads(candidate)

        except (ValueError, TypeError):
            continue

    return None


def _message_text(content: Any) -> str:
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        chunks = []

        for item in content:
            if isinstance(item, dict):
                text = item.get("text")

                if isinstance(text, str):
                    chunks.append(text)

        return "\n".join(chunks)

    return ""


class LLMProvider:
    def __init__(self, config: Optional[LLMConfig] = None):
        self._config = config

    @property
    def config(self) -> LLMConfig:
        # Explicitly supplied config is stable.
        # Default config is resolved dynamically from environment.
        return (
            self._config
            if self._config is not None
            else resolve_config()
        )

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
        cfg = self.config

        if cfg.kind == "none":
            raise LLMError(
                "unconfigured",
                "No LLM provider is configured",
            )

        last_error = None

        for attempt in range(cfg.max_retries + 1):
            try:
                if cfg.kind == "gemini":
                    return self._chat_gemini(
                        messages,
                        temperature,
                        max_tokens,
                        json_mode,
                        cfg,
                    )

                return self._chat_openai(
                    messages,
                    temperature,
                    max_tokens,
                    json_mode,
                    cfg,
                )

            except LLMError as exc:
                last_error = exc

                if not exc.retryable or attempt >= cfg.max_retries:
                    raise

                delay = backoff_delay_s(
                    attempt,
                    cfg.retry_base_s,
                    cfg.retry_max_s,
                    exc.retry_after_s,
                )

                logger.warning(
                    "LLM request failed; retrying in %.2fs (%s)",
                    delay,
                    exc.kind,
                )

                time.sleep(delay)

        raise last_error or LLMError(
            "unknown",
            "LLM request failed",
        )

    def chat_json(
        self,
        messages: List[Dict[str, str]],
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Optional[Any]:
        return extract_json(
            self.chat(
                messages,
                temperature=temperature,
                max_tokens=max_tokens,
                json_mode=True,
            )
        )

    def vision_model(self) -> str:
        return _env("AI_VISION_MODEL") or self.config.model

    def chat_with_image(
        self,
        image_b64: str,
        mime_type: str,
        prompt: str,
        *,
        system: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1200,
    ) -> str:
        cfg = self.config

        if cfg.kind == "none":
            raise LLMError(
                "unconfigured",
                "No vision provider is configured",
            )

        if mime_type not in {
            "image/jpeg",
            "image/png",
            "image/webp",
        }:
            raise LLMError(
                "input",
                "Unsupported image MIME type",
            )

        if cfg.kind == "gemini":
            parts = [
                {"text": prompt},
                {
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": image_b64,
                    }
                },
            ]

            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": parts,
                    }
                ],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens,
                    "responseMimeType": "application/json",
                },
            }

            if system:
                payload["systemInstruction"] = {
                    "parts": [{"text": system}]
                }

            url = (
                "https://generativelanguage.googleapis.com/v1beta/"
                f"models/{self.vision_model()}:generateContent"
            )

            data = self._post(
                url,
                {
                    "Content-Type": "application/json",
                    "x-goog-api-key": cfg.api_key or "",
                },
                payload,
                cfg,
            )

            return self._gemini_text(data)

        messages = []

        if system:
            messages.append(
                {
                    "role": "system",
                    "content": system,
                }
            )

        messages.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": (
                                f"data:{mime_type};base64,{image_b64}"
                            )
                        },
                    },
                ],
            }
        )

        payload = {
            "model": self.vision_model(),
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        url = f"{cfg.base_url}/chat/completions"

        headers = {
            "Content-Type": "application/json",
        }

        if cfg.api_key:
            headers["Authorization"] = f"Bearer {cfg.api_key}"

        data = self._post(url, headers, payload, cfg)

        try:
            content = data["choices"][0]["message"]["content"]
            text = _message_text(content)

            if not text:
                raise LLMError(
                    "protocol",
                    "Vision provider returned an empty message",
                )

            return text

        except (KeyError, IndexError, TypeError) as exc:
            raise LLMError(
                "protocol",
                "Unexpected vision provider response",
            ) from exc

    def chat_image_json(
        self,
        image_b64: str,
        mime_type: str,
        prompt: str,
        *,
        system: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1200,
    ) -> Optional[Any]:
        return extract_json(
            self.chat_with_image(
                image_b64,
                mime_type,
                prompt,
                system=system,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        )

    def _chat_openai(
        self,
        messages,
        temperature,
        max_tokens,
        json_mode,
        cfg,
    ):
        payload = {
            "model": cfg.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if json_mode:
            payload["response_format"] = {
                "type": "json_object"
            }

        headers = {
            "Content-Type": "application/json"
        }

        if cfg.api_key:
            headers["Authorization"] = f"Bearer {cfg.api_key}"

        data = self._post(
            f"{cfg.base_url}/chat/completions",
            headers,
            payload,
            cfg,
        )

        try:
            content = data["choices"][0]["message"]["content"]
            text = _message_text(content)

            if not text:
                raise LLMError(
                    "protocol",
                    "Provider returned an empty assistant message",
                )

            return text

        except (KeyError, IndexError, TypeError) as exc:
            raise LLMError(
                "protocol",
                "Unexpected OpenAI-compatible response",
            ) from exc

    def _chat_gemini(
        self,
        messages,
        temperature,
        max_tokens,
        json_mode,
        cfg,
    ):
        system_text = "\n\n".join(
            str(message.get("content", ""))
            for message in messages
            if message.get("role") == "system"
        )

        contents = []

        for message in messages:
            role = message.get("role")

            if role == "system":
                continue

            if role not in {"user", "assistant"}:
                continue

            contents.append(
                {
                    "role": (
                        "model"
                        if role == "assistant"
                        else "user"
                    ),
                    "parts": [
                        {
                            "text": str(
                                message.get("content", "")
                            )
                        }
                    ],
                }
            )

        if not contents:
            raise LLMError(
                "input",
                "At least one user message is required",
            )

        generation = {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }

        if json_mode:
            generation["responseMimeType"] = "application/json"

        payload = {
            "contents": contents,
            "generationConfig": generation,
        }

        if system_text:
            payload["systemInstruction"] = {
                "parts": [{"text": system_text}]
            }

        url = (
            "https://generativelanguage.googleapis.com/v1beta/"
            f"models/{cfg.model}:generateContent"
        )

        data = self._post(
            url,
            {
                "Content-Type": "application/json",
                "x-goog-api-key": cfg.api_key or "",
            },
            payload,
            cfg,
        )

        return self._gemini_text(data)

    @staticmethod
    def _gemini_text(data: Any) -> str:
        try:
            parts = data["candidates"][0]["content"]["parts"]

            text = "\n".join(
                part.get("text", "")
                for part in parts
                if isinstance(part, dict)
            )

            if not text:
                raise LLMError(
                    "protocol",
                    "Gemini returned no text candidate",
                )

            return text

        except (KeyError, IndexError, TypeError) as exc:
            raise LLMError(
                "protocol",
                "Unexpected Gemini response shape",
            ) from exc

    @staticmethod
    def _post(
        url: str,
        headers: Dict[str, str],
        payload: Dict[str, Any],
        cfg: LLMConfig,
    ) -> Any:
        try:
            with httpx.Client(
                timeout=cfg.timeout_s,
                follow_redirects=True,
            ) as client:
                response = client.post(
                    url,
                    headers=headers,
                    json=payload,
                )

        except httpx.TimeoutException as exc:
            raise LLMError(
                "timeout",
                f"Provider timed out after {cfg.timeout_s}s",
                True,
            ) from exc

        except httpx.HTTPError as exc:
            raise LLMError(
                "network",
                "Provider network request failed",
                True,
            ) from exc

        if (
            response.status_code == 429
            or response.status_code >= 500
        ):
            raise LLMError(
                "http",
                (
                    f"Provider HTTP {response.status_code}: "
                    f"{response.text[:300]}"
                ),
                True,
                parse_retry_after(
                    response.headers.get("retry-after")
                ),
            )

        if response.status_code >= 400:
            raise LLMError(
                "http",
                (
                    f"Provider HTTP {response.status_code}: "
                    f"{response.text[:300]}"
                ),
            )

        try:
            return response.json()

        except ValueError as exc:
            raise LLMError(
                "protocol",
                "Provider returned a non-JSON response",
            ) from exc


_default_provider: Optional[LLMProvider] = None


def get_provider() -> LLMProvider:
    global _default_provider

    # Reuse the adapter object. Its config is resolved dynamically
    # unless an explicit config was supplied.
    if _default_provider is None:
        _default_provider = LLMProvider()

    return _default_provider
