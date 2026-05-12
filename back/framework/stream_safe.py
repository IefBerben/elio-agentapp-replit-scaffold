"""Global SSE error handler for DeclarativeAgentApp step/action methods.

HOW TO USE:
    Apply @stream_safe on the *class methods* (step/action) of your
    DeclarativeAgentApp subclass to ensure any exception yields a PO-friendly
    French error event instead of crashing the server.

    For standalone generator functions (legacy pattern), @stream_safe works
    the same way.

EXAMPLE (class method)::

    from framework import step, DeclarativeAgentApp
    from framework.stream_safe import stream_safe

    class MyApp(DeclarativeAgentApp):
        class Meta:
            tabs = [InputTab]

        @step(id="generate")
        @stream_safe
        async def generate(self, ctx, inputs: InputTab):
            yield self.in_progress("working", 50)
            yield self.completed(data={...})

EXAMPLE (standalone function)::

    from framework.stream_safe import stream_safe

    @stream_safe
    async def my_step_stream(...):
        yield {"step": "...", "status": "in_progress", "progress": 0}
"""

import logging
from collections.abc import AsyncGenerator
from functools import wraps

logger = logging.getLogger(__name__)

# PO-friendly error messages indexed by exception class name.
ERROR_MESSAGES: dict[str, str] = {
    # Auth failures
    "AuthenticationError": "❌ Connexion Azure échouée. Lance 'az login' dans ton terminal.",
    "ClientAuthenticationError": "❌ Connexion Azure échouée. Lance 'az login' dans ton terminal.",
    "CredentialUnavailableError": "❌ Aucun identifiant Azure trouvé. Lance 'az login' dans ton terminal.",
    # Resource not found
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
    and a PO-friendly French message. Works on both standalone generator
    functions and DeclarativeAgentApp async generator methods.

    Idempotent: if the function is already wrapped, returns it as-is. This
    allows @step and @action to apply stream_safe automatically without
    breaking code that still uses the explicit decorator.

    Args:
        func: An async generator function (standalone or class method).

    Yields:
        SSE dicts from the wrapped function, plus an error dict on exception.
    """
    # Idempotence guard: already wrapped, return as-is
    if getattr(func, "__stream_safe_applied__", False):
        return func

    @wraps(func)
    async def wrapper(*args, **kwargs) -> AsyncGenerator[dict, None]:
        try:
            async for event in func(*args, **kwargs):
                yield event
        except Exception as e:
            error_type = type(e).__name__
            message = ERROR_MESSAGES.get(error_type, ERROR_MESSAGES["default"])
            logger.error("Step function error [%s]: %s", error_type, e, exc_info=True)
            yield {
                "step": "error",
                "message": message,
                "status": "error",
                "progress": 0,
                "error": str(e),
                "error_type": error_type,
            }

    wrapper.__stream_safe_applied__ = True  # type: ignore[attr-defined]
    return wrapper
