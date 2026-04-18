"""Toolkit Neo — Minimal FastAPI server for Agent App development.

This server exposes a single SSE streaming route that mirrors the Neo
application's agent execution endpoint.

Usage:
    uvicorn main:app --reload --port 8000
"""

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agents.your_usecase import (
    conversation_step_1_stream,
    conversation_step_2_stream,
)

# ─── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("toolkit_neo")

# ─── FastAPI App ──────────────────────────────────────────
app = FastAPI(
    title="Toolkit Neo — Agent App Server",
    description="Minimal backend for developing Agent Apps with SSE streaming.",
    version="1.0.0",
)

# CORS — allow the frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Agents Registry ─────────────────────────────────────
# Map each agent-id to its streaming function.
# Add your own agents here.
AGENTS_MAP: dict[str, Any] = {
    "conversation-step-1": conversation_step_1_stream,
    "conversation-step-2": conversation_step_2_stream,
}

SSE_MEDIA_TYPE = "text/event-stream"


# ─── Routes ──────────────────────────────────────────────

@app.get("/")
async def health():
    """Health check endpoint.

    Returns:
        Dict with status and available agents.
    """
    return {
        "status": "ok",
        "agents": list(AGENTS_MAP.keys()),
    }


@app.post("/agent-apps/execute/{agent_id}/stream")
async def execute_agent_stream(
    agent_id: str,
    request: Request,
):
    """Execute an agent with Server-Sent Events streaming.

    This endpoint mirrors the Neo application's agent execution route.
    It receives JSON inputs and streams back SSE events with progress updates.

    Args:
        agent_id: Unique identifier of the agent step to execute.
        request: FastAPI request with JSON body containing agent inputs.

    Returns:
        StreamingResponse with text/event-stream content type.

    Raises:
        HTTPException: If agent_id is not found in AGENTS_MAP.
    """
    if agent_id not in AGENTS_MAP:
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{agent_id}' not found. Available: {list(AGENTS_MAP.keys())}",
        )

    try:
        inputs = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON body: {e}") from e

    stream_fn = AGENTS_MAP[agent_id]

    async def generate_sse_events() -> AsyncGenerator[str, None]:
        """Generate Server-Sent Events from agent execution.

        Yields:
            SSE formatted strings: "data: {json}\\n\\n"
        """
        try:
            async for update in stream_fn(
                username="toolkit-user",
                **inputs,
            ):
                yield f"data: {json.dumps(update)}\n\n"
        except Exception as e:
            logger.error(f"Error streaming agent {agent_id}: {e}", exc_info=True)
            error_msg = {
                "step": "error",
                "message": f"Error during execution: {e}",
                "status": "error",
                "progress": 0,
                "error": str(e),
            }
            yield f"data: {json.dumps(error_msg)}\n\n"

    return StreamingResponse(
        generate_sse_events(),
        media_type=SSE_MEDIA_TYPE,
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
