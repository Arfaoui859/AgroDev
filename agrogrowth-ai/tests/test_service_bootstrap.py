"""
Bootstrap regression tests for the AI microservices.

A copy-paste bug had every service's __main__ block launch
`uvicorn.run("soil_analysis.main:app", ...)`, so starting any service other than
soil-analysis would import the wrong app (or fail). Four services were also
missing `import uvicorn`, and default ports did not match the ports the Node
gateway and docker-compose expect.

These tests parse each service's source (no heavy imports) and assert the launch
target, import and default port are correct and unambiguous.
"""

import ast
import pathlib
import re

import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]

# service directory -> canonical default port the platform expects
EXPECTED_PORTS = {
    "soil_analysis": 8001,
    "crop_recommendation": 8002,
    "image_diagnosis": 8003,
    "market_prediction": 8004,
    "intelligent_agent": 8005,
    "weather_yield_intelligence": 8006,
    "pest_control": 8007,
    "irrigation_optimization": 8008,
}

SERVICES = sorted(
    d.name for d in AI_ROOT.iterdir() if d.is_dir() and (d / "main.py").exists()
)


def _source(service: str) -> str:
    return (AI_ROOT / service / "main.py").read_text(encoding="utf-8")


def test_all_expected_services_present():
    assert set(SERVICES) == set(EXPECTED_PORTS)


@pytest.mark.parametrize("service", SERVICES)
def test_main_is_valid_python(service: str):
    ast.parse(_source(service))


@pytest.mark.parametrize("service", SERVICES)
def test_uvicorn_run_target_matches_own_package(service: str):
    source = _source(service)
    targets = re.findall(r'uvicorn\.run\(\s*"([^"]+)"', source)
    for target in targets:
        # Must never launch a sibling service's app.
        assert (
            target == f"{service}.main:app"
        ), f"{service}/main.py launches {target!r}; expected {service}.main:app"


@pytest.mark.parametrize("service", SERVICES)
def test_uvicorn_is_imported_when_used(service: str):
    source = _source(service)
    uses_uvicorn = "uvicorn.run" in source
    imports_uvicorn = bool(
        re.search(r"^\s*import uvicorn\b", source, re.MULTILINE)
        or re.search(r"^\s*from uvicorn import", source, re.MULTILINE)
    )
    if uses_uvicorn:
        assert (
            imports_uvicorn
        ), f"{service}/main.py calls uvicorn.run without importing it"


@pytest.mark.parametrize("service,port", sorted(EXPECTED_PORTS.items()))
def test_default_port_is_canonical(service: str, port: int):
    source = _source(service)
    match = re.search(r'os\.environ\.get\(\s*"PORT"\s*,\s*(\d+)\s*\)', source)
    if match:
        assert int(match.group(1)) == port, (
            f"{service} defaults to port {match.group(1)}, expected {port}"
        )
    else:
        # Services that hard-code the port must use the canonical one.
        assert f"port={port}" in source or f"port = {port}" in source


def test_default_ports_are_unique():
    assert len(set(EXPECTED_PORTS.values())) == len(EXPECTED_PORTS)
