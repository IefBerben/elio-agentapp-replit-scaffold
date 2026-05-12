"""Step decorator for DeclarativeAgentApp methods.

The ``@step`` decorator marks an async generator method as an executable
step of an agent app. The reads tab is inferred from the type hint of the
``inputs`` parameter by :class:`DeclarativeAgentApp.__init_subclass__`.

stream_safe error handling is applied automatically — there is no need
to add ``@stream_safe`` manually on top of ``@step``.
"""

from collections.abc import Callable
from typing import Any

from .stream_safe import stream_safe as _stream_safe

# Attribute name used to attach raw metadata to decorated methods
_STEP_ATTR = "__agent_step_raw__"


def step(
    *,
    id: str,
    persist_progress: bool = False,
) -> Callable[..., Any]:
    """Decorator that marks an async generator method as a declarative step.

    The reads tab is resolved automatically from the type hint of the
    ``inputs`` parameter (must be a :class:`~.models.TabSchema` subclass).

    Usage::

        @step(id="generate")
        async def generate(self, ctx: StepContext, inputs: InputTab):
            yield self.in_progress("working", 50)
            yield self.completed(data={"result": "..."})

    Args:
        id: Step identifier, unique within the agent app.
        persist_progress: If True, partial outputs are written to state on
            each ``in_progress`` event that carries data.

    Returns:
        A decorator that attaches step metadata to the method and applies
        stream_safe error handling automatically.

    Raises:
        ValueError: If ``id`` is empty.
    """
    if not id:
        raise ValueError("Step id must be a non-empty string.")

    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        setattr(
            fn,
            _STEP_ATTR,
            {
                "step_id": id,
                "persist_progress": persist_progress,
            },
        )
        # Apply stream_safe automatically. @wraps inside stream_safe copies
        # fn.__dict__ (which now contains _STEP_ATTR) to the wrapper.
        return _stream_safe(fn)

    return decorator
