"""Elio Scaffold — FastAPI server for Agent App development.

Mirrors the Elio platform's agent execution endpoint exactly.
One SSE route handles all agents via AGENTS_MAP.
File upload routes mirror the production /files/* endpoints.

Usage:
    uv run uvicorn main:app --reload --port 8000
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
# Pass the returned `path` values in agent step payloads for document processing.
TEMPFILES_DIR = Path(__file__).parent / "tempfiles"
TEMPFILES_DIR.mkdir(exist_ok=True)

# ─── Reference example (code mort — ne pas décommenter pour la production) ────
# from agents._reference import (
#     reference_step_1_stream,
#     reference_step_2_stream,
# )

# ─── Vos agents — ajouter vos imports ici ─────────────────────────────────────
# from agents.{mon_usecase} import (
#     mon_usecase_step_1_stream,
#     mon_usecase_step_2_stream,
# )

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("elio_scaffold")

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Elio Scaffold — Agent App Server",
    description="Scaffold conforme au toolkit Elio pour le développement d'Agent Apps.",
    version="8.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Agents Registry ──────────────────────────────────────────────────────────
# Convention: kebab-case, suffixe -step-N
# Ajouter chaque step de chaque agent ici.
#
# EXEMPLE (référence, à ne pas décommenter) :
#   "_reference-step-1": reference_step_1_stream,
#   "_reference-step-2": reference_step_2_stream,
#
# VOS AGENTS (décommenter et remplacer) :
#   "mon-usecase-step-1": mon_usecase_step_1_stream,
#   "mon-usecase-step-2": mon_usecase_step_2_stream,
AGENTS_MAP: dict[str, Any] = {
    # Ajouter vos agents ici
}

SSE_MEDIA_TYPE = "text/event-stream"


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
async def health() -> dict[str, Any]:
    """Health check endpoint.

    Returns:
        Dict with status and available agent IDs.
    """
    return {
        "status": "ok",
        "scaffold_version": "8.0.0",
        "agents": list(AGENTS_MAP.keys()),
    }


@app.post("/agent-apps/execute/{agent_id}/stream")
async def execute_agent_stream(
    agent_id: str,
    request: Request,
) -> StreamingResponse:
    """Execute an agent step with Server-Sent Events streaming.

    Mirrors the Elio platform's /agent-apps/execute/{agent_id}/stream route.

    Args:
        agent_id: Identifier of the agent step (must exist in AGENTS_MAP).
        request: FastAPI request with JSON body containing agent inputs.

    Returns:
        StreamingResponse with text/event-stream content type.

    Raises:
        HTTPException 404: If agent_id is not found in AGENTS_MAP.
        HTTPException 400: If request body is not valid JSON.
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
        """Yield SSE-formatted events from agent execution.

        Yields:
            SSE strings in format: "data: {json}\\n\\n"
        """
        try:
            async for update in stream_fn(username="scaffold-user", **inputs):
                yield f"data: {json.dumps(update, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error(f"Error streaming agent {agent_id}: {e}", exc_info=True)
            error_event = {
                "step": "error",
                "message": f"Streaming error: {e}",
                "status": "error",
                "progress": 0,
                "error": str(e),
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        generate_sse_events(),
        media_type=SSE_MEDIA_TYPE,
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── File upload ───────────────────────────────────────────────────────────────

@app.get("/files")
async def list_files() -> dict[str, Any]:
    """List all files currently stored in the tempfiles directory.

    Returns the same metadata structure as /files/upload so the frontend
    can synchronise its state on startup or after a page refresh.

    Returns:
        Dict with a list of file metadata (name, path, size).
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
async def upload_files(files: list[UploadFile]) -> dict[str, Any]:
    """Upload one or more files to the local tempfiles directory.

    Files are saved as `tempfiles/<uuid>_<original_name>` to avoid collisions.
    The returned `path` values can be passed as `file_paths` in agent payloads.

    Args:
        files: List of uploaded files (multipart/form-data).

    Returns:
        Dict with a list of saved file metadata (name, path, size).
    """
    saved = []
    for upload in files:
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
async def delete_file(filename: str) -> dict[str, Any]:
    """Delete a previously uploaded file from the tempfiles directory.

    Args:
        filename: The unique filename as returned by /files/upload (basename only).

    Returns:
        Dict with status message.

    Raises:
        HTTPException 400: If the filename contains path traversal characters.
        HTTPException 404: If the file does not exist.
    """
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    target = TEMPFILES_DIR / filename
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")

    target.unlink()
    logger.info(f"File deleted: {target}")
    return {"status": "deleted", "filename": filename}


@app.get("/files/{filename}/download")
async def download_file(filename: str) -> FileResponse:
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
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    target = TEMPFILES_DIR / filename
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")

    original_name = filename[33:] if len(filename) > 33 and filename[32] == "_" else filename

    logger.info(f"File download: {target} as {original_name}")
    return FileResponse(
        target,
        filename=original_name,
        media_type="application/octet-stream",
    )
