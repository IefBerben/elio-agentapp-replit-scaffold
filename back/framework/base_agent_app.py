"""Declarative base class for agent applications (standalone, JSON-backed DB).

This is a standalone adaptation of the neo-back DeclarativeAgentApp framework.
The public API is 100% identical — agents written here can be migrated to
neo-back by copying the agent folder and adding the class to registered_apps.py.

The only difference: instead of MongoDB, state is stored in a local JSON file
at ``back/data/state.json``. This simulates a single-document database per
(app_id, username) pair and persists across server restarts, mirroring the
production behaviour of neo-back.

Subclasses declare tabs in ``Meta.tabs``, then annotate async generator methods
with ``@step`` and ``@action``. The framework handles state loading, tab field
routing automatically.
"""

import inspect
import json
import logging
import threading
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import Any, ClassVar, cast

from pydantic import BaseModel

from framework.action_decorator import _ACTION_ATTR
from framework.models import ActionMetadata, DeclStepMetadata, SSEEvent, StepContext, TabSchema
from framework.step_decorator import _STEP_ATTR

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------ #
# JSON-backed state store (simulates MongoDB for standalone toolkit)
# ------------------------------------------------------------------ #

# Single JSON file acting as the "database" — lives next to back/data/
_DB_PATH = Path(__file__).parent.parent / "data" / "state.json"
_DB_LOCK = threading.Lock()


def _load_json_db() -> dict[str, Any]:
    """Load the full JSON database from disk.

    Returns:
        Dict mapping "{app_id}::{username}" keys to flat state dicts.
        Returns an empty dict if the file does not exist or is corrupt.
    """
    if not _DB_PATH.exists():
        return {}
    try:
        return json.loads(_DB_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        logger.warning("state.json is corrupt or unreadable — starting with empty state.")
        return {}


def _save_json_db(db: dict[str, Any]) -> None:
    """Write the full JSON database to disk atomically.

    Args:
        db: Full database dict to persist.
    """
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = _DB_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(db, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(_DB_PATH)


def _db_key(app_id: str, username: str) -> str:
    """Build the storage key for a (app_id, username) pair.

    Args:
        app_id: Agent application identifier.
        username: Authenticated user identifier.

    Returns:
        String key in the format "{app_id}::{username}".
    """
    return f"{app_id}::{username}"


def _get_state(app_id: str, username: str) -> dict[str, Any]:
    """Return the stored flat state for (app_id, username), or empty dict.

    Args:
        app_id: Agent application identifier.
        username: Authenticated user identifier.

    Returns:
        Stored flat state dict, or empty dict if no state exists.
    """
    with _DB_LOCK:
        db = _load_json_db()
        return db.get(_db_key(app_id, username), {})


def _set_state(app_id: str, username: str, state: dict[str, Any]) -> None:
    """Persist the full flat state for (app_id, username).

    Args:
        app_id: Agent application identifier.
        username: Authenticated user identifier.
        state: Full flat state dict to store.
    """
    with _DB_LOCK:
        db = _load_json_db()
        db[_db_key(app_id, username)] = state
        _save_json_db(db)


def _patch_state(app_id: str, username: str, updates: dict[str, Any]) -> None:
    """Merge field updates into the stored flat state.

    Args:
        app_id: Agent application identifier.
        username: Authenticated user identifier.
        updates: Fields to merge into the existing state.
    """
    with _DB_LOCK:
        db = _load_json_db()
        key = _db_key(app_id, username)
        current = db.get(key, {})
        current.update(updates)
        db[key] = current
        _save_json_db(db)


def reset_state(app_id: str, username: str) -> None:
    """Clear the stored state for (app_id, username).

    Args:
        app_id: Agent application identifier.
        username: Authenticated user identifier.
    """
    with _DB_LOCK:
        db = _load_json_db()
        db.pop(_db_key(app_id, username), None)
        _save_json_db(db)


def get_full_state(app_id: str, username: str) -> dict[str, Any]:
    """Return the full stored state including status metadata.

    Returns the raw stored document including ``_status`` and ``_last_step_id``
    fields added by the framework during step execution.

    Args:
        app_id: Agent application identifier.
        username: Authenticated user identifier.

    Returns:
        Full state dict with ``status`` and ``last_step_id`` extracted to top
        level for easy consumption by the frontend reload-detection logic.
    """
    raw = _get_state(app_id, username)
    return {
        "status": raw.get("_status", "idle"),
        "last_step_id": raw.get("_last_step_id"),
        "state": {k: v for k, v in raw.items() if not k.startswith("_")},
    }


# ------------------------------------------------------------------ #
# DeclarativeAgentApp
# ------------------------------------------------------------------ #


class DeclarativeAgentApp:
    """Base class for declarative agent app implementations.

    Subclasses declare:
    - ``Meta.tabs``: ordered list of TabSchema classes (one per UI tab).
    - ``@step``-decorated async generator methods for sequential main steps.
    - ``@action``-decorated methods for lightweight targeted mutations.

    Tab field names must be unique across all tabs within an app.

    Integration note:
        The public API is identical to the neo-back framework.
        To integrate into neo-back: copy your agent folder into
        ``back/src/neo_back/services/agent_apps/<category>/``, then add
        it to ``registered_apps.py``. The DB layer will be wired automatically.

    Example::

        class MyApp(DeclarativeAgentApp):
            class Meta:
                tabs = [InputTab, OutputTab]

            @step(id="generate")
            async def generate(self, ctx: StepContext, inputs: InputTab):
                yield self.in_progress("working", 50)
                yield self.completed(data={"result": "OK"})

            @action(id="boost", reads=[InputTab])
            async def boost(self, ctx: StepContext, inputs: InputTab):
                yield self.completed(data={"field": "improved"})
    """

    _steps: ClassVar[dict[str, DeclStepMetadata]] = {}
    _actions: ClassVar[dict[str, ActionMetadata]] = {}
    _tab_defs: ClassVar[list[type[TabSchema]]] = []
    _tab_field_names: ClassVar[set[str]] = set()

    def __init__(self, app_id: str = "") -> None:
        self.app_id = app_id

    # ------------------------------------------------------------------ #
    # Class setup via __init_subclass__
    # ------------------------------------------------------------------ #

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        meta = getattr(cls, "Meta", None)
        tabs: list[type[TabSchema]] = list(getattr(meta, "tabs", []) if meta else [])
        cls._tab_defs = tabs
        cls._tab_field_names = _validate_tab_field_uniqueness(tabs, cls.__name__)
        cls._steps = _collect_steps(cls)
        cls._actions = _collect_actions(cls)

    # ------------------------------------------------------------------ #
    # Flat state helpers
    # ------------------------------------------------------------------ #

    def _build_flat_state(self) -> dict[str, Any]:
        """Build a fresh flat state dict from all tab field defaults.

        Returns:
            Dict containing all field default values from all declared tabs.
        """
        state: dict[str, Any] = {}
        for tab_cls in self._tab_defs:
            state.update(tab_cls().model_dump())
        return state

    def _extract_tab(
        self,
        tab_cls: type[TabSchema],
        flat_state: dict[str, Any],
    ) -> TabSchema:
        """Extract and instantiate a tab from the flat state dict.

        Args:
            tab_cls: TabSchema subclass to instantiate.
            flat_state: Flat dict containing all fields.

        Returns:
            Instantiated tab schema populated from flat_state.
        """
        tab_fields = {k: v for k, v in flat_state.items() if k in tab_cls.model_fields}
        return cast(TabSchema, tab_cls.model_validate(tab_fields))

    async def _load_flat_state(self, username: str) -> dict[str, Any]:
        """Load the current flat state from memory, merging with defaults.

        Args:
            username: Authenticated user.

        Returns:
            Flat state dict — stored values take precedence, defaults fill gaps.
        """
        raw_state = _get_state(self.app_id, username)
        defaults = self._build_flat_state()
        if raw_state:
            defaults.update(raw_state)
        return defaults

    # ------------------------------------------------------------------ #
    # SSE event helpers (static — identical API to neo-back)
    # ------------------------------------------------------------------ #

    @staticmethod
    def _serialize_data(
        data: BaseModel | dict[str, Any] | None,
    ) -> dict[str, Any] | None:
        """Serialize *data* to a plain dict.

        Args:
            data: Pydantic model instance or plain dict.

        Returns:
            Plain dict, or ``None`` if *data* is ``None``.
        """
        if data is None:
            return None
        if isinstance(data, BaseModel):
            return cast("dict[str, Any]", data.model_dump())
        return dict(data)

    @staticmethod
    def in_progress(
        step_name: str | None = None,
        progress: int = 0,
        *,
        step_id: str | None = None,
        title: str | None = None,
        message: str | None = None,
        description: str | None = None,
        time_estimate: str | None = None,
        data: BaseModel | dict[str, Any] | None = None,
    ) -> SSEEvent:
        """Build an in-progress SSE event.

        Args:
            step_name: Current processing phase name (positional).
            progress: Completion percentage (0-100).
            step_id: Alias for step_name (keyword, for agent compat).
            title: Short localised title.
            message: Localised user-facing message.
            description: Longer description.
            time_estimate: Human-readable estimate.
            data: Typed output or plain dict payload.

        Returns:
            An SSEEvent with status ``"in_progress"``.
        """
        return SSEEvent(
            step=step_name or step_id or "",
            status="in_progress",
            progress=progress,
            title=title,
            message=message,
            description=description,
            time_estimate=time_estimate,
            data=DeclarativeAgentApp._serialize_data(data),
        )

    @staticmethod
    def completed(
        *,
        step_id: str | None = None,
        message: str | None = None,
        title: str | None = None,
        data: BaseModel | dict[str, Any] | None = None,
    ) -> SSEEvent:
        """Build a completion SSE event.

        Args:
            step_id: Step identifier (keyword, for agent compat; ignored in payload).
            message: Final message.
            title: Final title.
            data: Typed output or plain dict result payload.

        Returns:
            An SSEEvent with status ``"completed"`` and progress 100.
        """
        return SSEEvent(
            step=step_id or "completed",
            status="completed",
            progress=100,
            title=title,
            message=message,
            data=DeclarativeAgentApp._serialize_data(data),
        )

    @staticmethod
    def error(
        error: str | None = None,
        *,
        step_id: str | None = None,
        message: str | None = None,
    ) -> SSEEvent:
        """Build an error SSE event.

        Args:
            error: Technical error detail (positional).
            step_id: Step identifier (keyword, for agent compat; ignored in payload).
            message: User-facing error message.

        Returns:
            An SSEEvent with status ``"error"`` and progress 0.
        """
        return SSEEvent(
            step=step_id or "error",
            status="error",
            progress=0,
            message=message,
            data={"error": error} if error else None,
        )

    # ------------------------------------------------------------------ #
    # Step execution
    # ------------------------------------------------------------------ #

    async def run_step(
        self,
        step_id: str,
        username: str,
        **raw_inputs: Any,
    ) -> AsyncGenerator[dict[str, Any]]:
        """Execute a step by id, validating inputs and yielding SSE dicts.

        Inputs are loaded from memory state, with ``raw_inputs`` POST body
        fields overriding the stored values.

        Args:
            step_id: Step to execute.
            username: Authenticated user.
            **raw_inputs: HTTP POST body fields. ``language`` and
                ``interface_language`` are extracted into :class:`StepContext`;
                remaining keys are merged into the flat state.

        Yields:
            Plain dicts (serialised :class:`SSEEvent` instances).

        Raises:
            ValueError: If ``step_id`` is unknown.
        """
        meta = self._steps.get(step_id)
        if meta is None:
            raise ValueError(
                f"Step '{step_id}' not found in '{self.__class__.__name__}'. "
                f"Available: {list(self._steps)}"
            )

        raw_inputs_copy = dict(raw_inputs)
        ctx = StepContext(
            username=username,
            language=raw_inputs_copy.pop("language", "fr"),
            interface_language=raw_inputs_copy.pop("interface_language", "fr"),
        )

        flat_state = await self._load_flat_state(username)
        flat_state.update(raw_inputs_copy)
        tab_instance = self._extract_tab(meta.reads_tab, flat_state)
        method = getattr(self, meta.method_name)

        # Mark generation as running in the JSON DB so the frontend can detect
        # an in-progress generation after a page reload.
        _patch_state(self.app_id, username, {"_status": "running", "_last_step_id": step_id})

        try:
            async for event in method(ctx, tab_instance, **flat_state):
                if isinstance(event, SSEEvent):
                    # Persist completed data to JSON DB
                    if event.status == "completed" and event.data:
                        _patch_state(self.app_id, username, {
                            **event.data,
                            "_status": "completed",
                            "_last_step_id": step_id,
                        })
                    elif (
                        event.status == "in_progress"
                        and event.data is not None
                        and meta.persist_progress
                    ):
                        _patch_state(self.app_id, username, event.data)
                    yield event.model_dump(exclude_none=True)
                else:
                    yield event

        except Exception as exc:
            _patch_state(self.app_id, username, {"_status": "failed", "_last_step_id": step_id})
            logger.error(
                "Step '%s' failed for user %s: %s",
                step_id,
                username,
                exc,
                exc_info=True,
            )
            yield self.error(
                error=str(exc) or type(exc).__name__,
                message=f"Step '{step_id}' failed unexpectedly.",
            ).model_dump(exclude_none=True)

    # ------------------------------------------------------------------ #
    # Action execution
    # ------------------------------------------------------------------ #

    async def run_action(
        self,
        action_id: str,
        username: str,
        **raw_inputs: Any,
    ) -> AsyncGenerator[dict[str, Any]]:
        """Execute an action by id, yielding SSE dicts.

        Actions read from the declared tabs and pass any remaining POST body
        fields that are not in those tabs as extra keyword arguments to the method.

        Args:
            action_id: Action to execute.
            username: Authenticated user.
            **raw_inputs: HTTP POST body fields. ``language`` and
                ``interface_language`` are extracted into :class:`StepContext`;
                tab fields are loaded from state; remaining keys are passed
                as extra kwargs to the method.

        Yields:
            Plain dicts (serialised :class:`SSEEvent` instances).

        Raises:
            ValueError: If ``action_id`` is unknown.
        """
        meta = self._actions.get(action_id)
        if meta is None:
            raise ValueError(
                f"Action '{action_id}' not found in '{self.__class__.__name__}'. "
                f"Available: {list(self._actions)}"
            )

        raw_inputs_copy = dict(raw_inputs)
        ctx = StepContext(
            username=username,
            language=raw_inputs_copy.pop("language", "fr"),
            interface_language=raw_inputs_copy.pop("interface_language", "fr"),
        )

        reads_field_names: set[str] = set()
        for tab_cls in meta.reads_tabs:
            reads_field_names.update(tab_cls.model_fields.keys())

        flat_state = await self._load_flat_state(username)
        flat_state.update(raw_inputs_copy)
        tab_instances = [self._extract_tab(tc, flat_state) for tc in meta.reads_tabs]
        extra_params = {
            k: v for k, v in raw_inputs_copy.items() if k not in reads_field_names
        }

        method = getattr(self, meta.method_name)

        try:
            if meta.streaming:
                async for event in method(ctx, *tab_instances, **extra_params):
                    if isinstance(event, SSEEvent):
                        if event.status == "completed" and event.data:
                            _patch_state(self.app_id, username, event.data)
                        elif event.status == "error":
                            logger.error(
                                "Action '%s' error for %s: %s",
                                action_id,
                                username,
                                event.data,
                            )
                        yield event.model_dump(exclude_none=True)
                    else:
                        yield event
            else:
                result = await method(ctx, *tab_instances, **extra_params)
                if result and isinstance(result, dict):
                    _patch_state(self.app_id, username, result)
                yield self.completed(data=result).model_dump(exclude_none=True)

        except Exception as exc:
            logger.error(
                "Action '%s' failed for user %s: %s",
                action_id,
                username,
                exc,
                exc_info=True,
            )
            yield self.error(
                error=str(exc) or type(exc).__name__,
                message=f"Action '{action_id}' failed unexpectedly.",
            ).model_dump(exclude_none=True)

    # ------------------------------------------------------------------ #
    # Manifest
    # ------------------------------------------------------------------ #

    def get_manifest(self) -> dict[str, Any]:
        """Return a JSON-serializable manifest describing this app.

        Returns:
            Dict with app_id, tabs, steps, and actions metadata.
        """
        tabs_info = []
        for tab_cls in self._tab_defs:
            defaults = tab_cls().model_dump()
            tabs_info.append(
                {
                    "name": tab_cls.__name__,
                    "fields": {
                        name: {
                            "description": (info.description or ""),
                            "default": defaults[name],
                            "is_blob": bool(
                                (info.json_schema_extra or {}).get("is_blob", False)
                            ),
                        }
                        for name, info in tab_cls.model_fields.items()
                    },
                }
            )

        return {
            "app_id": self.app_id,
            "tabs": tabs_info,
            "steps": {
                sid: {
                    "reads_tab": meta.reads_tab.__name__,
                    "persist_progress": meta.persist_progress,
                }
                for sid, meta in self._steps.items()
            },
            "actions": {
                aid: {
                    "reads_tabs": [t.__name__ for t in meta.reads_tabs],
                    "streaming": meta.streaming,
                }
                for aid, meta in self._actions.items()
            },
        }


# ------------------------------------------------------------------ #
# __init_subclass__ helpers
# ------------------------------------------------------------------ #


def _validate_tab_field_uniqueness(
    tabs: list[type[TabSchema]],
    class_name: str,
) -> set[str]:
    """Verify field names are unique across all tabs and return the full set.

    Args:
        tabs: Ordered list of TabSchema subclasses from ``Meta.tabs``.
        class_name: App class name used in error messages.

    Returns:
        Set of all field names declared across all tabs.

    Raises:
        TypeError: If the same field name appears in more than one tab.
    """
    all_field_names: set[str] = set()
    for tab_cls in tabs:
        for field_name in tab_cls.model_fields:
            if field_name in all_field_names:
                raise TypeError(
                    f"Field name collision: '{field_name}' appears in multiple "
                    f"tabs in '{class_name}'. Tab field names must be unique."
                )
            all_field_names.add(field_name)
    return all_field_names


def _collect_steps(cls: type) -> dict[str, DeclStepMetadata]:
    """Scan ``cls.__dict__`` for ``@step``-decorated methods and build metadata.

    Args:
        cls: The DeclarativeAgentApp subclass being initialised.

    Returns:
        Mapping of ``step_id`` → :class:`DeclStepMetadata`.

    Raises:
        TypeError: If a step's ``inputs`` parameter hint is missing or not a TabSchema.
    """
    steps: dict[str, DeclStepMetadata] = {}
    for attr_name, method in inspect.getmembers(cls, predicate=inspect.isfunction):
        raw = getattr(method, _STEP_ATTR, None)
        if raw is None:
            continue
        reads_tab = _infer_first_tab_type(method, cls.__name__, attr_name)
        steps[raw["step_id"]] = DeclStepMetadata(
            step_id=raw["step_id"],
            reads_tab=reads_tab,
            method_name=attr_name,
            persist_progress=raw["persist_progress"],
        )
    return steps


def _collect_actions(cls: type) -> dict[str, ActionMetadata]:
    """Scan ``cls.__dict__`` for ``@action``-decorated methods and build metadata.

    Args:
        cls: The DeclarativeAgentApp subclass being initialised.

    Returns:
        Mapping of ``action_id`` → :class:`ActionMetadata`.
    """
    actions: dict[str, ActionMetadata] = {}
    for attr_name, method in inspect.getmembers(cls, predicate=inspect.isfunction):
        raw = getattr(method, _ACTION_ATTR, None)
        if raw is None:
            continue
        reads_list: list[type[TabSchema]] | None = raw["reads"]
        if reads_list is None:
            reads_list = _infer_all_tab_types(method, cls.__name__, attr_name)
        actions[raw["action_id"]] = ActionMetadata(
            action_id=raw["action_id"],
            reads_tabs=tuple(reads_list),
            method_name=attr_name,
            streaming=raw["streaming"],
        )
    return actions


def _infer_first_tab_type(
    method: Any,
    class_name: str,
    method_name: str,
) -> type[TabSchema]:
    """Extract the TabSchema subclass from the first ``inputs`` parameter hint.

    Args:
        method: Decorated method function.
        class_name: App class name for error messages.
        method_name: Method name for error messages.

    Returns:
        The TabSchema subclass used as the reads tab.

    Raises:
        TypeError: If the hint is missing or not a TabSchema subclass.
    """
    hints = {}
    try:
        hints = method.__annotations__
    except AttributeError:
        pass

    # Find the first non-self, non-ctx parameter
    params = list(inspect.signature(method).parameters.keys())
    # params[0] = self, params[1] = ctx, params[2] = inputs (or first tab)
    input_param = next(
        (p for p in params if p not in ("self", "cls", "ctx", "return")),
        None,
    )
    if input_param is None or input_param not in hints:
        raise TypeError(
            f"@step method '{class_name}.{method_name}' must have an 'inputs' "
            f"parameter annotated with a TabSchema subclass."
        )
    hint = hints[input_param]
    if not (isinstance(hint, type) and issubclass(hint, TabSchema)):
        raise TypeError(
            f"@step method '{class_name}.{method_name}': the '{input_param}' "
            f"parameter hint must be a TabSchema subclass, got {hint!r}."
        )
    return hint


def _infer_all_tab_types(
    method: Any,
    class_name: str,
    method_name: str,
) -> list[type[TabSchema]]:
    """Extract all TabSchema subclasses from positional parameter hints.

    Args:
        method: Decorated method function.
        class_name: App class name for error messages.
        method_name: Method name for error messages.

    Returns:
        Ordered list of TabSchema subclasses inferred from type hints.
    """
    hints = {}
    try:
        hints = method.__annotations__
    except AttributeError:
        pass

    params = list(inspect.signature(method).parameters.keys())
    tab_types: list[type[TabSchema]] = []
    for param in params:
        if param in ("self", "cls", "ctx", "return"):
            continue
        # Stop at keyword-only params (after *)
        p = inspect.signature(method).parameters[param]
        if p.kind in (
            inspect.Parameter.KEYWORD_ONLY,
            inspect.Parameter.VAR_KEYWORD,
        ):
            break
        hint = hints.get(param)
        if hint is not None and isinstance(hint, type) and issubclass(hint, TabSchema):
            tab_types.append(hint)

    return tab_types
