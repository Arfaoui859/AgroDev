"""
Offload blocking work out of the FastAPI event loop.

The AI microservices wrap scikit-learn models that train and predict
synchronously and can take tens of seconds. Running that inside an `async def`
handler blocks the whole event loop, so a concurrent `/health` (or any other
request) times out and the service looks down even though it is alive. The
idiomatic fix is to run the blocking callable in the Starlette threadpool.
"""

from __future__ import annotations

import functools
from typing import Any, Callable, TypeVar

from starlette.concurrency import run_in_threadpool

T = TypeVar("T")


async def offload(func: Callable[..., T], /, *args: Any, **kwargs: Any) -> T:
    """Run a blocking callable in the threadpool and await its result."""
    if kwargs:
        return await run_in_threadpool(functools.partial(func, *args, **kwargs))
    return await run_in_threadpool(func, *args)
