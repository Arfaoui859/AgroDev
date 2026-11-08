import json
import os
from pathlib import Path

import numpy as np
import onnxruntime as ort


class PlantDiseaseONNXClassifier:
    """CPU inference for the trained MobileNetV3-Large model."""

    MODEL_SOURCE = "mobilenetv3-plantvillage-v1"

    def __init__(self, model_path=None):
        base_dir = Path(__file__).resolve().parent
        default_path = (
            base_dir
            / "models"
            / "plant_disease_v1"
            / "agrogrowth_plant_disease_v1.onnx"
        )

        self.model_path = Path(
            model_path
            or os.getenv("PLANT_DISEASE_ONNX_PATH")
            or default_path
        )

        labels_path = self.model_path.parent / "labels.json"
        preprocessing_path = self.model_path.parent / "preprocessing.json"

        if not self.model_path.is_file():
            raise FileNotFoundError(
                f"ONNX model not found: {self.model_path}"
            )

        with labels_path.open(encoding="utf-8") as f:
            metadata = json.load(f)

        with preprocessing_path.open(encoding="utf-8") as f:
            preprocessing = json.load(f)

        self.idx_to_class = {
            int(index): label
            for index, label in metadata["idx_to_class"].items()
        }

        normalization = preprocessing["normalization"]
        self.mean = np.asarray(
            normalization["mean"], dtype=np.float32
        ).reshape(1, 1, 3)

        self.std = np.asarray(
            normalization["std"], dtype=np.float32
        ).reshape(1, 1, 3)

        if len(self.idx_to_class) != 38:
            raise ValueError(
                f"Expected 38 classes, got {len(self.idx_to_class)}"
            )

        if np.any(self.std <= 0):
            raise ValueError("Invalid normalization standard deviation")

        options = ort.SessionOptions()
        options.intra_op_num_threads = 1
        options.inter_op_num_threads = 1
        options.graph_optimization_level = (
            ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        )

        self.session = ort.InferenceSession(
            str(self.model_path),
            sess_options=options,
            providers=["CPUExecutionProvider"],
        )

        inputs = self.session.get_inputs()
        outputs = self.session.get_outputs()

        if len(inputs) != 1 or len(outputs) != 1:
            raise ValueError("Unexpected ONNX input/output structure")

        self.input_name = inputs[0].name
        self.output_name = outputs[0].name

        if (
            len(outputs[0].shape) != 2
            or outputs[0].shape[-1] != 38
        ):
            raise ValueError(
                f"Expected output [batch, 38], got {outputs[0].shape}"
            )

    def predict(self, image_rgb):
        """Predict from a 224x224 RGB image."""

        original = np.asarray(image_rgb)

        if original.shape != (224, 224, 3):
            raise ValueError(
                f"Expected RGB shape (224,224,3), got {original.shape}"
            )

        image = original.astype(np.float32)

        if np.issubdtype(original.dtype, np.integer):
            image /= 255.0
        elif image.max() > 1.0:
            image /= 255.0

        if not np.isfinite(image).all():
            raise ValueError("Image contains non-finite values")

        if image.min() < 0.0 or image.max() > 1.0:
            raise ValueError("Image values must be in [0,1]")

        # ImageNet normalization, RGB HWC -> NCHW.
        image = (image - self.mean) / self.std
        tensor = np.transpose(image, (2, 0, 1))[None, ...]
        tensor = tensor.astype(np.float32)

        logits = self.session.run(
            [self.output_name],
            {self.input_name: tensor},
        )[0]

        logits = np.asarray(logits, dtype=np.float32).reshape(-1)

        if logits.shape[0] != 38:
            raise ValueError("Model output does not contain 38 classes")

        shifted = logits - np.max(logits)
        probabilities = np.exp(shifted)
        probabilities /= probabilities.sum()

        ranked = np.argsort(probabilities)[::-1][:5]

        return [
            {
                "class_name": self.idx_to_class[int(index)],
                "probability": float(probabilities[index]),
            }
            for index in ranked
        ]
