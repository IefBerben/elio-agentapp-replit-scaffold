"""idea_lab agent — helps consultants brainstorm their first agent app idea.

Wired by the StarterPage on first Run. Disposable: when the consultant
no longer needs it, the `remove-starter` skill cleans everything up.
"""

from .step1_generate import idea_lab_step_1_stream

__all__ = ["idea_lab_step_1_stream"]
