"""Global SSE error handler for agent step functions.

HOW TO USE:
    Wrap any async generator step function with @stream_safe to ensure
    all exceptions are caught and yielded as SSE error events instead
    of crashing the server.

    The PO sees a friendly French error message in the UI instead of
    a blank page or HTTP 500.

EXAMPLE:
    from utils.stream_error_handler import stream_safe

    @stream_safe
    async def my_step_stream(...) -> AsyncGenerator[dict, None]:
        # ... code normal, pas besoin de try/catch
        yield {"step": "...", "message": "...", "status": "in_progress", "progress": 0}
"""

import logging
from collections.abc import AsyncGenerator
from functools import wraps

logger = logging.getLogger(__name__)

# PO-friendly error messages indexed by exception class name.
# Includes both direct class names and Azure SDK / LangChain variants.
ERROR_MESSAGES = {
    # Auth failures — Azure SDK + OpenAI variants
    "AuthenticationError": "❌ Connexion Azure échouée. Lance 'az login' dans ton terminal.",
    "ClientAuthenticationError": "❌ Connexion Azure échouée. Lance 'az login' dans ton terminal.",
    "CredentialUnavailableError": "❌ Aucun identifiant Azure trouvé. Lance 'az login' dans ton terminal.",
    # Resource / deployment not found
    "ResourceNotFoundError": "❌ Ressource Azure introuvable. Vérifie le nom du déploiement dans services/config_llms.json.",
    "DeploymentNotFound": "❌ Déploiement Azure introuvable. Vérifie services/config_llms.json.",
    "NotFoundError": "❌ Ressource Azure introuvable. Vérifie services/config_llms.json.",
    # Rate limiting
    "RateLimitError": "❌ Quota Azure dépassé. Attends quelques secondes et réessaie.",
    "HttpResponseError": "❌ Erreur Azure. Vérifie les logs du backend pour plus de détails.",
    # Invalid request
    "InvalidRequestError": "❌ Requête invalide. Le contenu envoyé dépasse peut-être la limite de tokens.",
    "BadRequestError": "❌ Requête invalide. Le contenu envoyé dépasse peut-être la limite de tokens.",
    # Network
    "ConnectionError": "❌ Impossible de joindre Azure. Vérifie ta connexion réseau.",
    "ConnectError": "❌ Impossible de joindre Azure. Vérifie ta connexion réseau.",
    # File processing
    "FileNotFoundError": "❌ Fichier introuvable. Il a peut-être été supprimé.",
    "ValueError": "❌ Format de fichier non supporté ou fichier corrompu.",
    # Fallback
    "default": "❌ Une erreur inattendue s'est produite. Regarde les logs du backend pour plus de détails.",
}


def stream_safe(func):
    """Decorator that wraps an async generator and catches all exceptions.

    Converts any exception into a final SSE yield with status='error'
    and a PO-friendly French message.

    Args:
        func: An async generator function that yields SSE dicts.

    Yields:
        SSE dicts from the wrapped function, plus an error dict on exception.
    """

    @wraps(func)
    async def wrapper(*args, **kwargs) -> AsyncGenerator[dict, None]:
        try:
            async for event in func(*args, **kwargs):
                yield event
        except Exception as e:
            error_type = type(e).__name__
            message = ERROR_MESSAGES.get(error_type, ERROR_MESSAGES["default"])
            logger.error(f"Step function error [{error_type}]: {e}", exc_info=True)
            yield {
                "step": "error",
                "message": message,
                "status": "error",
                "progress": 0,
                "error": str(e),
                "error_type": error_type,
            }

    return wrapper
