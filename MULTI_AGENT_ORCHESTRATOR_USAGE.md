# AgroGrowth Multi-Agent Orchestrator — Usage

## Endpoint

The public application route is POST /api/ai/assistant/orchestrate.
The Node API gateway forwards to POST /orchestrate on Intelligent Agent port 8005.
The request is protected by the existing /api AI rate limits.

The LLM selects tools. The application does not let the LLM create measurement values:
all service request bodies must be supplied by the caller under tool_inputs.

## JSON request shape

    {
      "message": "Analyze my soil and tell me what to plant",
      "language": "ar-tn",
      "user_context": {
        "farm_id": "caller-owned-farm-id",
        "region": "Siliana"
      },
      "tool_inputs": {
        "soil.analyze": {
          "sensor_data": {
            "ph": 6.5,
            "moisture": 45,
            "organic_matter": 3.2
          },
          "language": "ar-tn"
        },
        "crop.recommend": {
          "temperature": 22,
          "annual_rainfall": 450,
          "soil_ph": "$results.soil.analyze.result.properties.ph.current_value",
          "soil_quality_score": 0.7,
          "water_availability": 0.8,
          "target_market_price": 2.5,
          "farmer_experience_years": 5,
          "available_capital": 5000,
          "farm_size": 2,
          "risk_tolerance": 0.5
        }
      },
      "max_agents": 5
    }

The example runs soil screening first, then resolves the explicit soil_ph binding
from the soil agent response before running crop recommendation, but only when
pH is present in the submitted sensor_data. Texture-only submissions do not
create a pH reference. The remaining crop inputs in this example are
illustrative caller-supplied values, not measurements created by the
orchestrator. The orchestrator never fills missing fields with guessed values.

## Canonical farm input contract (v1)

The shared TypeScript contract lives in `shared/agricultural-data-contract.ts`.
It is a provenance-aware input envelope, not a database migration and not a claim
that authenticated farm persistence is already implemented.

Each measurement carries:
- numeric value and explicit unit (no implicit unit conversion);
- source: farmer entry, laboratory, sensor, weather provider, market provider,
  expert verification or AI-derived;
- verification state: unverified, verified or derived;
- observation timestamp, with optional evidence reference and method.

Safety rules:
- Farmer-entered values are always unverified.
- AI-derived values are always marked derived, never verified.
- Verified laboratory/sensor/provider values require an evidence reference.
- pH, moisture, texture, temperature, rainfall, market and farm-economics inputs
  have explicit allowed ranges and units.
- Sand/silt/clay are checked to total 100% (±1%) when all three are supplied.
- The contract rejects unknown keys and does not silently convert units.

The AI assistant form now sends explicitly entered values through this canonical `farm_input` envelope (including the explicit soil-quality score required by the current crop service), rather than building a legacy `tool_inputs` object in the browser. Empty fields are omitted; no demo profile location or default farm measurements are sent. Values entered in this form are tagged `farmer_entered` and `unverified`.

`validateFarmInputContract()` performs structural and semantic validation.
`toLegacyAgentInputs()` unwraps only explicitly supplied numeric values into
the current `soil.analyze` and `crop.recommend` payload shapes, while returning
`measurement_provenance` and `farm_context` separately. It does not invent
missing crop-agent fields.

Current integration boundary: the chatbot's existing request path still sends
legacy `tool_inputs`; the new contract and adapter are not yet wired into the
authenticated API request or a persisted farm/field record. That integration
must follow inspection of the actual authentication, database schema and RLS
policies. Do not treat a client-provided `farm_id` as authorization.

## Deterministic workflow templates

The orchestrator currently includes one automatic, typed handoff template:
**Soil analysis -> Crop recommendation**.

When a crop recommendation is requested and the caller supplies
`tool_inputs["soil.analyze"].sensor_data`, the orchestrator adds the soil
agent if needed. It binds
`result.properties.ph.current_value` to `crop.recommend.soil_ph` only when
the submitted sensor data actually contains `ph`. Texture-only inputs run
soil screening but do not create an invalid pH dependency. The response
exposes any real mapping in `workflow_edges`. The dependency is executed in
a later workflow wave, only after soil succeeds.

This template deliberately does **not** infer temperature, rainfall, soil
quality score, water availability, market price, experience, capital, farm
size or risk tolerance. Those remain required caller-supplied crop inputs and
appear in `missing_inputs` when absent. If soil measurements are absent, no
automatic soil call or dependency is created. The template also respects
`max_agents`; it never exceeds the caller's execution limit.

Other workflows (weather -> irrigation/yield, crop -> irrigation/yield,
vision -> pest and market-assisted crop decisions) remain explicit-input
workflows until their service response schemas and field semantics are
verified and covered by contract tests. No unsafe cross-service field mapping
is inferred.

## Registered tools and required inputs

| Tool | Required fields |
|---|---|
| soil.analyze | sensor_data |
| soil.lab_predict | lab_values (complete supported analyte panel) |
| crop.recommend | temperature, annual_rainfall, soil_ph, soil_quality_score, water_availability, target_market_price, farmer_experience_years, available_capital, farm_size, risk_tolerance |
| image.detect_disease | image file attached as multipart; optional plant_type |
| market.forecast_price | crop_type, current_price |
| market.supply_demand | crop_type, current_production |
| weather.create_plan | location, historical_weather, current_conditions |
| weather.predict_yield | crop_type, location, weather_data, soil_data, management_practices, farm_size |
| pest.analyze | crop_type, symptoms, affected_area_percentage, affected_plant_count, total_plant_count, plant_age_days, plant_health_score, weather_conditions, farm_size, plant_density, irrigation_frequency |
| irrigation.optimize | crop_type, growth_stage, weather_data, soil_data, farm_size |

## Image requests

Send multipart/form-data to the same endpoint with:
- file: PNG, JPEG or WebP image, maximum 10 MB.
- message: user question.
- language: ar, ar-tn, fr or en.
- tool_inputs: JSON string, for example {"image.detect_disease":{"plant_type":"tomato"}}.

The Node gateway validates the uploaded image and converts it to base64 only for the private Python service call. The browser never receives private service URLs or provider credentials. The AIAssistantChatbot and SmartAdvisor chat screens call the central orchestrator endpoint. AIAssistantChatbot now offers optional, empty-by-default structured inputs for soil pH, moisture, organic matter, sand/silt/clay texture, climate, water, market price and farm economics. Values are sent only when entered by the user; the soil service validates soil measurements and the crop service validates its required recommendation fields. The form does not yet persist inputs to authenticated farm records; trusted account-data integration remains a separate step. General conversation can be synthesized by the configured LLM; specialist calls return exact missing inputs rather than treating demo profile defaults or incomplete dashboard summaries as measurements.

## Response

The response contains:
- planner_source: configured LLM planner or explicitly labelled keyword fallback.
- selected_agents and selected_tools.
- missing_inputs for tools that need more structured information.
- tool_results with status, duration, HTTP status and model/data provenance.
- response: synthesized answer when an LLM is configured, otherwise a transparent structured fallback.
- execution counts and an agronomic-validation disclaimer.

## Deployment configuration

The Render Blueprint now binds these URLs to private service host:port values for the Intelligent Agent. Docker Compose also injects the equivalent service DNS URLs. Verify those bindings after deployment:
- SOIL_ANALYSIS_URL
- CROP_RECOMMENDATION_URL
- IMAGE_DIAGNOSIS_URL
- MARKET_FORECAST_URL (or MARKET_PREDICTION_URL)
- WEATHER_YIELD_INTELLIGENCE_URL (or SMART_MARKETPLACE_URL)
- PEST_CONTROL_URL
- IRRIGATION_OPTIMIZATION_URL

Also configure AI_PROVIDER and the corresponding provider credential, AI_MODEL / AI_TEXT_MODEL,
AI_TIMEOUT_MS and AI_MAX_RETRIES. The orchestrator needs a provider that reliably supports
JSON response mode. Check the Intelligent Agent /health response and then execute a real
end-to-end request; a configured key alone is not proof that inference works.

## Current boundaries

- Maximum five tools execute concurrently within each dependency wave; each call has a bounded timeout.
- The planner chooses registered tools but does not synthesize tool arguments or invent measurements.
- Explicit caller-supplied `$results.<tool>.<path>` references create dependency edges. Independent tools run concurrently; dependent tools run in later waves after upstream success.
- If an upstream tool fails, returns an incomplete result, or a reference cannot be resolved, dependent tools are blocked and the missing dependency is reported. No fallback value is guessed.
- Market, crop, yield, pest and irrigation numeric outputs retain their existing synthetic/demo
  provenance. Orchestration does not improve their underlying model validity.
- PlantVillage image metrics are not Tunisian field validation.
- Fine-tuning is not part of this deployment change. Collect reviewed, consented and redacted
  real orchestration traces first, then train and evaluate a tool-use adapter in Colab.
