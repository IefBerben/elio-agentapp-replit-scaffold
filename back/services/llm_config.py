"""LLM Configuration — Unified LLM and image generation for the scaffold.

Supports:
  - Azure OpenAI chat models (gpt-5.1, gpt-4.1-mini, o3, …)
  - Image generation (gpt-image-1) via generate_image()

Authentication (in priority order):
  1. AZURE_OPENAI_API_KEY env var — simplest, works everywhere including Replit
  2. DefaultAzureCredential — requires `az login` (local dev / managed identity)

Endpoint override: set AZURE_OPENAI_ENDPOINT env var to override config_llms.json.

Configuration is loaded from services/config_llms.json.
To use a different endpoint or add models, edit that file.

Usage:
    from services.llm_config import get_llm, generate_image, AVAILABLE_MODELS

    llm = get_llm()                   # default model (gpt-5.1)
    llm = get_llm("gpt-4.1-mini")    # lighter / faster model

    images = await generate_image("a sunset over the sea")
    image_b64 = images[0]            # "data:image/png;base64,..."
"""

import json
import logging
import os
from pathlib import Path

import httpx
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from dotenv import load_dotenv
from langchain_core.language_models import BaseChatModel
from langchain_openai import AzureChatOpenAI

load_dotenv()

logger = logging.getLogger(__name__)

# ─── Load config ──────────────────────────────────────────────────────────────

_CONFIG_PATH = Path(__file__).parent / "config_llms.json"
try:
    with open(_CONFIG_PATH, encoding="utf-8") as _f:
        _CFG = json.load(_f)
except FileNotFoundError:
    raise SystemExit(
        f"\n❌ Config file not found: {_CONFIG_PATH}\n"
        "   Copy config_llms.json.example to config_llms.json and adjust if needed.\n"
    )
except json.JSONDecodeError as exc:
    raise SystemExit(
        f"\n❌ Invalid JSON in {_CONFIG_PATH}: {exc}\n"
        "   Fix the syntax error in config_llms.json and restart.\n"
    )

try:
    _AZ = _CFG["azure_openai"]
    _AZURE_DEPLOYMENTS: dict[str, str] = _AZ["deployments"]
except KeyError as exc:
    raise SystemExit(
        f"\n❌ Missing key {exc} in {_CONFIG_PATH}\n"
        "   Required structure: azure_openai.endpoint, azure_openai.deployments, defaults.chat\n"
    )

AVAILABLE_MODELS: list[str] = list(_AZURE_DEPLOYMENTS.keys())
"""All supported model names. Pass any of these to get_llm()."""

# Env vars take priority over config_llms.json values
_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT") or _AZ["endpoint"]
_API_KEY: str | None = os.getenv("AZURE_OPENAI_API_KEY") or None
_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION") or _AZ["api_version"]
# When set, ALL get_llm() calls use this single deployment (useful when one deployment handles all models)
_DEPLOYMENT_OVERRIDE: str | None = os.getenv("AZURE_OPENAI_DEPLOYMENT") or None

_AUTH_HELP = (
    "   Option A (Replit): set AZURE_OPENAI_API_KEY in back/.env\n"
    "   Option B (local):  run 'az login' in your terminal"
)


# ─── Azure auth helpers ───────────────────────────────────────────────────────

def _token_provider():
    """Bearer token provider via DefaultAzureCredential (az login / managed identity)."""
    try:
        return get_bearer_token_provider(DefaultAzureCredential(), _AZ["auth_scope"])
    except Exception as exc:
        raise RuntimeError(
            f"❌ Azure authentication failed.\n{_AUTH_HELP}\n   Details: {exc}"
        ) from exc


def _get_token() -> str:
    """Raw bearer token for direct HTTP calls (image generation)."""
    try:
        return DefaultAzureCredential().get_token(_AZ["auth_scope"]).token
    except Exception as exc:
        raise RuntimeError(
            f"❌ Azure authentication failed.\n{_AUTH_HELP}\n   Details: {exc}"
        ) from exc


# ─── Chat model ───────────────────────────────────────────────────────────────

def get_llm(model: str | None = None) -> BaseChatModel:
    """Return a configured LangChain chat model.

    Auth priority: AZURE_OPENAI_API_KEY env var → DefaultAzureCredential (az login).

    Args:
        model: Model name from AVAILABLE_MODELS. Defaults to config default (gpt-5.1).

    Returns:
        A LangChain BaseChatModel ready to use with .invoke() / .ainvoke() / .stream().

    Raises:
        ValueError: If the model name is not recognized.
    """
    name = model or _CFG["defaults"]["chat"]
    deployment = _DEPLOYMENT_OVERRIDE or _AZURE_DEPLOYMENTS.get(name)

    if not deployment:
        raise ValueError(
            f"Unknown model '{name}'.\nAvailable models: {AVAILABLE_MODELS}\n"
            "   Tip: set AZURE_OPENAI_DEPLOYMENT env var to use a single deployment for all models."
        )

    kwargs: dict = {
        "azure_endpoint": _ENDPOINT,
        "azure_deployment": deployment,
        "api_version": _API_VERSION,
    }
    if _API_KEY:
        kwargs["api_key"] = _API_KEY
    else:
        kwargs["azure_ad_token_provider"] = _token_provider()

    return AzureChatOpenAI(**kwargs)


# ─── Image generation ─────────────────────────────────────────────────────────

async def generate_image(
    prompt: str,
    *,
    n: int = 1,
    size: str = "1024x1024",
    quality: str = "medium",
    model: str | None = None,
) -> list[str]:
    """Generate images using Azure OpenAI (gpt-image-1).

    Auth priority: AZURE_OPENAI_API_KEY env var → DefaultAzureCredential (az login).

    Args:
        prompt: Text description of the image to generate.
        n: Number of images to generate (default: 1).
        size: Image dimensions — "1024x1024", "1792x1024", or "1024x1792".
        quality: "low", "medium", or "high" (default: "medium").
        model: Image model name (default: gpt-image-1 from config).

    Returns:
        List of image data URIs: ["data:image/png;base64,..."].

    Raises:
        httpx.HTTPStatusError: If the Azure API call fails.
    """
    img_model = model or _CFG["defaults"]["image"]
    deployment = _DEPLOYMENT_OVERRIDE or _AZURE_DEPLOYMENTS.get(img_model)
    if not deployment:
        raise ValueError(
            f"Unknown image model '{img_model}'.\nAvailable models: {AVAILABLE_MODELS}"
        )

    endpoint = _ENDPOINT.rstrip("/")
    url = (
        f"{endpoint}/openai/deployments/{deployment}"
        f"/images/generations?api-version={_API_VERSION}"
    )

    if _API_KEY:
        auth_headers = {"api-key": _API_KEY}
    else:
        token = _get_token()
        auth_headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            url,
            headers={**auth_headers, "Content-Type": "application/json"},
            json={"prompt": prompt, "n": n, "size": size, "quality": quality},
        )
        response.raise_for_status()
        data = response.json()

    results: list[str] = []
    for item in data.get("data", []):
        if b64 := item.get("b64_json"):
            results.append(f"data:image/png;base64,{b64}")
        elif url_val := item.get("url"):
            results.append(url_val)
    return results
