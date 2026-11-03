"""
Every AI microservice must declare its model provenance in /health.

The Node gateway probes each service's /health and reads a `model_source` field to
decide whether the output is real model inference or synthetic/heuristic output
(see server/services/providers/serviceProbe.ts). When a service omits the field,
the probe can only conclude "reachable, provenance unknown" and the UI ends up
presenting in-process synthetic predictions as if they were real inference.

All eight services train on synthetic data or use built-in agronomic rules, so
each must declare a provenance string that the probe recognises as non-real
(matching /heuristic|demo|simulat|synthetic|mock|random|placeholder|dummy/).
"""

import ast
import pathlib
import re

import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]

SERVICES = sorted(
    p.name for p in AI_ROOT.iterdir() if p.is_dir() and (p / "main.py").is_file()
)

# Must stay in sync with HEURISTIC_MARKERS in serviceProbe.ts.
HEURISTIC_MARKERS = re.compile(
    r"heuristic|demo|simulat|synthetic|mock|random|placeholder|dummy", re.I
)


def _health_function(service: str) -> ast.AST | None:
    tree = ast.parse((AI_ROOT / service / "main.py").read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in {
            "health_check",
            "health",
            "healthcheck",
        }:
            return node
    return None


@pytest.mark.parametrize("service", SERVICES)
def test_health_declares_model_source(service: str):
    func = _health_function(service)
    assert func is not None, f"{service}/main.py has no health check function"
    constants = [
        n.value
        for n in ast.walk(func)
        if isinstance(n, ast.Constant) and isinstance(n.value, str)
    ]
    keys = [c for c in constants if c == "model_source"]
    assert keys, (
        f"{service}/main.py /health must declare a 'model_source' so the gateway "
        "probe can label synthetic output honestly"
    )


@pytest.mark.parametrize("service", SERVICES)
def test_model_source_is_marked_non_real(service: str):
    """The declared provenance must be one the probe classifies as non-real."""
    func = _health_function(service)
    assert func is not None
    pairs = []
    for node in ast.walk(func):
        if isinstance(node, ast.Dict):
            for k, v in zip(node.keys, node.values):
                if (
                    isinstance(k, ast.Constant)
                    and k.value == "model_source"
                    and isinstance(v, ast.Constant)
                    and isinstance(v.value, str)
                ):
                    pairs.append(v.value)
    assert pairs, f"{service}/main.py does not set a literal model_source value"
    for value in pairs:
        assert HEURISTIC_MARKERS.search(value), (
            f"{service}/main.py declares model_source={value!r}, which the probe "
            "would treat as a real trained model. These services use synthetic or "
            "rule-based logic, so the value must contain a marker such as 'synthetic'."
        )


@pytest.mark.parametrize("service", SERVICES)
def test_service_health_is_not_shadowed_by_base_route(service: str):
    """A service that uses BaseAIService must not let it shadow its own /health.

    BaseAIService registers a minimal /health in __init__. FastAPI resolves the
    first matching route, so a service that exposes `app = service.app` and then
    defines its own @app.get("/health") silently loses the richer payload
    (model_source, model status, capabilities) unless it passes
    include_health_route=False.
    """
    source = (AI_ROOT / service / "main.py").read_text(encoding="utf-8")
    uses_base_app = "service.app" in source
    defines_own_health = '@app.get("/health")' in source
    if not (uses_base_app and defines_own_health):
        return
    assert "include_health_route=False" in source, (
        f"{service}/main.py exposes BaseAIService's app and defines its own "
        "/health, so the base /health route shadows it. Pass "
        "include_health_route=False to BaseAIService."
    )
