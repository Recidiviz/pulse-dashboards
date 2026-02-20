from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.core.data_config.assessment_configs.assessment_config import (
    Metadata,
    ModelConfig,
)
from app.models.output_config import OutputType


class OutputMetadata(Metadata):
    output_type: OutputType


class PlanMetadata(OutputMetadata):
    output_type: Literal["action_plan"]


class SummaryMetadata(OutputMetadata):
    output_type: Literal["intake_summary"]


class ExternalApiConfig(BaseModel):
    resources_pipeline_enabled: bool


class PromptsConfig(BaseModel):
    system: str = Field(
        description="System message for the LLM",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )


class IntakeSummaryPromptsConfig(PromptsConfig):
    system: str = Field(
        description="System message for intake summary",
        json_schema_extra={
            "available_variables": ["Conversation"],
            "required_variables": ["Conversation"],
        },
    )
    template: str = Field(
        description="Summary generation prompt template",
        json_schema_extra={
            "available_variables": ["Conversation"],
            "required_variables": ["Conversation"],
        },
    )


class SectionConfig(BaseModel):
    id: str
    title: str


class IntakeSummaryConfigFile(BaseModel):
    """
    Validates YAML files for intake_summary output type.
    This model is used for file validation only. The actual database storage
    uses the OutputConfig SQLModel (in app/models/output_config.py).
    """

    model_config = ConfigDict(frozen=True)

    metadata: SummaryMetadata
    prompts: IntakeSummaryPromptsConfig
    model: ModelConfig


class StructureConfig(BaseModel):
    timeline: bool = False
    milestones: bool = False


class ActionPlanPromptsConfig(PromptsConfig):
    """Extended prompts configuration for action plan generation."""

    # Initial setup
    data_template: str = Field(
        description="Initial user prompt template",
        json_schema_extra={
            "available_variables": [
                "client_data",
                "address",
                "decision_tree_statements",
            ],
            "required_variables": ["client_data"],
        },
    )

    # Reflexion phase
    reflexion_initial: str = Field(
        description="Prompt for initial reflexion on the action plan",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )
    reflexion_with_previous_sections: str = Field(
        description="Prompt for reflexion when previous sections exist",
        json_schema_extra={
            "available_variables": ["previous_sections"],
            "required_variables": ["previous_sections"],
        },
    )

    # Area identification
    area_of_needs: str = Field(
        description="Prompt for compiling areas of needs/risk",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )
    resources_options: str = Field(
        description="Prompt for identifying resource options",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )

    # Section generation
    section_generation_with_resources: str = Field(
        description="Prompt for generating section content when resources are available",
        json_schema_extra={
            "available_variables": ["section", "resources"],
            "required_variables": ["section", "resources"],
        },
    )
    section_generation_without_resources: str = Field(
        description="Prompt for generating section content when no resources are available",
        json_schema_extra={
            "available_variables": ["section"],
            "required_variables": ["section"],
        },
    )
    section_annotations: str = Field(
        description="Prompt for getting annotations and notes for a section",
        json_schema_extra={
            "available_variables": ["section", "section_content"],
            "required_variables": ["section", "section_content"],
        },
    )
    section_refinement: str = Field(
        description="Prompt for refining section content",
        json_schema_extra={
            "available_variables": ["section"],
            "required_variables": ["section"],
        },
    )

    # Timeline generation
    timeline_generation: str = Field(
        description="Prompt for timeline generation (if timeline field is true)",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )
    timeline_format: str = Field(
        description="Prompt for formatting timeline (if timeline field is true)",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )

    # Milestones generation
    milestones_generation: str = Field(
        description="Prompt for milestones generation (if milestone field is true)",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )
    milestones_refinement: str = Field(
        description="Prompt for refining milestones (if milestone field is true)",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )
    milestones_format: str = Field(
        description="Prompt for formatting milestones (if milestone field is true)",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )

    # Final assembly
    action_plan_generation: str = Field(
        description="Prompt for final action plan assembly",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )

    # Edit-specific prompts
    edit_section_selection: str = Field(
        description="Prompt for selecting which sections to modify",
        json_schema_extra={
            "available_variables": ["sections_titles"],
            "required_variables": ["sections_titles"],
        },
    )
    edit_section_change: str = Field(
        description="Prompt for modifying existing section content",
        json_schema_extra={
            "available_variables": [
                "section",
                "extra_instructions",
                "clean_markdown_content",
            ],
            "required_variables": [
                "section",
                "extra_instructions",
                "clean_markdown_content",
            ],
        },
    )
    edit_timeline: str = Field(
        description="Prompt for editing timeline (if milestone field is true)",
        json_schema_extra={
            "available_variables": ["extra_instructions"],
            "required_variables": ["extra_instructions"],
        },
    )
    edit_milestones: str = Field(
        description="Prompt for editing milestones (if milestone field is true)",
        json_schema_extra={
            "available_variables": ["extra_instructions"],
            "required_variables": ["extra_instructions"],
        },
    )
    edit_action_plan_generation: str = Field(
        description="Prompt for final action plan assembly during edit",
        json_schema_extra={
            "available_variables": [],
            "required_variables": [],
        },
    )


class ActionPlanConfigFile(BaseModel):
    """
    Validates YAML files for action_plan output type.
    This model is used for file validation only. The actual database storage
    uses the OutputConfig SQLModel (in app/models/output_config.py).
    """

    model_config = ConfigDict(frozen=True)

    metadata: PlanMetadata
    prompts: ActionPlanPromptsConfig
    structure: StructureConfig
    model: ModelConfig
    small_model: ModelConfig
    external_api: ExternalApiConfig
