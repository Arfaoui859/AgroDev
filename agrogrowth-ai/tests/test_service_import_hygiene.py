"""
Static import/startup hygiene checks for the AI microservices.

These guard the classes of bug that made services fail to start at all:

* `pest_control` and `irrigation_optimization` used relative imports
  (`from .module import x`) in their `main.py`. Running the file directly -- which
  is exactly how every service is launched -- raises
  "attempted relative import with no known parent package". All other services
  use absolute package imports, so these are inconsistent and broken.
* `weather_yield_intelligence`, `pest_control` and `irrigation_optimization`
  referenced `os.environ` without importing `os`, raising NameError at startup.
* `weather_yield_intelligence` built both sklearn models at import time. Training
  them takes ~100s, blocking the event loop so the platform health check timed out
  and the service was reported down.
"""

import ast
import pathlib

import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]

SERVICES = sorted(
    p.name for p in AI_ROOT.iterdir() if p.is_dir() and (p / "main.py").is_file()
)


def _main_source(service: str) -> str:
    return (AI_ROOT / service / "main.py").read_text(encoding="utf-8")


@pytest.mark.parametrize("service", SERVICES)
def test_no_relative_imports_in_main(service: str):
    tree = ast.parse(_main_source(service))
    relative = [
        node.module
        for node in ast.walk(tree)
        if isinstance(node, ast.ImportFrom) and (node.level or 0) > 0
    ]
    assert not relative, (
        f"{service}/main.py uses relative imports {relative}; running the file "
        "directly (as all services are launched) fails with "
        "'attempted relative import with no known parent package'"
    )


@pytest.mark.parametrize("service", SERVICES)
def test_os_is_imported_when_used(service: str):
    source = _main_source(service)
    if "os.environ" not in source and "os.getenv" not in source:
        return
    tree = ast.parse(source)
    imports_os = any(
        (isinstance(n, ast.Import) and any(a.name == "os" for a in n.names))
        or (isinstance(n, ast.ImportFrom) and n.module == "os")
        for n in ast.walk(tree)
    )
    assert imports_os, f"{service}/main.py uses os.* without importing os"


# Services allowed to build their models at import time. Their factories train on
# small synthetic sets and finish in ~4-8s, which stays well inside the platform's
# health-probe timeout.
IMPORT_TIME_FACTORY_ALLOWLIST = {
    "crop_recommendation",
    "irrigation_optimization",
    "pest_control",
    "soil_analysis",
}


@pytest.mark.parametrize("service", SERVICES)
def test_heavy_model_construction_is_lazy(service: str):
    """Flag import-time model factories outside the documented allowlist.

    A factory that trains for ~100s at import time blocks the event loop so
    /health times out and the service looks down on first deploy (this is exactly
    what happened to weather_yield_intelligence). New import-time factories must
    be added to the allowlist deliberately, with a note on their boot cost.
    """
    tree = ast.parse(_main_source(service))
    offenders = []
    for node in tree.body:  # module level only
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call):
            func = node.value.func
            name = getattr(func, "id", None) or getattr(func, "attr", None)
            if name and name.startswith("create_"):
                offenders.append(name)
    if service in IMPORT_TIME_FACTORY_ALLOWLIST:
        return
    assert not offenders, (
        f"{service}/main.py calls {offenders} at import time. If this is a fast "
        f"(<10s) factory, add {service!r} to IMPORT_TIME_FACTORY_ALLOWLIST; "
        "otherwise build the models lazily so /health responds immediately."
    )
