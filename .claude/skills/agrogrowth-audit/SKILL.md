---
name: agrogrowth-audit
description: Run a comprehensive, evidence-based audit of an AgroGrowth area or the whole repository.
---

# AgroGrowth audit workflow

1. Read `CLAUDE.md` and `AGENTS.md`; inspect git status and active branch.
2. Define scope (whole repo or named subsystem) and map entry points, data flow, external dependencies, permissions, and tests.
3. Trace each important UI action to API route, service, database/model source, and returned UI state.
4. Inspect failure states, timeouts, retries, validation, authorization, RLS, observability, localization, and provenance.
5. Execute relevant checks where safe. Never claim live integration without a real successful round trip.
6. Produce a prioritized report with severity, evidence, impact, root cause, recommended fix, and verification method.
7. Do not modify code during an audit unless the user also requested fixes.
