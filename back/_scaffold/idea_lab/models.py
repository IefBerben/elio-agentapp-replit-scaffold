"""Pydantic models for the idea_lab agent."""

from pydantic import BaseModel, Field


class IdeaLabInput(BaseModel):
    """Input payload for the idea brainstorming step."""

    role: str = Field(description="Consultant's role / job title")
    pain: str = Field(description="A weekly task that takes too much time today")
    language: str = Field(default="fr", description="Output language: 'fr' or 'en'")
    interface_language: str | None = Field(
        default=None, description="UI language for progress messages"
    )


class IdeaSuggestion(BaseModel):
    """One agent app idea tailored to the consultant's role."""

    title: str = Field(description="Short title of the proposed agent app")
    problem: str = Field(description="One-line problem statement")
    inputs: str = Field(description="What the user provides (one short line)")
    outputs: str = Field(description="What the agent returns (one short line)")
    why_it_fits: str = Field(description="Why this fits the consultant's role")


class IdeaLabResult(BaseModel):
    """Result produced by the idea brainstorming step."""

    ideas: list[IdeaSuggestion] = Field(
        default_factory=list, description="3 concrete agent app ideas"
    )
