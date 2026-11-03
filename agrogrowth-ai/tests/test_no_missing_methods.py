"""
Static guard against a whole class of runtime bugs.

`PestControlRecommender` and both weather/yield predictors referenced dozens of
`self._helper(...)` methods that were never defined. Every one of those raises
`AttributeError` on the *first request*, yet imports, health checks and the
existing test suite all passed — so the services looked healthy while their main
endpoints returned HTTP 500.

This test parses each service module and asserts every `self.<name>` access
resolves to a method or attribute defined in the same class, so a missing helper
fails CI instead of production.
"""

import ast
import pathlib

import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]

SERVICE_MODULES = sorted(
    p
    for service in AI_ROOT.iterdir()
    if service.is_dir() and (service / "main.py").exists()
    for p in service.rglob("*.py")
    if "__pycache__" not in p.parts
)


def _self_attr_names(node: ast.AST) -> set[str]:
    """Names accessed as `self.<name>` anywhere inside a function body."""
    names: set[str] = set()
    for sub in ast.walk(node):
        if isinstance(sub, ast.Attribute) and isinstance(sub.value, ast.Name):
            if sub.value.id == "self":
                names.add(sub.attr)
    return names


def _assigned_self_attrs(cls: ast.ClassDef) -> set[str]:
    """Attributes assigned via `self.x = ...` anywhere in the class."""
    assigned: set[str] = set()
    for sub in ast.walk(cls):
        targets = []
        if isinstance(sub, ast.Assign):
            targets = sub.targets
        elif isinstance(sub, ast.AnnAssign):
            targets = [sub.target]
        for target in targets:
            if isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name):
                if target.value.id == "self":
                    assigned.add(target.attr)
    return assigned


def _classes_with_missing_members(tree: ast.Module) -> dict[str, list[str]]:
    """Class name -> referenced-but-undefined self.<name> list."""
    problems: dict[str, list[str]] = {}
    for cls in [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]:
        defined = {
            m.name for m in cls.body if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef))
        }
        defined |= _assigned_self_attrs(cls)
        referenced: set[str] = set()
        for method in cls.body:
            if isinstance(method, (ast.FunctionDef, ast.AsyncFunctionDef)):
                referenced |= _self_attr_names(method)
        missing = sorted(referenced - defined)
        if missing:
            problems[cls.name] = missing
    return problems


@pytest.mark.parametrize("module_path", SERVICE_MODULES, ids=lambda p: p.name)
def test_no_undefined_self_attributes(module_path: pathlib.Path):
    tree = ast.parse(module_path.read_text(encoding="utf-8"), filename=str(module_path))
    problems = _classes_with_missing_members(tree)
    assert not problems, (
        f"{module_path.relative_to(AI_ROOT)} references undefined members: {problems}"
    )
