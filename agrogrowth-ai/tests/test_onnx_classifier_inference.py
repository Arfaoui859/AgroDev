"""End-to-end inference test for the trained PlantVillage ONNX classifier.

This exercises the *real* MobileNetV3-Large artifact (38 classes) rather than a
stub. It is skipped when `onnxruntime` is not installed, so the heuristic-only
test environment can still run — but when the runtime is present the model must
actually load, report 38 classes, and produce a normalised top-5 distribution.
"""
import numpy as np
import pytest

ort = pytest.importorskip("onnxruntime")

from image_diagnosis.onnx_classifier import PlantDiseaseONNXClassifier


@pytest.fixture(scope="module")
def classifier():
    return PlantDiseaseONNXClassifier()


def test_model_loads_with_the_full_label_catalogue(classifier):
    assert len(classifier.idx_to_class) == 38
    assert classifier.MODEL_SOURCE == "mobilenetv3-plantvillage-v1"


def test_prediction_returns_a_normalised_top5(classifier):
    # A deterministic synthetic leaf-like image; the exact class is irrelevant,
    # the contract is: 5 ranked labels with probabilities summing to <= 1.
    image = np.zeros((224, 224, 3), dtype=np.uint8)
    image[:, :, 1] = 120
    image[40:180, 40:180, 0] = 60

    predictions = classifier.predict(image)

    assert len(predictions) == 5
    probabilities = [p["probability"] for p in predictions]
    assert all(0.0 <= p <= 1.0 for p in probabilities)
    assert probabilities == sorted(probabilities, reverse=True)
    assert sum(probabilities) <= 1.0 + 1e-6
    for entry in predictions:
        assert entry["class_name"] in classifier.idx_to_class.values()


def test_rejects_wrongly_shaped_input(classifier):
    with pytest.raises(ValueError):
        classifier.predict(np.zeros((100, 100, 3), dtype=np.uint8))
