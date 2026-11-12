"""Make the service importable when pytest is invoked from the repo root.

The rest of the AI test suite inserts its service root into ``sys.path``
explicitly; without the same here, the documented command
``pytest soil_analysis/tests/`` (run from ``agrogrowth-ai/``) fails to import
``soil_analyzer``.
"""

import pathlib
import sys

SERVICE_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))
