"""
Regression tests for the weather/yield service event-loop blocking bug.

Both scikit-learn models in this service train synchronously on first use
(~45s and ~60s). Originally every handler was `async def` and called the model
builders directly, which blocked the event loop: while a request trained the
models, a concurrent `/health` (or any other request) could not be served and
the platform's probe timed out — the service looked down while it was merely
busy. `/health` also acquired the training lock, hanging until training ended.

These tests parse the source (no model training, no heavy imports) and assert
the fix holds:
  1. Blocking, fully-synchronous handlers are plain `def` so FastAPI runs them
     in the threadpool.
  2. The one handler that must stay `async` (it awaits the upload read) offloads
     its blocking model call.
  3. The readiness helper does not take the training lock.
"""

import ast
import pathlib

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
SERVICE = AI_ROOT / "weather_yield_intelligence" / "main.py"

# Handlers that call a model builder and do only synchronous work.
SYNC_HANDLERS = {
    "create_weather_based_plan",
    "predict_crop_yield",
    "comprehensive_analysis",
    "get_climate_zones",
    "get_crop_yield_database",
    "assess_crop_climate_suitability",
    "optimize_planting_schedule",
}


def _tree() -> ast.Module:
    return ast.parse(SERVICE.read_text(encoding="utf-8"))


def _func(name: str) -> ast.AST:
    for node in ast.walk(_tree()):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name:
            return node
    raise AssertionError(f"{name} not found in {SERVICE}")


def test_blocking_handlers_are_sync_defs():
    for name in SYNC_HANDLERS:
        node = _func(name)
        assert isinstance(
            node, ast.FunctionDef
        ), f"{name} must be a plain def so FastAPI runs it in the threadpool"
        assert not isinstance(node, ast.AsyncFunctionDef)


def test_upload_handler_offloads_blocking_analysis():
    node = _func("analyze_field_image")
    assert isinstance(node, ast.AsyncFunctionDef), "upload handler must await the file read"
    source = ast.get_source_segment(SERVICE.read_text(encoding="utf-8"), node) or ""
    assert "offload(" in source, "blocking image analysis must be offloaded to the threadpool"
    assert "await offload(" in source


def test_readiness_helper_does_not_take_the_training_lock():
    node = _func("_model_status")
    # Drop the docstring (it mentions the lock by name); inspect code only.
    body = [n for n in node.body if not (isinstance(n, ast.Expr) and isinstance(n.value, ast.Constant))]
    code = "\n".join(
        ast.get_source_segment(SERVICE.read_text(encoding="utf-8"), n) or "" for n in body
    )
    assert "_service_lock" not in code, (
        "_model_status must be lock-free: the model builders hold _service_lock "
        "for the whole (slow) training, so /health would hang"
    )
