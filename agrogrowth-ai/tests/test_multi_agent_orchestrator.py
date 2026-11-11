import asyncio
import base64
import pathlib
import sys

import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

import intelligent_agent.orchestrator as orchestrator_module

from intelligent_agent.orchestrator import (
    AGENT_TOOLS,
    _decode_image,
    _execute_tool,
    _keyword_plan,
    _collect_dependencies,
    _resolve_payload_references,
    _redact_context,
    _service_url,
    missing_required_fields,
    orchestrate,
)


def test_registry_covers_all_specialist_domains():
    agents = {spec["agent"] for spec in AGENT_TOOLS.values()}
    assert {"soil_agent", "crop_agent", "vision_agent", "market_agent",
            "weather_agent", "yield_agent", "pest_agent", "irrigation_agent"} <= agents


def test_missing_fields_are_reported_without_fabricating_defaults():
    assert missing_required_fields("soil.analyze", {}) == ["sensor_data"]
    assert missing_required_fields("crop.recommend", {"temperature": 20}) == [
        "annual_rainfall", "soil_ph", "soil_quality_score", "water_availability",
        "target_market_price", "farmer_experience_years", "available_capital",
        "farm_size", "risk_tolerance",
    ]


def test_keyword_router_selects_relevant_tools_without_inventing_payloads():
    assert _keyword_plan("Please analyze my soil", {
        "soil.analyze": {"sensor_data": {"ph": 6.5}},
    }, 5) == ["soil.analyze"]
    assert _keyword_plan("Please analyze my soil", {}, 5) == ["soil.analyze"]


def test_image_decoder_accepts_png_and_rejects_non_image():
    png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
    content, mime, filename = _decode_image(base64.b64encode(png).decode())
    assert content == png
    assert mime == "image/png"
    assert filename.endswith(".png")
    with pytest.raises(ValueError):
        _decode_image(base64.b64encode(b"not an image").decode())


def test_image_decoder_enforces_size_limit():
    with pytest.raises(ValueError):
        _decode_image(base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"x" * (10 * 1024 * 1024)).decode())


def test_orchestrator_rejects_unknown_tool_inputs():
    async def run():
        with pytest.raises(ValueError, match="Unknown tool_inputs"):
            await orchestrate("soil analysis", tool_inputs={"unknown.tool": {}})
    asyncio.run(run())


def test_orchestrator_rejects_invalid_max_agents():
    async def run():
        with pytest.raises(ValueError, match="max_agents"):
            await orchestrate("soil analysis", max_agents=99)
    asyncio.run(run())


def test_explicit_result_references_create_dependency_edges_and_resolve_values():
    payload = {
        "soil_ph": "$results.soil.analyze.result.properties.ph",
        "farm_size": 2.0,
    }
    assert _collect_dependencies(payload) == {"soil.analyze"}
    completed = {
        "soil.analyze": {
            "result": {"properties": {"ph": 6.5}},
            "status": "success",
        }
    }
    assert _resolve_payload_references(payload, completed) == {
        "soil_ph": 6.5,
        "farm_size": 2.0,
    }


def test_result_reference_does_not_guess_missing_upstream_values():
    with pytest.raises(ValueError, match="unavailable"):
        _resolve_payload_references(
            {"soil_ph": "$results.soil.analyze.result.properties.ph"},
            {"soil.analyze": {"result": {"properties": {}}}},
        )


def test_render_private_hostport_is_normalized_to_http(monkeypatch):
    monkeypatch.setenv("SOIL_ANALYSIS_URL", "soil.internal:10001")
    assert _service_url(AGENT_TOOLS["soil.analyze"]) == "http://soil.internal:10001/analyze-soil"


def test_soil_to_crop_workflow_executes_dependencies_in_order(monkeypatch):
    class NoLLMProvider:
        def is_configured(self):
            return False

    monkeypatch.setattr(orchestrator_module, "get_provider", lambda: NoLLMProvider())
    calls = []

    async def fake_execute(tool_name, payload, timeout_s):
        calls.append((tool_name, payload))
        if tool_name == "soil.analyze":
            return {
                "tool": tool_name, "agent": "soil_agent", "status": "success",
                "result": {"properties": {"ph": {"current_value": 6.5}}},
            }
        return {
            "tool": tool_name, "agent": "crop_agent", "status": "success",
            "result": {"best_recommendation": {"name": "olive"}},
        }

    monkeypatch.setattr(orchestrator_module, "_execute_tool", fake_execute)
    crop_inputs = {
        "temperature": 22,
        "annual_rainfall": 450,
        "soil_ph": "$results.soil.analyze.result.properties.ph.current_value",
        "soil_quality_score": 0.7,
        "water_availability": 0.8,
        "target_market_price": 2.5,
        "farmer_experience_years": 5,
        "available_capital": 5000,
        "farm_size": 2,
        "risk_tolerance": 0.5,
    }

    result = asyncio.run(orchestrator_module.orchestrate(
        "Analyze soil and recommend crops",
        language="en",
        tool_inputs={
            "soil.analyze": {"sensor_data": {"ph": 6.5}},
            "crop.recommend": crop_inputs,
        },
    ))

    assert [name for name, _ in calls] == ["soil.analyze", "crop.recommend"]
    assert calls[1][1]["soil_ph"] == 6.5
    assert result["execution"]["workflow_waves"] == 2
    assert result["execution"]["succeeded"] == 2


def test_context_redaction_removes_identifiers_and_nested_secrets():
    safe = _redact_context({
        "region": "Siliana",
        "farm_size": 2,
        "farm_id": "private-farm-id",
        "email": "farmer@example.test",
        "nested": {"ph": 6.5, "api_key": "private-key", "session_token": "private-token"},
    })
    assert safe == {"region": "Siliana", "farm_size": 2, "nested": {"ph": 6.5}}


def test_invalid_service_url_isolated_as_agent_error(monkeypatch):
    monkeypatch.setenv("SOIL_ANALYSIS_URL", "http://")
    result = asyncio.run(_execute_tool(
        "soil.analyze", {"sensor_data": {"ph": 6.5}}, 5
    ))
    assert result["status"] == "error"
    assert result["tool"] == "soil.analyze"
