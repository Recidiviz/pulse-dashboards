import logging
import structlog
from enum import Enum
from typing import Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.base import AssessmentType

logger = structlog.get_logger(__name__)


class MetadataType(str, Enum):
    assessment = "assessment"


class Metadata(BaseModel):
    model_config = ConfigDict(frozen=True, populate_by_name=True)

    code: str
    version: int
    display_name: str
    description: Optional[str] = None


class AssessmentMetadata(Metadata):
    metadata_type: MetadataType = Field(default=MetadataType.assessment)
    state_code: str


class IntakeSectionConfig(BaseModel):
    title: str
    description: str
    required_information: str


class IntakeBotPromptsConfig(BaseModel):
    role: str
    tone: str
    system_message: str
    opening_remarks: str


class ModelConfig(BaseModel):
    """LLM model configuration."""

    provider: str = Field(
        description="Model provider: 'openai', 'anthropic', or 'google'"
    )
    name: str = Field(
        description="Model name (e.g., 'gpt-4o', 'claude-3-5-sonnet', 'gemini-2.0-flash')"
    )
    version: str | None = Field(
        None, description="Model version (e.g., '2024-11-20', '20241022', 'exp-0205')"
    )


class IntakeConfig(BaseModel):
    intake_type: Literal[
        "transcription", "external"
    ]  # Todo manually keep up to date with IntakeType (cf IntakeModel)
    scoring: AssessmentType
    scoring_model: ModelConfig


class IntakeConfigConversation(BaseModel):
    intake_type: Literal["conversation"]
    scoring: AssessmentType
    scoring_model: ModelConfig
    prompts: IntakeBotPromptsConfig
    sections: list[IntakeSectionConfig]
    chat_model: ModelConfig

    @field_validator("sections")
    def at_least_one_section(cls, value):
        if len(value) <= 0:
            raise ValueError("You must provide at least one section")
        return value


class AssessmentOutputConfig(BaseModel):
    # P2: add sequence | parallel
    codes: list[str]  # Needs to be defined in output_configs


class AssessmentConfigFile(BaseModel):
    """
    Validates the complete YAML structure for assessment configuration files.
    This model is used for file validation only. The actual database storage
    uses the AssessmentConfig SQLModel (in app/models/assessment_config.py).
    """

    # Freeze and prevent accidentally changing the config once loaded
    model_config = ConfigDict(frozen=True)

    metadata: AssessmentMetadata
    intake: Union[IntakeConfig, IntakeConfigConversation] = Field(
        discriminator="intake_type"
    )
    outputs: AssessmentOutputConfig
