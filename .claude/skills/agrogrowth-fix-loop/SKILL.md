---
name: agrogrowth-fix-loop
description: Implement a complete AgroGrowth fix with regression tests and evidence-based verification.
---

# AgroGrowth fix loop

1. Reproduce the defect or establish it from code and a failing test.
2. Trace the root cause across frontend, backend, database, and external service boundaries.
3. Write/adjust a regression test before or alongside the fix.
4. Implement the smallest complete fix; preserve role security, RTL/localization, API compatibility, and data provenance.
5. Run focused tests, then lint/typecheck/build and relevant integration tests.
6. Inspect the full diff and search for secrets, mock fallbacks, unsafe SQL, and accidental unrelated changes.
7. Report actual results and blockers. Continue fixing failures introduced by the change; do not hide or skip them.
