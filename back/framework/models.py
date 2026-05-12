"""Models for the DeclarativeAgentApp framework (standalone, no DB).

Defines the standard SSE event format, step execution context,
tab schema base class, and declarative metadata types.

This is a standalone adaptation of the neo-back base framework —
the public API is identical so agents can be migrated to neo-back
without any changes.
"""

from dataclasses import dataclass
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field




class SSEEvent(BaseModel):
    """Standard SSE event emitted by agent app steps.

    Every step must yield SSEEvent instances. The base class converts
    them to plain dicts before sending over the wire.

    Args:
        step: Identifier of the current processing phase.
        status: Execution status.
        progress: Completion percentage (0-100).
        title: Short localised title shown in the UI.
        message: Localised user-facing message.
        description: Optional longer description.
        time_estimate: Human-readable time estimate (e.g. "~2 min").
        data: Arbitrary payload specific to the step (draft, file path …).
    """

    step: str = Field(..., description="Identifier of the current processing phase")
    status: Literal["in_progress", "completed", "error"] = Field(
        ..., description="Execution status"
    )
    progress: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Completion percentage (0-100)",
    )
    title: str | None = Field(default=None, description="Short localised UI title")
    message: str | None = Field(
        default=None, description="Localised user-facing message"
    )
    description: str | None = Field(
        default=None, description="Optional longer description"
    )
    time_estimate: str | None = Field(
        default=None, description="Human-readable time estimate"
    )
    data: dict[str, Any] | None = Field(
        default=None,
        description="Arbitrary payload specific to the step",
    )


@dataclass(frozen=True)
class StepContext:
    """Common context injected into every step/action execution.

    Attributes:
        username: Authenticated user identifier.
        language: Output content language code (e.g. ``"fr"``).
        interface_language: UI language code (e.g. ``"en"``).
    """

    username: str
    language: str = "fr"
    interface_language: str = "fr"


class TabSchema(BaseModel):
    """Base class for tab schemas in a DeclarativeAgentApp.

    Each subclass represents one UI tab's persistable fields.
    Tab field names must be unique across all tabs in the same app.
    All fields should have a non-empty description for API documentation.
    All fields MUST have default values (empty state = initial state).

    Example::

        class InputTab(TabSchema):
            prompt: str = Field("", description="Main user request")
            lang: str = Field("fr", description="Output language")
    """

    model_config = ConfigDict(extra="ignore")


@dataclass(frozen=True)
class DeclStepMetadata:
    """Metadata for a declarative step.

    Attributes:
        step_id: Unique step identifier within the app.
        reads_tab: TabSchema class that provides the step's inputs.
        method_name: Name of the decorated method on the app class.
        persist_progress: If True, partial data is persisted on in_progress events.
    """

    step_id: str
    reads_tab: type[TabSchema]
    method_name: str
    persist_progress: bool = False


@dataclass(frozen=True)
class ActionMetadata:
    """Metadata for a declarative action.

    Actions are lightweight, targeted operations that do not advance the current
    UI tab. They can read from zero or more tab schemas.

    Attributes:
        action_id: Unique action identifier within the app.
        reads_tabs: Ordered tuple of TabSchema classes to load from state.
        method_name: Name of the decorated method on the app class.
        streaming: If True (default), the method is an async generator yielding SSEEvent.
    """

    action_id: str
    reads_tabs: tuple[type[TabSchema], ...]
    method_name: str
    streaming: bool = True
