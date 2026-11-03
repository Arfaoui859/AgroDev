"""
Bridge between an uploaded plant image and a real vision model.

The image_diagnosis microservice ships a heuristic detector so it works with no
credentials. When a multimodal provider *is* configured, the service should ask
it for the diagnosis instead and say so. This module performs that call and
normalises the model's JSON reply into the shape the service already returns,
validating the disease against the service's own catalogue so a hallucinated
label is flagged rather than silently trusted.

Returns None when no provider is configured or the reply is unusable — the
caller then keeps the heuristic result and labels it as heuristic. It never
invents a diagnosis.
"""

from __future__ import annotations

import base64
import logging
from typing import Any, Dict, Optional

from .llm_provider import get_provider, LLMError

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a plant pathologist assisting farmers in Tunisia and the MENA "
    "region. Diagnose the plant in the image from its visible symptoms only. "
    "Be honest about uncertainty: if the image is unclear or the symptoms are "
    "not diagnostic, lower the confidence and say what additional photo or "
    "measurement would help. Never invent laboratory results. Reply with JSON "
    "only, in the requested schema."
)


def _catalogue_block(disease_db: Dict[str, Any]) -> str:
    if not disease_db:
        return "(no catalogue provided)"
    lines = []
    for key, info in disease_db.items():
        name_ar = (info or {}).get("name_ar", "")
        lines.append(f'- "{key}" ({name_ar})')
    return "\n".join(lines)


def _build_prompt(plant_type: Optional[str], disease_db: Dict[str, Any]) -> str:
    crop = plant_type or "unknown"
    return (
        f"Crop (if known): {crop}\n\n"
        "Known conditions in this platform's catalogue (choose one id when it "
        "matches, otherwise use a short descriptive id):\n"
        f"{_catalogue_block(disease_db)}\n\n"
        "Respond with a JSON object with exactly these keys:\n"
        "{\n"
        '  "disease": "<catalogue id or short descriptive id>",\n'
        '  "disease_name_ar": "<Arabic name>",\n'
        '  "confidence": <0..1>,\n'
        '  "severity": "low" | "medium" | "high",\n'
        '  "description": "<what you see and why>",\n'
        '  "symptoms": ["..."],\n'
        '  "causes": ["..."],\n'
        '  "treatment": ["..."],\n'
        '  "prevention": ["..."]\n'
        "}"
    )


def _as_string_list(value: Any) -> list:
    if isinstance(value, list):
        return [str(v) for v in value if isinstance(v, (str, int, float))]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _clamp_confidence(value: Any) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, number))


def diagnose_with_vision(
    image_bytes: bytes,
    mime_type: Optional[str],
    plant_type: Optional[str],
    disease_db: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Ask the configured vision model for a diagnosis, or return None.

    Raises nothing: provider failures are logged and surfaced as None so the
    caller keeps its heuristic result and labels it honestly.
    """
    provider = get_provider()
    if not provider.is_configured():
        return None
    if not image_bytes:
        return None

    mime = mime_type if (mime_type and mime_type.startswith("image/")) else "image/jpeg"
    image_b64 = base64.b64encode(image_bytes).decode("ascii")

    try:
        data = provider.chat_image_json(
            image_b64,
            mime,
            _build_prompt(plant_type, disease_db),
            system=SYSTEM_PROMPT,
        )
    except LLMError as exc:
        logger.warning("Vision diagnosis failed: %s", exc)
        return None

    if not isinstance(data, dict) or not data.get("disease"):
        logger.warning("Vision diagnosis returned no usable disease field")
        return None

    disease_id = str(data.get("disease")).strip()
    matched = disease_db.get(disease_id) if isinstance(disease_db, dict) else None

    return {
        "disease": disease_id,
        "disease_name_ar": data.get("disease_name_ar")
        or (matched or {}).get("name_ar")
        or disease_id,
        "confidence": _clamp_confidence(data.get("confidence")),
        "severity": str(data.get("severity") or (matched or {}).get("severity") or "medium").lower(),
        "description": str(data.get("description") or (matched or {}).get("description") or ""),
        "symptoms": _as_string_list(data.get("symptoms")),
        "causes": _as_string_list(data.get("causes")),
        "treatment": _as_string_list(data.get("treatment"))
        or _as_string_list((matched or {}).get("treatment")),
        "prevention": _as_string_list(data.get("prevention"))
        or _as_string_list((matched or {}).get("prevention")),
        # True when the model's label is one the platform's catalogue knows.
        "matched_catalogue": matched is not None,
        "model_source": provider.model_source(),
    }


def merge_into_detection(
    detection: Dict[str, Any],
    vision: Dict[str, Any],
) -> Dict[str, Any]:
    """Overlay a validated vision diagnosis onto the detector's payload.

    The detector's structural analysis (health score, affected areas, feature
    extraction) is retained; only the disease identification is replaced, and a
    `detection_method` marker records that a model produced it.
    """
    merged = dict(detection or {})
    confidence = vision.get("confidence", 0.0)
    merged["primary_disease"] = {
        "disease": vision["disease"],
        "disease_name_ar": vision["disease_name_ar"],
        "probability": confidence,
        "severity": vision.get("severity"),
        "description": vision.get("description"),
    }
    merged["top_predictions"] = [
        {
            "disease": vision["disease"],
            "disease_name_ar": vision["disease_name_ar"],
            "probability": confidence,
            "description": vision.get("description"),
            "severity_level": vision.get("severity"),
        }
    ]
    merged["confidence_score"] = confidence
    merged["detection_method"] = "vision_model"
    merged["symptoms"] = vision.get("symptoms", [])
    merged["causes"] = vision.get("causes", [])
    merged["treatment"] = vision.get("treatment", [])
    merged["prevention"] = vision.get("prevention", [])
    merged["matched_catalogue"] = vision.get("matched_catalogue", False)
    return merged
