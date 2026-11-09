# AgroGrowth Plant Disease Classifier — Model Card

## Release identity

- Model ID: `mobilenetv3-plantvillage-v1`
- Architecture: MobileNetV3-Large, transfer learning
- Runtime artifact: `agrogrowth_plant_disease_v1.onnx`
- Training/checkpoint artifact: `agrogrowth_plant_disease_v1.pt`
- Label map: `labels.json`
- Input contract: RGB, 224 × 224, ImageNet mean/std normalization
- Production inference: ONNX Runtime, CPU execution provider
- Output: top-five class probabilities over 38 PlantVillage labels

## Dataset and reported evaluation

The committed evaluation record (`test_metrics.json`) identifies the dataset as
`fatemehENG/plantvillage-full`, with 10,948 test samples and 38 classes.

| Metric | Recorded value |
|---|---:|
| Accuracy | 0.996803 |
| Macro precision | 0.996104 |
| Macro recall | 0.990110 |
| Macro F1 | 0.992617 |
| Validation macro F1 | 0.989921 |
| ONNX prediction agreement with source model | 1.000000 |
| ONNX maximum absolute difference | 3.8743e-06 |

These values are copied from the committed evaluation JSON; they are not a
claim of independent reproduction by this repository audit.

## What is verified in the repository

- ONNX and PyTorch model artifacts are present alongside labels and preprocessing metadata.
- The FastAPI detector loads the ONNX artifact and labels the inference source
  `trained-ml` when prediction succeeds.
- The ONNX adapter validates the 38-class output contract and uses CPU execution.
- The image-diagnosis runtime requirements include `onnxruntime`.
- If the model/runtime cannot be loaded or inference fails, the service has an
  explicit feature-heuristic fallback and must report that fallback honestly.
- The service's leaf nutrition analysis remains heuristic; it is not produced
  by this disease classifier.

## Important limitations and release gates

1. The recorded metrics are dataset test metrics, not Tunisian field accuracy.
   The repository evaluation JSON does not document enough split details to
   independently establish geographic, farm-level, or plant-level separation.
2. PlantVillage labels cover the 38 classes in `labels.json`; an image outside
   those crops/classes may be misclassified as the nearest known class.
3. The model predicts image classes, not laboratory-confirmed pathogen identity,
   infection severity, or treatment response.
4. The post-processing severity score and plant-health score are deterministic
   visual heuristics. They must not be presented as model outputs or field-validated measurements.
5. Crop-specific treatment advice is intentionally withheld when a class has
   no validated treatment entry in the service's disease catalogue.
6. The training notebook/reproducibility manifest and dataset license evidence
   should be versioned with a future model release before making a fully
   reproducible or commercial-use claim.
7. Before production agronomic claims in Tunisia, run a separately curated
   local field evaluation with expert-confirmed labels, per-crop metrics,
   confusion analysis, calibration checks, and documented capture conditions.

## API provenance

- `/health`: reports the classifier actually loaded by the service; the health
  probe initializes the compact ONNX disease classifier.
- `/supported-diseases`: returns the service's curated advice catalogue and,
  separately, the classifier's complete model-label catalogue.
- `POST /detect-disease`: may return `trained-ml`, `vision-model`, or an
  explicitly identified heuristic fallback depending on the components that
  actually ran.
- `POST /analyze-leaf` and leaf-nutrition portions of combined analysis remain
  heuristic.

Do not interpret a probability as a calibrated field confidence without a
separate calibration study. Do not use this classifier alone to prescribe
pesticides or other chemical treatments.
