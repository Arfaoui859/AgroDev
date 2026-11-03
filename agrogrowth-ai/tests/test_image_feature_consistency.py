"""
Static consistency tests for the image-analysis feature extractors.

`PlantDiseaseDetector._predict_diseases` read `features['brown_ratio']`, but
`_extract_image_features` never wrote that key. Every call to /detect-disease
therefore raised KeyError('brown_ratio') and returned HTTP 500 -- the endpoint
was completely broken. These tests scan the source so a read/write mismatch in
any feature dictionary is caught without needing the image stack installed.
"""

import pathlib
import re

import pytest

AI_ROOT = pathlib.Path(__file__).resolve().parents[1]

MODULES = [
    "image_diagnosis/plant_disease_detector.py",
    "image_diagnosis/leaf_scan_ai.py",
    "soil_analysis/soil_image_diagnosis.py",
]

WRITE_RE = re.compile(r"features\[['\"]([a-z_]+)['\"]\]\s*=")
READ_RE = re.compile(r"features\[['\"]([a-z_]+)['\"]\]")


@pytest.mark.parametrize("module", MODULES)
def test_every_read_feature_key_is_written(module: str):
    source = (AI_ROOT / module).read_text(encoding="utf-8")
    written = set(WRITE_RE.findall(source))
    read = set(READ_RE.findall(source))
    missing = sorted(read - written)
    assert not missing, (
        f"{module} reads feature key(s) {missing} that are never assigned; "
        "these raise KeyError at runtime"
    )


@pytest.mark.parametrize("module", MODULES)
def test_feature_extractors_produce_keys(module: str):
    source = (AI_ROOT / module).read_text(encoding="utf-8")
    assert WRITE_RE.findall(source), f"{module} defines no feature keys"
