---
name: agrogrowth-release-check
description: Perform a pre-merge and pre-deployment readiness check for AgroGrowth without deploying.
---

# AgroGrowth release gate

- Confirm branch and clean/understood working tree.
- Inspect diff and migration changes.
- Run the repository's real lint, typecheck, build, Jest, Cypress, and relevant Python test commands where available.
- Check authorization/RLS coverage for privileged features.
- Check secrets and sensitive-data exposure.
- Check AI/data provenance and model artifact/version metadata.
- Verify health-check expectations and deployment configuration.
- Do not merge or deploy. Return PASS/FAIL/BLOCKED for each check with evidence.
