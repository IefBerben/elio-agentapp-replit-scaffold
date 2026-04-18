"""Pydantic models for the _reference agent app.

This is the REFERENCE EXAMPLE — do not modify.
Copy this folder and rename it for your own use case.
"""

from pydantic import BaseModel, Field


class Step1Input(BaseModel):
    """Input payload for Step 1."""

    prompt: str = Field(description="Main user request (required)")
    context: str = Field(default="", description="Optional additional context")
    language: str = Field(default="fr", description="Output language: 'fr' or 'en'")
    interface_language: str | None = Field(default=None, description="UI language for progress messages (defaults to language)")


class Step1Result(BaseModel):
    """Result produced by Step 1."""

    summary: str = Field(description="Generated summary")
    key_points: list[str] = Field(
        default_factory=list, description="Key points extracted"
    )


class Step2Input(BaseModel):
    """Input payload for Step 2."""

    prompt: str = Field(description="Original user request")
    step1_result: dict = Field(description="Result dict from Step 1")
    language: str = Field(default="fr", description="Output language: 'fr' or 'en'")
    interface_language: str | None = Field(default=None, description="UI language for progress messages (defaults to language)")


class Step2Result(BaseModel):
    """Result produced by Step 2."""

    recommendations: list[str] = Field(
        default_factory=list, description="Concrete recommendations"
    )
    next_steps: list[str] = Field(
        default_factory=list, description="Suggested next steps"
    )
    conclusion: str = Field(description="One-paragraph conclusion")
