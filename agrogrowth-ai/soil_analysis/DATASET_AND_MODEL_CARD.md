# AgroGrowth Soil ML — Dataset & Model Card

**Status:** trained research models; laboratory-assisted inference only  
**Training artifact timestamp:** 2026-11-07T17:27:29Z  
**Dataset:** iSDA Open Soil Analysis Dataset / AfSIS wet-chemistry subset  
**Training depth:** 0–20 cm  
**Synthetic data:** not used

## 1. Data provenance

The repository's raw source files are:

- `data/raw/iSDA_soil_data.csv`
- `data/raw/iSDA_soil_metadata.csv`

The source is iSDA's open soil analysis dataset for Africa. iSDA describes this resource as a compilation of soil analyses collected between 2008 and 2020, across more than 15 African countries. The published release describes over 50,000 samples at two depth intervals (0–20 cm and 20–50 cm); approximately 10% were analysed by wet chemistry and the remainder by mid-infrared spectroscopy.

Official source and license references:

- Dataset page: https://www.isda-africa.com/isdasoil/open-soil-data/
- Source repository: https://github.com/iSDA-Africa/open-soil-data
- Dataset DOI: https://doi.org/10.17605/OSF.IO/A69R5
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- Release description: https://www.isda-africa.com/posts/2023-03-16-soil-data-release/

Attribution is required when redistributing or using this dataset. Preserve the DOI, source link, and CC BY 4.0 attribution with derived datasets and model documentation.

## 2. Exact training subset used by the committed artifacts

The production manifest points to `data/processed/wetchem_reference.csv`, not to the full raw CSV.

| Item | Recorded value |
|---|---:|
| Original wet-chemistry rows | 2,157 |
| Rows after selecting 0–20 cm | 2,134 |
| Validation folds | 5 |
| Spatial grouping | 0.25-degree latitude/longitude grid |
| Unique spatial groups (per target) | 86–101 |
| Dataset SHA-256 | `20d0ffdacb2754858728447659f790811ef8a60bcce163aa5292fc650e2dc403` |
| Model library | scikit-learn 1.9.1 |
| Artifact library | joblib 1.6.0 |

The model training pipeline uses only measured wet-chemistry analytes as predictors. For each target, the target column is excluded from its own feature list. Coordinates and metadata are not predictors. Missing predictor values are median-imputed inside a scikit-learn pipeline.

The source's raw metadata contains legacy unit labels for some analytes. The repository's validation pipeline applies explicit overrides for organic carbon and total nitrogen to g/kg, consistent with iSDA's published FAQ. The effective target units used for interpretation are listed below.

## 3. Spatial coverage and applicability

The spatial audit for the exact wet-chemistry training subset reports:

- Longitude: -13.42769 to 48.7414
- Latitude: -29.00123 to 14.8592

**This training subset does not include Tunisia** (Tunisia is north of the recorded maximum latitude). The models therefore have no Tunisia-specific training or validation evidence. Do not present their outputs as Tunisia-calibrated soil results or as replacements for a laboratory analysis.

The training data are African, but that does not make the fitted models geographically universal. Their measured analyte relationships may vary with parent material, soil formation, climate, sampling protocols, and laboratory practice.

## 4. Models and out-of-fold evaluation

The committed artifacts contain seven regression models. Metrics below are the recorded five-fold spatial GroupKFold out-of-fold metrics, not a separate external test-set result.

| Target | Estimator | OOF samples | R² | MAE | RMSE | Target unit |
|---|---|---:|---:|---:|---:|---|
| pH | Random Forest | 2,133 | 0.527 | 0.238 | 0.302 | unitless |
| Organic carbon | Random Forest | 2,134 | 0.865 | 1.594 | 4.019 | g/kg |
| Total nitrogen | Extra Trees | 2,110 | 0.832 | 0.106 | 0.152 | g/kg |
| Electrical conductivity | Random Forest | 2,109 | 0.469 | 0.134 | 0.172 | dS/m |
| Extractable phosphorus | Extra Trees | 2,110 | 0.337 | 2.339 | 3.771 | mg/kg |
| Extractable potassium | Extra Trees | 2,134 | 0.627 | 25.425 | 37.044 | mg/kg |
| Extractable zinc | HistGradientBoosting | 2,110 | 0.448 | 0.222 | 0.286 | mg/kg |

Interpretation:

- R² is a regression fit statistic, not a confidence score or probability.
- MAE and RMSE are expressed in each target's unit.
- Organic carbon and total nitrogen results are stronger in this internal spatial CV; phosphorus, zinc, and EC are materially weaker.
- The 0.25-degree GroupKFold uses spatial groups but the manifest records `spatial_buffer: false`. Nearby groups can therefore remain geographically close across folds.
- These are cross-validation estimates on the same source collection, not field-trial results or independent validation against Tunisian laboratory samples.

## 5. Runtime contract

The FastAPI service exposes two different analysis paths:

1. `POST /analyze-soil` — farmer/sensor screening. This path uses the transparent deterministic rules engine. It does **not** call the laboratory-assisted ML models.
2. `POST /predict-lab-soil` — laboratory-assisted statistical estimation. It uses the seven trained artifacts and requires at least 80% of each model's configured predictor features. Missing values may be median-imputed and are reported as imputed.

The lab predictor's current request schema accepts a generic `lab_values` dictionary. Before exposing this endpoint as a farmer-facing recommendation feature, the API contract must be strengthened to require and validate:
- units for every supplied analyte;
- the laboratory extraction / measurement method (for example, Mehlich-3, saturation extract, or 1:1 soil-water suspension);
- sample depth and sampling date;
- source laboratory / method metadata where available.

Values from incompatible methods or units must be rejected or explicitly normalized; they must not silently enter the model.

The API response must continue to label predictions as estimates, preserve the model and dataset provenance, disclose imputed features, and state that field/Tunisia validation is absent.

## 6. Image analysis status

The soil image module is currently deterministic image-statistics processing. Its source code sets `is_trained = false` and `model_source = deterministic-visual-analysis`. It is not a trained soil-image classifier and must not be marketed as one.

## 7. Reproducibility

Training entry point:

```bash
cd agrogrowth-ai
python soil_analysis/training/train_production_models.py
```

The committed training implementation uses a fixed random seed, five-fold spatial GroupKFold, and saves the final estimators plus `manifest.json` and `training_report.json` under `soil_analysis/models/production/`.

Before replacing production artifacts, rerun the data validation, target-quality, feature-availability, spatial-split, and benchmark audits. Preserve the dataset SHA-256 and compare the resulting metrics with this card.

## 8. Release decision

**Permitted now:** internal research, lab-assisted exploratory estimation with explicit limitations, and engineering integration tests.

**Not yet supported:** autonomous field diagnosis from pH/moisture/sand/silt/clay alone, Tunisia-specific agronomic decisions, fertilizer prescriptions, or claims of validated field accuracy.

The next scientific milestone is an independently sourced and documented Tunisian soil laboratory dataset, with compatible analytical methods, followed by geographically held-out validation and calibration. Until then, the production farmer-facing `/analyze-soil` path remains the deterministic screening engine and must label it honestly.
