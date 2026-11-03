"""
Shared advisory layer for the AgroGrowth AI microservices.

The numeric services (soil analysis, crop recommendation, irrigation, pest
control, yield) compute a structured result from their own models and rules.
That structure is useful to the platform but it is not what a farmer reads.

This module turns such a structured result into a short, actionable advisory
in the farmer's language *when a provider is configured*. It never invents the
underlying numbers: the analysis is passed to the model as the only source of
truth, and the model is instructed to explain it rather than extend it.

When no provider is configured, or the call fails, `narrate()` returns None and
the caller keeps its structured result labelled as non-LLM. Callers must not
present a None advisory as if a model had produced it.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from .llm_provider import get_provider, LLMError

logger = logging.getLogger(__name__)

LANGUAGE_NAMES = {
    "ar": "Modern Standard Arabic",
    "ar-tn": "Tunisian Arabic (Derja)",
    "fr": "French",
    "en": "English",
}

SYSTEM_PROMPT = (
    "You are AgroGrowth's agronomist for Tunisia and the MENA region. You are "
    "given a structured analysis produced by AgroGrowth's own models. Explain "
    "it to the farmer in plain, practical language and give concrete next "
    "steps. Treat the analysis as the only source of truth: do not invent "
    "measurements, prices or weather, and if a value is missing say which "
    "measurement is needed. Do not return JSON; write a short advisory with "
    "headings."
)


def _language_name(language: Optional[str]) -> str:
    if not language:
        return LANGUAGE_NAMES["ar"]
    return LANGUAGE_NAMES.get(language.lower(), LANGUAGE_NAMES.get(language, language))


def narrate(
    analysis: Dict[str, Any],
    *,
    task: str,
    language: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    max_tokens: int = 700,
) -> Optional[Dict[str, Any]]:
    """Produce an LLM advisory for a structured analysis, or None.

    Returns a dict ``{"text", "language", "model_source"}`` on success. Returns
    None when no provider is configured or the call fails, so the caller can
    keep its structured result and label it as non-LLM.
    """
    provider = get_provider()
    if not provider.is_configured():
        return None
    if not analysis:
        return None

    lang = (language or "ar").lower()
    payload: Dict[str, Any] = {"task": task, "analysis": analysis}
    if context:
        payload["farmer_context"] = context

    try:
        text = provider.chat(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Write the advisory in {_language_name(lang)}.\n\n"
                        "Structured analysis (JSON):\n"
                        f"{json.dumps(payload, ensure_ascii=False, default=str)}\n\n"
                        "Write the advisory now."
                    ),
                },
            ],
            temperature=0.3,
            max_tokens=max_tokens,
        )
    except LLMError as exc:
        logger.warning("Advisory generation failed: %s", exc)
        return None

    text = (text or "").strip()
    if not text:
        return None
    return {"text": text, "language": lang, "model_source": provider.model_source()}
