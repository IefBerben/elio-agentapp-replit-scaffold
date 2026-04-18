"""Backward-compatibility shim — real implementation is in services/llm_config.py.

This file exists so that existing code using `from llm_config import get_llm`
continues to work. New agents should import from the canonical location:

    from services.llm_config import get_llm, generate_image, AVAILABLE_MODELS
"""

from services.llm_config import AVAILABLE_MODELS, generate_image, get_llm

__all__ = ["get_llm", "generate_image", "AVAILABLE_MODELS"]
