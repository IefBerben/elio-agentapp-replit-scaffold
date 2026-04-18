"""Pydantic models for the Conversation agent app."""

from pydantic import BaseModel, Field


class Persona(BaseModel):
    """A generated persona with rich biographical details."""

    name: str = Field(description="Full name of the persona")
    age: int = Field(description="Age in years")
    profession: str = Field(description="Current profession or job title")
    education: str = Field(description="Education background")
    personality_type: str = Field(
        description="Personality archetype (e.g. 'Analytical', 'Creative')"
    )
    description: str = Field(description="Short biographical description")
    interests: list[str] = Field(
        default_factory=list, description="List of personal interests"
    )
    communication_style: str = Field(
        description="How this person typically communicates"
    )
    opinion_on_topic: str = Field(
        description="Initial stance / opinion on the conversation topic"
    )


class ConversationMessage(BaseModel):
    """A single message in the generated conversation."""

    speaker: str = Field(description="Name of the speaker")
    message: str = Field(description="Content of the message")
    tone: str = Field(
        default="neutral", description="Emotional tone (e.g. 'curious', 'passionate')"
    )


class Step1Input(BaseModel):
    """Input payload for Step 1 — persona generation."""

    topic: str = Field(description="Conversation subject (required)")
    persona1_hint: str = Field(
        default="", description="Optional hint for persona 1"
    )
    persona2_hint: str = Field(
        default="", description="Optional hint for persona 2"
    )


class Step2Input(BaseModel):
    """Input payload for Step 2 — discussion generation."""

    topic: str = Field(description="Conversation subject")
    persona1: dict = Field(description="Full persona 1 data")
    persona2: dict = Field(description="Full persona 2 data")
    num_exchanges: int = Field(
        default=8, description="Number of message exchanges to generate"
    )
