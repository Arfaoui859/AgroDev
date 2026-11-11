# AgroGrowth Multi-Agent Readiness Audit — 2026-11-11

**Repository:** Arfaoui859/AgroDev  
**Audited baseline:** 374951e19da33c1825a4e971166500eee7caf92a  
**Implementation branch:** feat/agrogrowth-multi-agent-system-2026-11-11  
**Method:** repository tree, source inspection, model manifests/reports, service contracts, and GitHub Actions job logs. No live Render or Supabase credentials were used.

## Executive verdict

AgroGrowth has eight FastAPI AI service domains, a Node/Express API gateway, two LLM-provider adapters (Python and TypeScript), and several trained/packaged model artifacts. It did **not** have a verified production Multi-Agent System in the audited baseline.

The current Intelligent Agent is a chat/task-planning service: it detects intents with regular expressions, creates a rule-based answer, and optionally asks an LLM to rewrite that answer. The Python provider exposes text chat and JSON mode, not native function/tool execution. No orchestrator, specialist registry, validated tool dispatcher, or multi-agent workflow engine existed in the audited baseline.

This branch adds a bounded v1 orchestration layer at the existing Intelligent Agent service and exposes it through the Node gateway. An LLM (when configured) selects specialist tools; the application only executes registered tools with explicit structured inputs; calls are concurrent and results preserve service provenance. This is not yet a learned autonomous planner and it does not invent missing agronomic measurements.

## Existing architecture

| Layer | Existing implementation | Audit finding |
|---|---|---|
| Frontend | React/Vite/TypeScript | Existing AI hook called domain endpoints individually; new orchestration method added. |
| Backend | Node/Express | Existing gateway centralizes private microservice calls; new /api/ai/assistant/orchestrate route added. |
| Python AI | FastAPI services, ports 8001–8008 | Eight domain services exist; their numerical provenance differs substantially. |
| LLM provider | Python ai_common/llm_provider.py; TypeScript llmProvider.ts | Both support text chat/JSON; neither previously dispatched registered tools. |
| Intelligent Agent | intelligent_agent/main.py, agro_chat_ai.py | Single chat assistant plus task planner/alert notifier; not a multi-agent coordinator. |
| Orchestration | No registry/workflow layer in baseline | Added bounded registry, planner, input validation, parallel dispatch, result synthesis and execution trace. |

## Service inventory and evidence-based readiness

| Domain | Port | Principal endpoint(s) | Current engine/provenance | Multi-agent status |
|---|---:|---|---|---|
| Soil | 8001 | /analyze-soil, /predict-lab-soil | Sensor path deterministic rules; seven AFSIS lab-assisted regressors | Registered; lab tool requires complete panel |
| Crop | 8002 | /recommend-crops | synthetic-demo recommender; deterministic profit calculations | Registered; all required farm/climate/market fields required |
| Image diagnosis | 8003 | /detect-disease, /analyze-leaf | MobileNetV3 ONNX artifact exists; heuristic fallback exists | Registered for image uploads; actual model load must be checked at runtime |
| Market | 8004 | /forecast-price, /analyze-supply-demand | synthetic-demo; no licensed live Tunisian market feed | Registered; caller must supply current price/production |
| Intelligent Agent | 8005 | /chat, /plan-season, /orchestrate | Configured LLM or explicit rule fallback | Now hosts central orchestrator endpoint |
| Weather/yield | 8006 | /create-weather-plan, /predict-crop-yield | Weather provider is separate; yield/planning numeric outputs declare synthetic provenance | Registered; explicit weather/soil/management inputs required |
| Pest | 8007 | /analyze-pest-problem, /identify-pest | Numeric analysis synthetic-demo; optional LLM advisory | Registered; full field/symptom/weather inputs required |
| Irrigation | 8008 | /optimize-irrigation | Numeric schedule synthetic-demo; optional LLM advisory | Registered; explicit weather/soil/crop inputs required |

## Model evidence and limitations

- **Soil:** seven committed AFSIS wet-chemistry model artifacts; 2,134 rows after depth filtering; five-fold spatial GroupKFold on 0.25-degree groups. Spatial OOF R² spans 0.337–0.865. Artifacts explicitly say field_validated=false, tunisia_validated=false, and prediction_scope=lab_assisted_only. Ordinary /analyze-soil remains deterministic and does not invoke those regressors.
- **Plant disease:** MobileNetV3-Large ONNX/PyTorch artifacts and metrics are committed for PlantVillage (10,948 test samples, 38 classes; test accuracy 0.9968, macro-F1 0.9926, ONNX agreement 1.0). This is dataset test performance, not proof of Tunisian field accuracy or robustness to phone photos/field conditions. Runtime model load/fallback must be verified on deployment.
- **Crop, market, yield, pest, irrigation:** numeric outputs are still declared synthetic/demo or deterministic. LLM narration does not make those numerical predictions real.
- **Weather:** a real weather provider is distinct from the synthetic yield model; commercial endpoint/key/plan and 429 limits require deployment verification.
- **Intelligent Agent:** provider configuration determines whether LLM inference occurs; health reachability alone is insufficient.

## Critical gaps identified

1. No central orchestration endpoint/registry/dispatch in baseline.
2. No validated tool-call contract or protection against LLM-invented numeric arguments.
3. No specialist execution trace, bounded parallelism, timeout, or per-tool error isolation.
4. Existing chat LLM rewrites a rule-based answer; it does not call the eight services.
5. Python and Node LLM adapters are separate configurations; deployment must pin compatible provider/model settings for the service that performs planning.
6. Several services require extensive structured inputs; chat text alone cannot safely supply them. The caller must pass validated tool_inputs; missing fields are returned rather than fabricated.
7. Image diagnosis requires multipart file upload, unlike JSON-only tools; v1 adds validated base64-to-multipart conversion with a 10 MB limit.
8. Synthetic/demo services must not be represented as field-validated AI in final responses.
9. No Tunisian representative labeled datasets/field trials for crop, yield, market, pest and irrigation numeric models.
10. Live Render service health, Render env vars, Supabase/RLS, and production auth isolation cannot be proven from repository source alone.

## v1 implementation added on this branch

- agrogrowth-ai/intelligent_agent/orchestrator.py: allow-listed specialist registry for soil, crop, vision, market, weather, yield, pest and irrigation; LLM planning using JSON mode; explicit-input validation; bounded concurrent HTTP execution; safe image decoding; per-agent provenance and error traces; LLM result synthesis with no-data-invention instructions.
- POST /orchestrate on the existing Intelligent Agent (8005).
- Node gateway route POST /api/ai/assistant/orchestrate with message/input validation and extended timeout.
- Frontend useAIServices().orchestrateAgriculturalQuery() method. Existing AIAssistantChatbot and SmartAdvisor screens still use their legacy chat endpoints; they are not silently switched because they do not yet collect the structured tool inputs required for safe service execution.
- Python tests for registry coverage, missing inputs, routing, image validation and request bounds.

### Explicit v1 boundaries

- The planner selects tools but does not generate tool arguments. Only tool_inputs supplied by the caller are dispatched. This is deliberate safety: it prevents invented sensor readings, prices, weather, farm size or laboratory values.
- Tools run concurrently unless explicit $results references create dependency edges and sequential execution waves. The caller must define those bindings; the planner does not invent downstream arguments or measurements.
- The public Node gateway accepts a validated multipart image upload, converts it to base64 for the private Python service call, and enforces the existing 10 MB image limit.
- A provider outage falls back to a keyword router and labels planner_source; it does not claim an LLM made the plan.
- No fine-tuning or training is claimed by this change. Fine-tuning should follow collection of reviewed, real tool traces and a held-out evaluation set.

## CI findings on the audited baseline

GitHub Actions run 43010139919 for the baseline commit showed:
- Build: passed.
- Docker Build: passed.
- Security Scan: passed.
- AI Services: passed.
- Code Quality: failed because TypeScript target does not support String.replaceAll in client/lib/cloud-config.ts.
- Node 20 and Node 22 tests: three failures in two suites. One assertion incorrectly expected absent market data to be real; two API-key tests expected production key issuance despite the intentional production 503 guard.
- Database RLS: failed because the conditional SQL block used malformed DO $ delimiters instead of DO $$.

Those three CI regressions are corrected on this branch. A new CI run is required to verify the corrections.

## Release acceptance gates still requiring external evidence

- [ ] All GitHub Actions checks pass on this branch's exact HEAD.
- [ ] Render deploys the updated Intelligent Agent 8005 and Node gateway; verify /health and /orchestrate.
- [ ] Verify Render Blueprint sync applied the Intelligent Agent fromService URL bindings; Docker Compose now injects all seven internal service URLs.
- [ ] Verify actual LLM provider/model credentials on the Intelligent Agent deployment; confirm provider health and multilingual JSON planning.
- [ ] Add farmer-friendly structured input collection to the existing chat screens, then connect them to the orchestrator without guessing missing measurements.
- [ ] Run a real end-to-end request with structured soil + crop + weather inputs and capture agent trace.
- [ ] Verify image ONNX model is loaded in the deployed 8003 service; test representative field photos, not only PlantVillage test images.
- [ ] Apply database migrations and verify two-user RLS/tenant isolation against the live Supabase project.
- [ ] Acquire licensed, representative Tunisian datasets and perform field validation before promoting synthetic numeric models.
- [ ] Build a reviewed multilingual tool-call dataset from real, consented and redacted traces; fine-tune/evaluate only after baseline orchestration is stable.

## Conclusion

The repository now has a concrete, bounded first Multi-Agent orchestration path, not merely a diagram or a generic chat LLM. It must not be described as production-ready until CI, Render deployment, real provider configuration, end-to-end agent traces, and agronomic validation gates are complete.
