"""Global registry of DeclarativeAgentApp classes (standalone toolkit).

Agent apps are registered via :func:`register_apps`. The registry provides
helpers to build handler functions consumed by the streaming dispatcher and
to introspect registered apps, their steps, and actions.
"""

from collections.abc import AsyncGenerator, Callable
from typing import Any, cast

# Maps app_id → app class.
_AGENT_APP_REGISTRY: dict[str, type] = {}


def _register_app(app_id: str, cls: type) -> None:
    """Register an agent app class under *app_id*.

    Args:
        app_id: Unique identifier for this agent app.
        cls: The concrete DeclarativeAgentApp subclass.

    Raises:
        TypeError: If *cls* defines neither ``@step`` nor ``@action`` methods.
    """
    steps: dict = getattr(cls, "_steps", {})
    actions: dict = getattr(cls, "_actions", {})
    if not steps and not actions:
        raise TypeError(
            f"Agent app '{cls.__name__}' must define at least one "
            f"@step or @action-decorated method."
        )
    _AGENT_APP_REGISTRY[app_id] = cls


def register_apps(apps: dict[str, type]) -> None:
    """Register multiple agent app classes from a declarative mapping.

    Args:
        apps: Mapping of ``app_id`` → :class:`DeclarativeAgentApp` subclass.
    """
    for app_id, cls in apps.items():
        _register_app(app_id, cls)


# ------------------------------------------------------------------ #
# Stream handler factories
# ------------------------------------------------------------------ #

_StreamHandler = Callable[..., AsyncGenerator[dict[str, Any]]]


def _make_stream_handler(
    app_class: type,
    app_id: str,
    step_id: str,
) -> _StreamHandler:
    """Create a streaming handler for a step.

    Args:
        app_class: Concrete DeclarativeAgentApp subclass.
        app_id: Agent application identifier.
        step_id: Step id to execute.

    Returns:
        An async generator function.
    """

    async def _handler(username: str, **inputs: Any) -> AsyncGenerator[dict[str, Any]]:
        instance = app_class(app_id=app_id)
        async for event in instance.run_step(step_id, username, **inputs):
            yield event

    _handler.__qualname__ = f"{app_class.__name__}.{step_id}"
    return _handler


def _make_action_handler(
    app_class: type,
    app_id: str,
    action_id: str,
) -> _StreamHandler:
    """Create a streaming handler for an action.

    Args:
        app_class: Concrete DeclarativeAgentApp subclass.
        app_id: Agent application identifier.
        action_id: Action id to execute.

    Returns:
        An async generator function.
    """

    async def _handler(username: str, **inputs: Any) -> AsyncGenerator[dict[str, Any]]:
        instance = app_class(app_id=app_id)
        async for event in instance.run_action(action_id, username, **inputs):
            yield event

    _handler.__qualname__ = f"{app_class.__name__}.action.{action_id}"
    return _handler


# ------------------------------------------------------------------ #
# Public lookup helpers
# ------------------------------------------------------------------ #


def get_stream_handler(
    app_id: str,
    step_id: str,
) -> _StreamHandler | None:
    """Look up a single step streaming handler by ``(app_id, step_id)``.

    Args:
        app_id: Agent application identifier.
        step_id: Step identifier within the app.

    Returns:
        The async generator handler, or ``None`` if not found.
    """
    app_class = _AGENT_APP_REGISTRY.get(app_id)
    if app_class is None:
        return None
    if step_id not in getattr(app_class, "_steps", {}):
        return None
    return _make_stream_handler(app_class, app_id, step_id)


def get_action_handler(
    app_id: str,
    action_id: str,
) -> _StreamHandler | None:
    """Look up an action streaming handler by ``(app_id, action_id)``.

    Args:
        app_id: Agent application identifier.
        action_id: Action identifier within the app.

    Returns:
        An async generator handler wrapping ``run_action``, or ``None``.
    """
    app_class = _AGENT_APP_REGISTRY.get(app_id)
    if app_class is None:
        return None
    if action_id not in getattr(app_class, "_actions", {}):
        return None
    return _make_action_handler(app_class, app_id, action_id)


def get_app_manifest(app_id: str) -> dict[str, Any] | None:
    """Return the declarative manifest for an app.

    Args:
        app_id: Agent application identifier.

    Returns:
        Manifest dict, or ``None`` if the app is not registered.
    """
    app_class = _AGENT_APP_REGISTRY.get(app_id)
    if app_class is None:
        return None
    instance = app_class(app_id=app_id)
    return cast("dict[str, Any] | None", instance.get_manifest())


def get_all_app_ids() -> list[str]:
    """Return all registered app IDs.

    Returns:
        List of registered app identifiers.
    """
    return list(_AGENT_APP_REGISTRY.keys())
