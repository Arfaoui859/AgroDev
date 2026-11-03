"""
The Node gateway exposes GET /api/ai/images/supported-diseases, which proxies
GET /supported-diseases on the image-diagnosis service. That endpoint did not
exist, so the UI always received a 404 for the disease catalogue.

The test calls the real endpoint coroutine and checks the catalogue shape.
"""

import asyncio
import importlib

image_module = importlib.import_module("image_diagnosis.main")


def test_supported_diseases_returns_catalogue():
    body = asyncio.run(image_module.supported_diseases())
    assert body["status"] == "success"
    assert body["total_count"] == len(body["supported_diseases"])
    assert body["total_count"] > 0
    ids = {d["id"] for d in body["supported_diseases"]}
    # 'healthy' is the baseline entry every detector ships with.
    assert "healthy" in ids
    sample = next(d for d in body["supported_diseases"] if d["id"] == "healthy")
    assert sample["name_ar"]
    assert isinstance(sample["treatment"], list)
    assert isinstance(sample["prevention"], list)
