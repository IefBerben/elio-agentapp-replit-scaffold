"""Framework public API for the toolkit standalone DeclarativeAgentApp.

Import from here in your agent apps::

    from framework import DeclarativeAgentApp, TabSchema, SSEEvent, StepContext
    from framework import step, action
    from framework import register_apps, get_stream_handler, get_action_handler
"""

from framework.action_decorator import action
from framework.base_agent_app import DeclarativeAgentApp, get_full_state, reset_state
from framework.models import ActionMetadata, DeclStepMetadata, SSEEvent, StepContext, TabSchema
from framework.registry import (
    get_action_handler,
    get_all_app_ids,
    get_app_manifest,
    get_stream_handler,
    register_apps,
)
from framework.step_decorator import step

__all__ = [
    # Base class
    "DeclarativeAgentApp",
    "reset_state",
    "get_full_state",
    # Models
    "TabSchema",
    "SSEEvent",
    "StepContext",
    "DeclStepMetadata",
    "ActionMetadata",
    # Decorators
    "step",
    "action",
    # Registry
    "register_apps",
    "get_stream_handler",
    "get_action_handler",
    "get_app_manifest",
    "get_all_app_ids",
]
