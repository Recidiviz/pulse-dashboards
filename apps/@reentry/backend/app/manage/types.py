from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.intake_sections import CompletionStatus


class ConversationExchange(BaseModel):
    answer: str = Field(description="The client's answer")
    question: str = Field(description="The caseworker's question")
    section: str = Field(description="The intake section this exchange belongs to")


class IntakeSectionStatus(BaseModel):
    completion_status: CompletionStatus
    title: str = Field(description="The section title")


class IntakeSectionsData(BaseModel):
    sections: List[IntakeSectionStatus] = Field(
        description="List of sections with their status"
    )
    intake_id: str = Field(description="The intake UUID")


class IntakeConversationData(BaseModel):
    client_name: Optional[str] = Field(
        default=None, description="The client's name (None for privacy protection)"
    )
    client_pseudo_id: str = Field(description="The client's pseudo ID")
    completed_sections: List[str] = Field(
        default_factory=list, description="List of completed section titles"
    )
    conversation_history: List[ConversationExchange] = Field(
        default_factory=list, description="List of question-answer exchanges"
    )
    created_at: Optional[str] = Field(default=None, description="Intake creation time")
    environment: Optional[str] = Field(
        default=None, description="Environment that the intake is in."
    )
    error: Optional[str] = Field(
        default=None, description="Error message if the fetch failed"
    )
    intake_type: Optional[str] = Field(
        default=None,
        description="Type of intake: 'conversation', 'transcription', or 'external'",
    )
    sections_data: Optional[IntakeSectionsData] = Field(
        default=None, description="Sections and their completion status"
    )
    status: Optional[str] = Field(
        default=None,
        description="Status of the intake: 'created', 'in_progress', 'error', or 'completed'",
    )
    final_section: Optional[str] = Field(
        default=None,
        description="The final section reached (for generated conversations)",
    )

    @property
    def total_exchanges(self) -> int:
        """Calculate the total number of exchanges in the conversation history."""
        return len(self.conversation_history) if self.conversation_history else 0


class ConversationEvaluation(BaseModel):
    ai_evaluation: Optional[Dict[str, Any]] = Field(
        default=None, description="Evaluation output"
    )
    error: Optional[str] = Field(
        default=None, description="Error message if generation fails"
    )
    conversation_data: Optional[IntakeConversationData] = Field(
        default=None, description="Conversation data (real intake or generated)"
    )
