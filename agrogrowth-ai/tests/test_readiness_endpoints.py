"""Every AI microservice must expose lightweight operational probes.

`/health` is a deep check: several services report model provenance there and
some touch model metadata, so a load balancer or the Node gateway cannot use it
as a cheap liveness/readiness signal. Each service therefore also exposes
`GET /ready` (is this process able to accept traffic?) and `GET /metrics` (real
process counters), neither of which loads a model artifact.

These tests import the real ASGI apps and drive the probes through the test
client, so a service that forgets to register a route fails here.
"""

import importlib
import pathlib
import sys

import pytest
from fastapi.testclient import TestClient

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

SERVICES = sorted(
    p.name for p in AI_ROOT.iterdir() if p.is_dir() and (p / "main.py").is_file()
)


@pytest.mark.parametrize("service", SERVICES)
def test_ready_endpoint_is_registered_and_cheap(service: str):
    module = importlib.import_module(f"{service}.main")
    client = TestClient(module.app)
    response = client.get("/ready")
    assert response.status_code == 200, f"{service} has no working /ready endpoint"
    body = response.json()
    assert body.get("ready") is True
    assert isinstance(body.get("service"), str) and body["service"]
    # Readiness must not be a deep check: it must not claim model provenance
    # (that stays the job of /health) and must never trigger model loading.
    assert "model_source" not in body


@pytest.mark.parametrize("service", SERVICES)
def test_metrics_endpoint_reports_real_process_counters(service: str):
    module = importlib.import_module(f"{service}.main")
    client = TestClient(module.app)
    # A couple of requests so the request counter is non-zero and observable.
    client.get("/ready")
    response = client.get("/metrics")
    assert response.status_code == 200, f"{service} has no working /metrics endpoint"
    body = response.json()
    assert body["service"]
    assert isinstance(body["pid"], int) and body["pid"] > 0
    assert body["uptime_seconds"] >= 0
    assert body["requests_total"] >= 1
