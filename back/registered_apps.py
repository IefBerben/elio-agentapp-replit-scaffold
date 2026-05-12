"""Central registry of all DeclarativeAgentApp subclasses.

Add your agent app here once you've implemented it:

    from agents.my_usecase import MyUsecaseApp

    REGISTERED_APPS: dict[str, type] = {
        ...
        "my-usecase": MyUsecaseApp,
    }

The dict key is the authoritative app_id (kebab-case).
It is used in the API routes: /agent-apps/execute/{app_id}/{step_id}/stream
"""

from framework import DeclarativeAgentApp

# ─── Import your agent apps here ──────────────────────────────────────────────
from agents._reference import ReferenceApp
from agents.conversation import ConversationApp

# ─── Registration ─────────────────────────────────────────────────────────────
REGISTERED_APPS: dict[str, type[DeclarativeAgentApp]] = {
    # _reference is the REFERENCE EXAMPLE — keep it registered as documentation.
    # Copy _reference/ to create your own agent apps.
    "_reference": ReferenceApp,
    "conversation": ConversationApp,
}
