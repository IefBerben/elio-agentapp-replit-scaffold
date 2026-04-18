"""Toolkit Neo — Minimal FastAPI server for Agent App development.

This server exposes a single SSE streaming route that mirrors the Neo
application's agent execution endpoint.

Usage:
    uvicorn main:app --reload --port 8000
"""

import json
import logging
import shutil
import uuid
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

# ─── Temp files directory ─────────────────────────────────────────────────────
# Files uploaded via /files/upload are stored here during the session.
# They are NOT persisted across server restarts.
TEMPFILES_DIR = Path(__file__).parent / "tempfiles"
TEMPFILES_DIR.mkdir(exist_ok=True)

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


# ─── File upload ──────────────────────────────────────────

@app.get("/files")
async def list_files():
    """List all files currently stored in the tempfiles directory.

    Returns the same metadata structure as /files/upload so the frontend
    can synchronise its state on startup.

    Returns:
        Dict with a list of file metadata (name, path, size) for each file
        present in the tempfiles directory.
    """
    files = []
    for f in sorted(TEMPFILES_DIR.iterdir()):
        if not f.is_file():
            continue
        # Strip the uuid4 hex prefix (32 chars + underscore) to recover original name
        original_name = f.name[33:] if len(f.name) > 33 and f.name[32] == "_" else f.name
        files.append({
            "name": original_name,
            "path": str(f),
            "size": f.stat().st_size,
        })
    logger.info(f"Listed {len(files)} file(s) from tempfiles")
    return {"files": files}


@app.post("/files/upload")
async def upload_files(files: list[UploadFile]):
    """Upload one or more files to the local tempfiles directory.

    Files are saved under tempfiles/<uuid>_<original_name> to avoid collisions.
    They can then be referenced by their returned paths in agent payloads.

    Args:
        files: List of uploaded files (multipart/form-data).

    Returns:
        Dict with a list of saved file metadata (name, path, size).
    """
    saved = []
    for upload in files:
        # Sanitize filename — keep only the base name, no path traversal
        original_name = Path(upload.filename or "file").name
        unique_name = f"{uuid.uuid4().hex}_{original_name}"
        dest = TEMPFILES_DIR / unique_name

        try:
            with dest.open("wb") as out:
                shutil.copyfileobj(upload.file, out)
        finally:
            await upload.close()

        saved.append({
            "name": original_name,
            "path": str(dest),
            "size": dest.stat().st_size,
        })
        logger.info(f"File saved: {dest}")

    return {"files": saved}


@app.delete("/files/{filename}")
async def delete_file(filename: str):
    """Delete a previously uploaded file from the tempfiles directory.

    Args:
        filename: The unique filename as returned by /files/upload (basename only).

    Returns:
        Dict with status message.

    Raises:
        HTTPException 404: If the file does not exist.
        HTTPException 400: If the filename contains path traversal characters.
    """
    # Guard against path traversal
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    target = TEMPFILES_DIR / filename
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")

    target.unlink()
    logger.info(f"File deleted: {target}")
    return {"status": "deleted", "filename": filename}


@app.get("/files/{filename}/download")
async def download_file(filename: str):
    """Download a previously uploaded file from the tempfiles directory.

    The unique backend filename (uuid-prefixed) is resolved to its original
    name for the Content-Disposition header.

    Args:
        filename: The unique filename as returned by /files/upload (basename only).

    Returns:
        FileResponse with the file content and original filename.

    Raises:
        HTTPException 400: If the filename contains path traversal characters.
        HTTPException 404: If the file does not exist.
    """
    # Guard against path traversal
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    target = TEMPFILES_DIR / filename
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # Strip the uuid4 hex prefix (32 chars + underscore) to recover the original name
    original_name = filename[33:] if len(filename) > 33 and filename[32] == "_" else filename

    logger.info(f"File download: {target} as {original_name}")
    return FileResponse(
        target,
        filename=original_name,
        media_type="application/octet-stream",
    )
