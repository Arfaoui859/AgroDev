"""
The weather/yield service must not train generated data during startup and must
not block the event loop with synthetic inference. Those production endpoints
now fail closed until validated real models exist.
"""

import ast
import pathlib

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
SERVICE = AI_ROOT / "weather_yield_intelligence" / "main.py"
PLANNER = AI_ROOT / "weather_yield_intelligence" / "smart_weather_crop_planner.py"
YIELD = AI_ROOT / "weather_yield_intelligence" / "yield_predictor_ai.py"


def _tree(path: pathlib.Path) -> ast.Module:
    return ast.parse(path.read_text(encoding="utf-8"))


def _func(path: pathlib.Path, name: str) -> ast.AST:
    for node in ast.walk(_tree(path)):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name:
            return node
    raise AssertionError(f"{name} not found in {path}")


def test_synthetic_weather_and_yield_training_is_removed_from_runtime():
    for path in [PLANNER, YIELD]:
        tree = _tree(path)
        methods = [
            node
            for node in ast.walk(tree)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        ]
        assert not any(
            node.name in {"_initialize_models", "_create_training_data"}
            for node in methods
        )
        constructors = [node for node in methods if node.name == "__init__"]
        assert constructors
        calls = [
            node.func.id
            for constructor in constructors
            for node in ast.walk(constructor)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
        ]
        assert "_initialize_models" not in calls


def test_unvalidated_field_image_endpoint_fails_closed_before_model_call():
    node = _func(SERVICE, "analyze_field_image")
    assert isinstance(node, ast.AsyncFunctionDef)
    source = ast.get_source_segment(SERVICE.read_text(encoding="utf-8"), node) or ""
    assert "status_code=503" in source
    assert "FIELD_IMAGE_MODEL_NOT_VALIDATED" in source
    assert ".analyze_field_image(" not in source


def test_readiness_helper_does_not_take_the_training_lock():
    node = _func(SERVICE, "_model_status")
    body = [
        n for n in node.body
        if not (isinstance(n, ast.Expr) and isinstance(n.value, ast.Constant))
    ]
    code = "\n".join(
        ast.get_source_segment(SERVICE.read_text(encoding="utf-8"), n) or ""
        for n in body
    )
    assert "_service_lock" not in code
