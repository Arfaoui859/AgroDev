"""Validated multi-agent orchestration for AgroGrowth.

The LLM selects specialist tools; it never invents tool arguments. Arguments must
be supplied explicitly in tool_inputs and are validated before dispatch.
"""
from __future__ import annotations

import asyncio
import base64
import binascii
import json
import logging
import os
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urlsplit

import httpx

from ai_common.llm_provider import LLMError, get_provider

logger = logging.getLogger(__name__)

MAX_MESSAGE_CHARS = 6000
MAX_PARALLEL_TOOLS = 5
MAX_IMAGE_BYTES = 10 * 1024 * 1024

AGENT_TOOLS: Dict[str, Dict[str, Any]] = {
    "soil.analyze": {
        "agent": "soil_agent", "service_env": ("SOIL_ANALYSIS_URL",),
        "default_url": "http://localhost:8001", "endpoint": "/analyze-soil",
        "required": ["sensor_data"],
        "description": "Rule-based screening of supplied soil sensor measurements.",
    },
    "soil.lab_predict": {
        "agent": "soil_agent", "service_env": ("SOIL_ANALYSIS_URL",),
        "default_url": "http://localhost:8001", "endpoint": "/predict-lab-soil",
        "required": ["lab_values"],
        "description": "Lab-assisted soil predictions; requires the complete supported laboratory analyte panel.",
    },
    "crop.recommend": {
        "agent": "crop_agent", "service_env": ("CROP_RECOMMENDATION_URL",),
        "default_url": "http://localhost:8002", "endpoint": "/recommend-crops",
        "required": [
            "temperature", "annual_rainfall", "soil_ph", "soil_quality_score",
            "water_availability", "target_market_price", "farmer_experience_years",
            "available_capital", "farm_size", "risk_tolerance",
        ],
        "description": "Ranks crops from explicit climate, soil, water, market and farm inputs.",
    },
    "image.detect_disease": {
        "agent": "vision_agent", "service_env": ("IMAGE_DIAGNOSIS_URL",),
        "default_url": "http://localhost:8003", "endpoint": "/detect-disease",
        "required": ["image_base64"], "kind": "image",
        "description": "Runs the configured plant disease image classifier on an attached image.",
    },
    "market.forecast_price": {
        "agent": "market_agent", "service_env": ("MARKET_FORECAST_URL", "MARKET_PREDICTION_URL"),
        "default_url": "http://localhost:8004", "endpoint": "/forecast-price",
        "required": ["crop_type", "current_price"],
        "description": "Indicative price forecast; current price must be supplied or sourced by the caller.",
    },
    "market.supply_demand": {
        "agent": "market_agent", "service_env": ("MARKET_FORECAST_URL", "MARKET_PREDICTION_URL"),
        "default_url": "http://localhost:8004", "endpoint": "/analyze-supply-demand",
        "required": ["crop_type", "current_production"],
        "description": "Indicative supply-demand analysis from supplied production data.",
    },
    "weather.create_plan": {
        "agent": "weather_agent", "service_env": ("WEATHER_YIELD_INTELLIGENCE_URL", "SMART_MARKETPLACE_URL"),
        "default_url": "http://localhost:8006", "endpoint": "/create-weather-plan",
        "required": ["location", "historical_weather", "current_conditions"],
        "description": "Creates a weather-based crop plan from explicit location and weather inputs.",
    },
    "weather.predict_yield": {
        "agent": "yield_agent", "service_env": ("WEATHER_YIELD_INTELLIGENCE_URL", "SMART_MARKETPLACE_URL"),
        "default_url": "http://localhost:8006", "endpoint": "/predict-crop-yield",
        "required": ["crop_type", "location", "weather_data", "soil_data", "management_practices", "farm_size"],
        "description": "Returns an explicitly synthetic/demo yield estimate from supplied farm inputs.",
    },
    "pest.analyze": {
        "agent": "pest_agent", "service_env": ("PEST_CONTROL_URL",),
        "default_url": "http://localhost:8007", "endpoint": "/analyze-pest-problem",
        "required": [
            "crop_type", "symptoms", "affected_area_percentage", "affected_plant_count",
            "total_plant_count", "plant_age_days", "plant_health_score",
            "weather_conditions", "farm_size", "plant_density", "irrigation_frequency",
        ],
        "description": "Assesses pest pressure from explicit crop, symptom, field and weather inputs.",
    },
    "irrigation.optimize": {
        "agent": "irrigation_agent", "service_env": ("IRRIGATION_OPTIMIZATION_URL",),
        "default_url": "http://localhost:8008", "endpoint": "/optimize-irrigation",
        "required": ["crop_type", "growth_stage", "weather_data", "soil_data", "farm_size"],
        "description": "Builds an indicative irrigation schedule from supplied weather, soil and crop inputs.",
    },
}

KEYWORD_ROUTING = {
    "soil.analyze": ("soil", "تربة", "soil analysis", "تحليل التربة"),
    "soil.lab_predict": ("lab_values", "laboratory soil", "تحليل مخبري"),
    "crop.recommend": ("crop recommendation", "recommend crop", "شنوّة نزرع", "ماذا أزرع", "choisir culture"),
    "image.detect_disease": ("disease", "مرض", "تشخيص صورة", "plant photo", "leaf image"),
    "market.forecast_price": ("price forecast", "سعر", "prix", "market price"),
    "market.supply_demand": ("supply demand", "العرض والطلب", "offre demande"),
    "weather.create_plan": ("weather plan", "طقس", "مناخ", "météo"),
    "weather.predict_yield": ("yield", "مردودية", "production estimate", "rendement"),
    "pest.analyze": ("pest", "آفة", "حشرة", "ravageur"),
    "irrigation.optimize": ("irrigation", "ري", "السقي", "arrosage"),
}


def _non_empty(value: Any) -> bool:
    return value is not None and value != "" and value != [] and value != {}


def missing_required_fields(tool_name: str, payload: Any) -> List[str]:
    spec = AGENT_TOOLS[tool_name]
    if not isinstance(payload, dict):
        return list(spec["required"])
    return [key for key in spec["required"] if key not in payload or not _non_empty(payload[key])]


def _service_url(spec: Dict[str, Any]) -> str:
    raw = next((os.getenv(name, "").strip() for name in spec["service_env"] if os.getenv(name, "").strip()), spec["default_url"])
    # Render private-service hostport references are host:port without a scheme.
    if "://" not in raw:
        raw = "http://" + raw
    parsed = urlsplit(raw)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError("Configured AI service URL is invalid")
    if parsed.query or parsed.fragment:
        raise ValueError("Configured AI service URL must not contain query or fragment")
    return raw.rstrip("/") + spec["endpoint"]


def _decode_image(value: str) -> tuple[bytes, str, str]:
    if not isinstance(value, str):
        raise ValueError("image_base64 must be a string")
    encoded = value.split(",", 1)[1] if value.startswith("data:") and "," in value else value
    try:
        content = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("image_base64 must contain valid base64 image data") from exc
    if not content or len(content) > MAX_IMAGE_BYTES:
        raise ValueError("Image must be between 1 byte and 10 MB")
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return content, "image/png", "upload.png"
    if content.startswith(b"\xff\xd8\xff"):
        return content, "image/jpeg", "upload.jpg"
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return content, "image/webp", "upload.webp"
    raise ValueError("Only PNG, JPEG and WebP images are accepted")




def _redact_context(value: Any) -> Any:
    sensitive_exact = {
        "id", "user_id", "farm_id", "email", "phone", "authorization",
        "access_token", "refresh_token", "api_key", "password", "secret",
    }
    if isinstance(value, dict):
        return {
            key: _redact_context(child)
            for key, child in value.items()
            if key.lower() not in sensitive_exact
            and not key.lower().endswith("_token")
            and not key.lower().endswith("_secret")
        }
    if isinstance(value, list):
        return [_redact_context(child) for child in value]
    return value


def _parse_result_reference(value: Any) -> Optional[tuple[str, List[str]]]:
    if not isinstance(value, str) or not value.startswith("$results."):
        return None
    tail = value[len("$results."):]
    for tool_name in sorted(AGENT_TOOLS, key=len, reverse=True):
        prefix = tool_name + "."
        if tail.startswith(prefix):
            return tool_name, tail[len(prefix):].split(".")
    raise ValueError("Unknown tool result reference: " + value)


def _collect_dependencies(value: Any) -> set[str]:
    dependencies: set[str] = set()
    if isinstance(value, dict):
        for child in value.values():
            dependencies.update(_collect_dependencies(child))
    elif isinstance(value, list):
        for child in value:
            dependencies.update(_collect_dependencies(child))
    else:
        reference = _parse_result_reference(value)
        if reference:
            dependencies.add(reference[0])
    return dependencies


def _resolve_result_reference(value: str, completed: Dict[str, Dict[str, Any]]) -> Any:
    reference = _parse_result_reference(value)
    if not reference:
        return value
    tool_name, path = reference
    if tool_name not in completed:
        raise ValueError(f"Dependency has not completed: {tool_name}")
    current: Any = completed[tool_name]
    for segment in path:
        if isinstance(current, dict) and segment in current:
            current = current[segment]
        elif isinstance(current, list) and segment.isdigit() and int(segment) < len(current):
            current = current[int(segment)]
        else:
            raise ValueError(f"Result reference path is unavailable: {value}")
    if current is None:
        raise ValueError(f"Result reference resolved to null: {value}")
    return current


def _resolve_payload_references(value: Any, completed: Dict[str, Dict[str, Any]]) -> Any:
    if isinstance(value, dict):
        return {key: _resolve_payload_references(child, completed) for key, child in value.items()}
    if isinstance(value, list):
        return [_resolve_payload_references(child, completed) for child in value]
    if isinstance(value, str) and value.startswith("$results."):
        return _resolve_result_reference(value, completed)
    return value


def _keyword_plan(message: str, tool_inputs: Dict[str, Any], limit: int) -> List[str]:
    text = message.casefold()
    selected = []
    for name, words in KEYWORD_ROUTING.items():
        if any(word.casefold() in text for word in words):
            selected.append(name)
    return selected[:limit]


async def _plan_tools(message: str, language: str, tool_inputs: Dict[str, Any], limit: int) -> tuple[List[str], str]:
    provider = get_provider()
    if not provider.is_configured():
        return _keyword_plan(message, tool_inputs, limit), "keyword-router-no-llm"

    contracts = [
        {"name": name, "agent": spec["agent"], "description": spec["description"],
         "required_fields": spec["required"]}
        for name, spec in AGENT_TOOLS.items()
    ]
    prompt = {
        "user_message": message,
        "language": language,
        "tool_input_keys": {name: sorted(value.keys()) for name, value in tool_inputs.items() if isinstance(value, dict)},
        "available_tools": contracts,
        "max_tools": limit,
    }
    system = (
        "You are the AgroGrowth central orchestration planner. Select only tools that are "
        "directly relevant to the user's request. Never invent arguments or claim a tool ran. "
        "Tool arguments are supplied separately by the application; you only select tool names. "
        "If required inputs are absent, still select the relevant tool so the application can "
        "return its exact missing fields. Return ONLY JSON with keys selected_tools (array of "
        "tool names) and clarifying_questions (array of short questions). Do not select every tool."
    )
    try:
        raw = await asyncio.to_thread(
            provider.chat,
            [{"role": "system", "content": system},
             {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)}],
            temperature=0.0, max_tokens=500, json_mode=True,
        )
        parsed = json.loads(raw)
        requested = parsed.get("selected_tools", [])
        if not isinstance(requested, list):
            raise ValueError("selected_tools must be an array")
        selected = []
        for name in requested:
            if isinstance(name, str) and name in AGENT_TOOLS and name not in selected:
                selected.append(name)
        return selected[:limit], "llm-planner:" + provider.model_source()
    except (LLMError, ValueError, TypeError, json.JSONDecodeError) as exc:
        logger.warning("Orchestration planner unavailable; using explicit keyword router (%s)", type(exc).__name__)
        return _keyword_plan(message, tool_inputs, limit), "keyword-router-fallback"


async def _execute_tool(tool_name: str, payload: Dict[str, Any], timeout_s: float) -> Dict[str, Any]:
    spec = AGENT_TOOLS[tool_name]
    started = time.perf_counter()
    try:
        url = _service_url(spec)
        async with httpx.AsyncClient(timeout=timeout_s, follow_redirects=False) as client:
            if spec.get("kind") == "image":
                image, content_type, filename = _decode_image(str(payload["image_base64"]))
                form = {key: str(value) for key, value in payload.items() if key != "image_base64" and value is not None}
                response = await client.post(url, files={"file": (filename, image, content_type)}, data=form)
            else:
                response = await client.post(url, json=payload)
        elapsed = round((time.perf_counter() - started) * 1000)
        try:
            body = response.json()
        except ValueError:
            body = {"message": response.text[:1000]}
        if not 200 <= response.status_code < 300:
            return {"tool": tool_name, "agent": spec["agent"], "status": "error",
                    "status_code": response.status_code, "duration_ms": elapsed, "error": body}
        source = body.get("model_source") or body.get("modelSource") or body.get("data_source") or body.get("dataSource")
        real = body.get("is_real_data", body.get("isRealData"))
        return {"tool": tool_name, "agent": spec["agent"], "status": "success",
                "status_code": response.status_code, "duration_ms": elapsed,
                "model_source": source, "is_real_data": real, "result": body}
    except Exception as exc:
        return {"tool": tool_name, "agent": spec["agent"], "status": "error",
                "duration_ms": round((time.perf_counter() - started) * 1000),
                "error": {"type": type(exc).__name__, "message": str(exc)[:500]}}


async def orchestrate(
    message: str,
    *,
    language: str = "ar",
    user_context: Optional[Dict[str, Any]] = None,
    tool_inputs: Optional[Dict[str, Dict[str, Any]]] = None,
    max_agents: int = 5,
) -> Dict[str, Any]:
    if not isinstance(message, str) or not message.strip() or len(message) > MAX_MESSAGE_CHARS:
        raise ValueError(f"message must contain 1 to {MAX_MESSAGE_CHARS} characters")
    if max_agents < 1 or max_agents > MAX_PARALLEL_TOOLS:
        raise ValueError(f"max_agents must be between 1 and {MAX_PARALLEL_TOOLS}")
    inputs = tool_inputs or {}
    if not isinstance(inputs, dict):
        raise ValueError("tool_inputs must be an object keyed by registered tool name")
    unknown = sorted(set(inputs) - set(AGENT_TOOLS))
    if unknown:
        raise ValueError("Unknown tool_inputs keys: " + ", ".join(unknown))
    context = user_context or {}
    if not isinstance(context, dict):
        raise ValueError("user_context must be an object")

    selected, planner_source = await _plan_tools(message, language, inputs, max_agents)

    # Explicit result references form a small dependency graph. Add referenced
    # upstream tools only when their payload was supplied by the caller.
    dependency_queue = list(selected)
    while dependency_queue:
        name = dependency_queue.pop(0)
        for dependency in sorted(_collect_dependencies(inputs.get(name, {}))):
            if dependency not in selected and dependency in inputs and len(selected) < max_agents:
                selected.append(dependency)
                dependency_queue.append(dependency)

    missing: Dict[str, List[str]] = {}
    ready = set()
    for name in selected:
        absent = missing_required_fields(name, inputs.get(name))
        if absent:
            missing[name] = absent
        else:
            ready.add(name)

    try:
        configured_timeout = float(os.getenv("AGENT_TOOL_TIMEOUT_SECONDS", "25"))
    except (TypeError, ValueError):
        configured_timeout = 25.0
    timeout_s = min(max(configured_timeout, 1.0), 90.0)
    semaphore = asyncio.Semaphore(max_agents)
    results: List[Dict[str, Any]] = []
    completed: Dict[str, Dict[str, Any]] = {}
    failed_tools: set[str] = set()
    workflow_waves = 0

    async def bounded_call(name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        async with semaphore:
            return await _execute_tool(name, payload, timeout_s)

    while ready:
        runnable = []
        for name in list(ready):
            dependencies = _collect_dependencies(inputs[name])
            absent_dependencies = sorted(dep for dep in dependencies if dep not in selected)
            failed_dependencies = sorted(dep for dep in dependencies if dep in missing or dep in failed_tools)
            if absent_dependencies or failed_dependencies:
                missing[name] = [
                    *(f"dependency_not_selected:{dep}" for dep in absent_dependencies),
                    *(f"dependency_failed_or_incomplete:{dep}" for dep in failed_dependencies),
                ]
                ready.remove(name)
            elif dependencies.issubset(completed.keys()):
                runnable.append(name)

        if not runnable:
            # Remaining nodes contain a cycle or a reference that cannot be
            # resolved from the selected graph. Do not guess a replacement.
            for name in list(ready):
                missing[name] = ["unresolved_dependency_or_cycle"]
                ready.remove(name)
            break

        calls = []
        for name in runnable:
            try:
                resolved = _resolve_payload_references(inputs[name], completed)
                calls.append((name, resolved))
            except ValueError as exc:
                missing[name] = [str(exc)]
                ready.remove(name)

        if not calls:
            continue

        wave_results = await asyncio.gather(*(bounded_call(name, payload) for name, payload in calls))
        workflow_waves += 1
        for item in wave_results:
            results.append(item)
            completed[item["tool"]] = item
            ready.discard(item["tool"])
            if item["status"] != "success":
                failed_tools.add(item["tool"])

    provider = get_provider()
    successful = [item for item in results if item["status"] == "success"]
    synthesis_used = False
    if successful and provider.is_configured():
        synthesis_input = {
            "user_message": message, "language": language,
            "user_context": _redact_context(context),
            "agent_results": results,
        }
        system = (
            "You are AgroGrowth's response synthesizer. Answer only in the requested language. "
            "Use only facts present in agent_results and user_context. Never turn synthetic/demo "
            "outputs into real observations. Explicitly mention model_source and simulated or "
            "unvalidated status where present. If agents disagree or fail, say so. Do not invent "
            "measurements, prices, weather, confidence or citations."
        )
        try:
            answer = await asyncio.to_thread(
                provider.chat,
                [{"role": "system", "content": system},
                 {"role": "user", "content": json.dumps(synthesis_input, ensure_ascii=False)[:18000]}],
                temperature=0.2, max_tokens=1200,
            )
        except LLMError:
            answer = ""
    else:
        answer = ""

    if not answer:
        details = "; ".join(f"{name}: {', '.join(fields)}" for name, fields in missing.items())
        if missing:
            if language.lower().startswith("ar"):
                answer = f"يلزمنا معلومات إضافية قبل تشغيل بعض الخدمات: {details}"
            elif language.lower().startswith("fr"):
                answer = f"Informations supplémentaires requises avant l'exécution : {details}"
            else:
                answer = f"More information is required before these agents can run: {details}"
        elif results:
            if len(successful) == len(results):
                if language.lower().startswith("ar"):
                    answer = "اكتمل تنفيذ الخدمات. راجع النتائج ومصادر بياناتها قبل اتخاذ القرار."
                elif language.lower().startswith("fr"):
                    answer = "Les agents ont terminé. Vérifiez les résultats et leurs sources avant toute décision."
                else:
                    answer = "Agent execution completed. Review the structured results and their provenance before acting."
            elif successful:
                if language.lower().startswith("ar"):
                    answer = "اكتمل جزء من التحليلات، لكن بعض الخدمات فشلت. راجع حالة كل Agent قبل الاعتماد على النتيجة."
                elif language.lower().startswith("fr"):
                    answer = "Une partie des analyses a réussi, mais certains agents ont échoué. Vérifiez chaque statut avant utilisation."
                else:
                    answer = "Some analyses succeeded and others failed. Review each agent status before relying on the results."
            else:
                if language.lower().startswith("ar"):
                    answer = "الخدمات المختارة لم تتمكن من إكمال التحليل. راجع أخطاء الخدمات وإعدادات الاتصال."
                elif language.lower().startswith("fr"):
                    answer = "Les services sélectionnés n'ont pas pu terminer l'analyse. Vérifiez leurs erreurs et leur configuration."
                else:
                    answer = "The selected services could not complete the analysis. Review service errors and connectivity."
        else:
            if language.lower().startswith("ar"):
                answer = "وضّحلي المهمة الزراعية ووفّر المعطيات المنظمة اللازمة لتشغيل الخدمة المختصة."
            elif language.lower().startswith("fr"):
                answer = "Précisez la tâche agricole et fournissez les données structurées nécessaires."
            else:
                answer = "Please clarify the agricultural task and provide its structured inputs."

    return {
        "success": True,
        "orchestration_version": "1.0.0",
        "planner_source": planner_source,
        "planner_model_source": provider.model_source() if planner_source.startswith("llm-planner:") else None,
        "synthesis_model_source": provider.model_source() if synthesis_used else None,
        "selected_agents": [AGENT_TOOLS[name]["agent"] for name in selected],
        "selected_tools": selected,
        "missing_inputs": missing,
        "clarifying_questions": [name + ": " + ", ".join(fields) for name, fields in missing.items()],
        "tool_results": results,
        "response": answer,
        "execution": {"requested": len(selected), "executed": len(results),
                      "succeeded": len(successful), "failed": len(results) - len(successful),
                      "workflow_waves": workflow_waves},
        "disclaimer": "Tool outputs retain each service's own data/model provenance. Orchestration does not validate agronomic accuracy.",
    }
