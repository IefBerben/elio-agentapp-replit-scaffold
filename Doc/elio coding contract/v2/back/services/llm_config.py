"""LLM Configuration — Unified LLM and image generation for the toolkit.

Supports:
  - Azure OpenAI chat models (gpt-5.1, gpt-4.1-mini, o3) via DefaultAzureCredential
  - Image generation (gpt-image-1) via generate_image()

# Gemini models coming soon

Authentication uses DefaultAzureCredential — no API key needed.
Requires the "Cognitive Services OpenAI User" role on the Azure OpenAI resource.

Configuration is loaded from services/config_llms.json.

Usage:
    from services.llm_config import get_llm, generate_image, AVAILABLE_MODELS

    llm = get_llm()                         # default model (gpt-5.1)
    llm = get_llm("gpt-4.1-mini")          # lighter / faster model

    images = await generate_image("a sunset over the sea")
    image_b64 = images[0]                   # "data:image/png;base64,..."
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

# ─── Load config ────────────────────────────────────────────────────────────

_CONFIG_PATH = Path(__file__).parent / "config_llms.json"
with open(_CONFIG_PATH, encoding="utf-8") as _f:
    _CFG = json.load(_f)

_AZ = _CFG["azure_openai"]
_AZURE_DEPLOYMENTS: dict[str, str] = _AZ["deployments"]

AVAILABLE_MODELS: list[str] = list(_AZURE_DEPLOYMENTS.keys())
"""All supported model names. Pass any of these to get_llm()."""


# ─── Vertex AI Service Account key management ────────────────────────────────

def _ensure_sa_key_has_private_key() -> None:
    """Ensure the Service Account key has a private key.

    In production (Azure): If the private_key field is empty, fetch it from
    Azure Key Vault (secret name: "SaPrivateKey") and inject it locally.

    In development (local): Assumes GOOGLE_APPLICATION_CREDENTIALS points to a
    complete SA key file with private_key already populated.

    This function is idempotent.

    This function is a no-op if:
      - GOOGLE_APPLICATION_CREDENTIALS is not set
      - private_key is already populated (local dev with complete file)
      - AZURE_KEYVAULT_URL is not set (local dev without Key Vault)

    Azure Key Vault access requires DefaultAzureCredential:
      - Local: Run 'az login' (Azure CLI)
      - Azure: Managed Identity with "Key Vault Secrets User" role
    """
    sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not sa_path:
        # Auto-detect sa-key.json next to this file (same pattern as the main backend)
        default_sa_path = str(Path(__file__).parent / "sa-key.json")
        if Path(default_sa_path).exists():
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = default_sa_path
            sa_path = default_sa_path
        else:
            return

    try:
        with open(sa_path, encoding="utf-8") as fh:
            sa_data = json.load(fh)
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning(f"Could not read SA key file {sa_path}: {exc}")
        return

    # Skip if private_key is already set (local dev mode with complete file)
    if sa_data.get("private_key", "") != "":
        return

    logger.info("SA key file has empty private_key, fetching from Azure Key Vault…")

    try:
        kv_url = os.getenv("AZURE_KEYVAULT_URL")
        if not kv_url:
            # Expected in local dev without Key Vault — gcloud ADC or GEMINI_API_KEY fallback will be used instead
            logger.debug(
                "AZURE_KEYVAULT_URL not set — skipping Key Vault injection. "
                "Use 'gcloud auth application-default login' or set GEMINI_API_KEY for local dev."
            )
            return

        credential = DefaultAzureCredential()
        kv_client = SecretClient(vault_url=kv_url, credential=credential)
        secret = kv_client.get_secret("SaPrivateKey")
        private_key = secret.value

    except Exception as exc:
        logger.warning(
            f"Failed to retrieve SaPrivateKey from Key Vault: {exc}\n"
            "Required permissions: 'Key Vault Secrets User' role on the Key Vault. "
            "Falling back to API key mode."
        )
        return

    if not private_key:
        logger.error("SaPrivateKey secret is empty or not found in Key Vault.")
        return

    sa_data["private_key"] = private_key

    try:
        with open(sa_path, "w", encoding="utf-8") as fh:
            json.dump(sa_data, fh, indent=2, ensure_ascii=False)
        logger.info("SA private key injected from Key Vault successfully.")
    except OSError as exc:
        logger.error(f"Failed to write SA key file {sa_path}: {exc}")


# ─── Azure token provider ───────────────────────────────────────────────────

def _token_provider():
    return get_bearer_token_provider(DefaultAzureCredential(), _AZ["auth_scope"])


# ─── Chat model ─────────────────────────────────────────────────────────────

def get_llm(model: str | None = None) -> BaseChatModel:
    """Return a configured LangChain chat model.

    Azure models (gpt-5.1, gpt-4.1-mini, o3) are authenticated automatically
    via DefaultAzureCredential (Azure CLI / VS Code login / Managed Identity).

    Google models (gemini-2.5-flash, gemini-2.5-pro) use:
    - Vertex AI mode (default): Requires GOOGLE_APPLICATION_CREDENTIALS set to a
      Google Cloud Service Account JSON key file. In production, the private
      key is fetched from Azure Key Vault and injected automatically.
      Data stays in the configured EU region.
    - API Key mode (fallback): Falls back to GEMINI_API_KEY env var if Vertex AI unavailable.

    Args:
        model: Model name from AVAILABLE_MODELS. Defaults to config default (gpt-5.1).

    Returns:
        A LangChain BaseChatModel ready to use with .invoke() / .ainvoke() / .stream().

    Raises:
        ValueError: If the model name is not recognized.
    """
    name = model or _CFG["defaults"]["chat"]

    # Gemini models coming soon

    if name in _AZURE_DEPLOYMENTS:
        return AzureChatOpenAI(
            azure_endpoint=_AZ["endpoint"],
            azure_deployment=_AZURE_DEPLOYMENTS[name],
            api_version=_AZ["api_version"],
            azure_ad_token_provider=_token_provider(),
        )

    raise ValueError(
        f"Unknown model '{name}'.\nAvailable models: {AVAILABLE_MODELS}"
    )


# ─── Image generation ───────────────────────────────────────────────────────

async def generate_image(
    prompt: str,
    *,
    n: int = 1,
    size: str = "1024x1024",
    quality: str = "medium",
    model: str | None = None,
) -> list[str]:
    """Generate images using Azure OpenAI (gpt-image-1).

    Authentication is handled automatically via DefaultAzureCredential —
    no API key needed, same Azure login used for chat models.

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

    Example:
        images = await generate_image("a cat sitting on a cloud", quality="high")
        # images[0] is a data URI you can embed directly in an <img> tag or save.
    """
    deployment = _AZURE_DEPLOYMENTS.get(model or _CFG["defaults"]["image"])
    endpoint = _AZ["endpoint"].rstrip("/")
    url = (
        f"{endpoint}/openai/deployments/{deployment}"
        f"/images/generations?api-version={_AZ['api_version']}"
    )

    token = DefaultAzureCredential().get_token(_AZ["auth_scope"]).token

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
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
