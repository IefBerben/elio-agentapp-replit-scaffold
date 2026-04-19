"""Elio Scaffold — FastAPI server for Agent App development.

Mirrors the Elio platform's agent execution endpoint exactly.
One SSE route handles all agents via AGENTS_MAP.
File upload routes mirror the production /files/* endpoints.

Usage:
    uv run uvicorn main:app --reload --port 8000
"""

import asyncio
import json
import logging
import os
import shutil
import urllib.request
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

# ─── Reference example ────────────────────────────────────────────────────────
from agents._reference import (
    reference_step_1_stream,
    reference_step_2_stream,
)

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
    version="9.0.0",
)


@app.on_event("startup")
async def _check_required_secrets() -> None:
    """Print a clear banner when Azure secrets are missing.

    First-run UX for the Replit Template: without this, the first SSE call
    fails with an opaque 500. Here the consultant sees the missing keys at
    boot and knows exactly which Replit Secrets to set.
    """
    required = ["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        bar = "─" * 70
        logger.warning(
            "\n%s\n⚠️  Missing Replit Secrets: %s\n"
            "    Open the Secrets panel (lock icon) and add them, then click Run again.\n"
            "    See README → 'Configure tes credentials Azure'.\n%s",
            bar, ", ".join(missing), bar,
        )
    else:
        logger.info("✓ Azure OpenAI secrets detected — agents are ready to call the LLM.")


SCAFFOLD_VERSION_URL = (
    "https://raw.githubusercontent.com/IefBerben/elio-agentapp-replit-scaffold/main/SCAFFOLD_VERSION"
)


def _read_local_scaffold_version() -> str | None:
    version_file = Path(__file__).parent.parent / "SCAFFOLD_VERSION"
    try:
        return version_file.read_text(encoding="utf-8").strip()
    except OSError:
        return None


def _fetch_remote_scaffold_version() -> str | None:
    try:
        req = urllib.request.Request(SCAFFOLD_VERSION_URL, headers={"User-Agent": "elio-scaffold"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.read().decode("utf-8").strip()
    except Exception:
        return None


@app.on_event("startup")
async def _check_scaffold_version() -> None:
    """Warn the consultant when their remix is behind the upstream scaffold.

    Non-blocking, best-effort: runs in a background thread, swallows all errors.
    Lets us push fixes to the template and have remixed copies notice within
    one server restart, without forcing every consultant to track GitHub.
    """
    if os.getenv("ELIO_SKIP_VERSION_CHECK"):
        return

    async def _run() -> None:
        local = _read_local_scaffold_version()
        if not local:
            return
        remote = await asyncio.to_thread(_fetch_remote_scaffold_version)
        if not remote or remote == local:
            return
        bar = "─" * 70
        logger.warning(
            "\n%s\n⚠️  Scaffold update available: you have v%s, latest is v%s\n"
            "    Pull upstream changes:\n"
            "      git remote add upstream https://github.com/IefBerben/elio-agentapp-replit-scaffold.git  # once\n"
            "      git pull upstream main\n"
            "    Set ELIO_SKIP_VERSION_CHECK=1 in Secrets to silence this.\n%s",
            bar, local, remote, bar,
        )

    asyncio.create_task(_run())


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
    # ── Reference example (wired — shows the scaffold pattern in action) ──────
    "_reference-step-1": reference_step_1_stream,
    "_reference-step-2": reference_step_2_stream,
    # ── Your agents — add here ────────────────────────────────────────────────
    # "mon-usecase-step-1": mon_usecase_step_1_stream,
}

SSE_MEDIA_TYPE = "text/event-stream"

# ─── Starter state ────────────────────────────────────────────────────────────
# The StarterPage is the default landing until the consultant's own AgentApp
# replaces it. It lets the consultant upload product.md (from the AgentApp
# Elio - Value Office) and optionally a Google AI Studio prototype. The PO
# skill then iterates with them to produce backlog.md before the Builder runs.
#
# The page is removed permanently by the `remove-starter` skill, which also
# flips the default route in App.tsx to the consultant's built AgentApp page.

REPO_ROOT = Path(__file__).parent.parent
PRODUCT_MD_PATH = REPO_ROOT / "product.md"
INPUT_DIR = REPO_ROOT / "Input"


def _product_md_status() -> tuple[bool, bool]:
    """Return (exists, is_template) for product.md.

    is_template is True when the file still contains the boilerplate
    "_À compléter" markers — i.e. the consultant has not edited it yet.
    """
    if not PRODUCT_MD_PATH.is_file():
        return False, False
    try:
        text = PRODUCT_MD_PATH.read_text(encoding="utf-8")
    except OSError:
        return True, True
    is_template = "_À compléter" in text or len(text.strip()) < 200
    return True, is_template


def _input_files() -> list[str]:
    """List filenames in Input/ that look like a Google AI Studio export."""
    if not INPUT_DIR.is_dir():
        return []
    interesting = (".tsx", ".jsx", ".zip", ".json", ".ts", ".js")
    return sorted(
        f.name for f in INPUT_DIR.iterdir()
        if f.is_file() and f.suffix.lower() in interesting and not f.name.startswith(".")
    )


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
async def health() -> dict[str, Any]:
    """Health check endpoint.

    Returns:
        Dict with status and available agent IDs.
    """
    return {
        "status": "ok",
        "scaffold_version": "9.0.0",
        "agents": list(AGENTS_MAP.keys()),
    }


@app.get("/agent-apps/scaffold-status")
async def scaffold_status() -> dict[str, Any]:
    """Return the consultant's situation so the StarterPage can route them.

    Reads product.md and Input/ from the repo root. Used only by the
    StarterPage — never by production agent code.

    Returns:
        Dict with hasProductMd, isProductMdTemplate, inputFiles.
    """
    has_product_md, is_template = _product_md_status()
    return {
        "hasProductMd": has_product_md,
        "isProductMdTemplate": is_template,
        "inputFiles": _input_files(),
    }


_ALLOWED_SPEC_NAMES = {"product.md"}
_ALLOWED_PROTOTYPE_SUFFIXES = {".tsx", ".jsx", ".ts", ".js", ".zip", ".json"}


@app.post("/agent-apps/upload-spec")
async def upload_spec(files: list[UploadFile]) -> dict[str, Any]:
    """Save the consultant's product.md at the repo root.

    Used by the StarterPage so the consultant can drop the product.md
    produced by the AgentApp Elio - Value Office. backlog.md is NOT accepted —
    it is derived by the PO skill from product.md.

    Returns:
        Dict with the saved files and the updated scaffold status.

    Raises:
        HTTPException 400: filename is not product.md.
    """
    saved = []
    for upload in files:
        original_name = Path(upload.filename or "").name.lower()
        if original_name not in _ALLOWED_SPEC_NAMES:
            await upload.close()
            raise HTTPException(
                status_code=400,
                detail=f"Only {sorted(_ALLOWED_SPEC_NAMES)} can be uploaded here.",
            )
        dest = REPO_ROOT / original_name
        try:
            with dest.open("wb") as out:
                shutil.copyfileobj(upload.file, out)
        finally:
            await upload.close()
        saved.append({"name": original_name, "size": dest.stat().st_size})
        logger.info(f"Spec saved: {dest}")

    return {"files": saved, "status": await scaffold_status()}


@app.post("/agent-apps/upload-prototype")
async def upload_prototype(files: list[UploadFile]) -> dict[str, Any]:
    """Save a Google AI Studio export to Input/.

    The Input/ folder is the contract used by the `intake-from-markdown`
    skill — files dropped here are picked up automatically when the
    consultant runs "Build my app from the prototype in Input/".

    Returns:
        Dict with the saved files and the updated scaffold status.

    Raises:
        HTTPException 400: file extension not allowed.
    """
    INPUT_DIR.mkdir(exist_ok=True)
    saved = []
    for upload in files:
        original_name = Path(upload.filename or "file").name
        suffix = Path(original_name).suffix.lower()
        if suffix not in _ALLOWED_PROTOTYPE_SUFFIXES:
            await upload.close()
            raise HTTPException(
                status_code=400,
                detail=f"Only {sorted(_ALLOWED_PROTOTYPE_SUFFIXES)} files are accepted.",
            )
        dest = INPUT_DIR / original_name
        try:
            with dest.open("wb") as out:
                shutil.copyfileobj(upload.file, out)
        finally:
            await upload.close()
        saved.append({"name": original_name, "size": dest.stat().st_size})
        logger.info(f"Prototype saved: {dest}")

    return {"files": saved, "status": await scaffold_status()}


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
