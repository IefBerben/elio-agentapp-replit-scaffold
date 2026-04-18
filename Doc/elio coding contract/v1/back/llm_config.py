"""LLM Configuration — Customize this file with your own endpoint.

This module provides a singleton LLM instance used by all agent steps.
It uses LangChain's ChatOpenAI, which is compatible with any
OpenAI-compatible API (Azure OpenAI, vLLM, Ollama, local, etc.).

To configure:
    1. Copy .env.example to .env
    2. Set your API key, base URL, and model name
    3. Restart the server
"""

import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, AzureChatOpenAI

load_dotenv()

# ─── Configuration ────────────────────────────────────────
# Modify these values or set them via environment variables / .env file

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "your-api-key-here")
OPENAI_API_BASE: str = os.getenv(
    "OPENAI_API_BASE", "https://api.openai.com/v1"
)
LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gpt-4o-mini")
LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))

# ─── LLM Instance ────────────────────────────────────────


from azure.identity import DefaultAzureCredential, get_bearer_token_provider

def get_token_provider():
    return get_bearer_token_provider(
        DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
    )


def get_llm() -> ChatOpenAI:
    """Return a configured ChatOpenAI instance.

    Returns:
        ChatOpenAI: LangChain chat model ready to use.
    """
    return AzureChatOpenAI(
        api_version="2025-04-01-preview",
        azure_endpoint="https://neo-models-southus-azopenai-dev.openai.azure.com/",
        model="gpt-5.2",
        azure_deployment="gpt-5.2",
        temperature=1,
        azure_ad_token_provider=get_token_provider(),
    )
