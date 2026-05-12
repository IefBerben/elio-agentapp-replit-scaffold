"""Action decorator for DeclarativeAgentApp methods.

The ``@action`` decorator marks a method as a targeted, lightweight operation
that does not advance the current UI tab. Unlike ``@step``, actions can read
from zero or more tab schemas.

stream_safe error handling is applied automatically for streaming actions —
there is no need to add ``@stream_safe`` manually on top of ``@action``.
"""

from collections.abc import Callable
from typing import Any

from .stream_safe import stream_safe as _stream_safe

# Attribute name used to attach raw metadata to decorated methods
_ACTION_ATTR = "__agent_action_raw__"


def action(
    *,
    id: str,
    reads: list | None = None,
    streaming: bool = True,
) -> Callable[..., Any]:
    """Decorator that marks a method as a declarative action.

    Actions are lightweight, targeted mutations that do not advance the current
    UI tab. They read from the specified tab schemas (or infer from type hints
    when ``reads`` is ``None``) and write results back to the flat state on
    completion.

    Usage::

        # Read from one tab + extra params from POST body
        @action(id="boost", reads=[InputTab])
        async def boost(self, ctx: StepContext, inputs: InputTab):
            yield self.completed(data={"refined_brief": "..."})

        # Read from no tabs, all params come from POST body
        @action(id="visual", reads=[])
        async def visual(self, ctx: StepContext, *, title: str, description: str):
            yield self.completed(data={"image_url": "..."})

        # Read from multiple tabs
        @action(id="suggest", reads=[InputTab, OutputTab])
        async def suggest(self, ctx, inputs_in: InputTab, inputs_out: OutputTab):
            yield self.completed(data={"suggestions": [...]})

    Args:
        id: Action identifier, unique within the agent app.
        reads: List of TabSchema classes to load from state and pass as
            positional arguments. Pass ``[]`` for actions that read no tabs.
            When ``None``, the reads are inferred from the method's type hints.
        streaming: If True (default), the method is an async generator yielding
            :class:`~.models.SSEEvent`. If False, it is a coroutine returning
            a dict of field updates.

    Returns:
        A decorator that attaches action metadata to the method and applies
        stream_safe error handling automatically (for streaming actions).

    Raises:
        ValueError: If ``id`` is empty.
    """
    if not id:
        raise ValueError("Action id must be a non-empty string.")

    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        setattr(
            fn,
            _ACTION_ATTR,
            {
                "action_id": id,
                "reads": reads,  # None = infer from hints, [] = no reads
                "streaming": streaming,
            },
        )
        # Apply stream_safe automatically for streaming actions.
        # @wraps inside stream_safe copies fn.__dict__ (which now contains
        # _ACTION_ATTR) to the wrapper.
        if streaming:
            return _stream_safe(fn)
        return fn

    return decorator
