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
    system: str


class IntakeSummaryPromptsConfig(PromptsConfig):
    system: str = Field(
        description="System message for intake summary. Variables: {Conversation}, {Assessments}",
    )
    template: str = Field(
        description="Summary generation prompt template. Variables: {Conversation}, {assessment}",
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
        description="Initial user prompt template. Variables: {client_data}, {decision_tree_statements}",
    )

    # Reflexion phase
    reflexion_initial: str
    reflexion_with_previous_sections: str = Field(
        description="Prompt for reflexion when previous sections exist. Variables: {previous_sections}",
    )

    # Area identification
    area_of_needs: str
    resources_options: str

    # Section generation
    section_generation_with_resources: str = Field(
        description="Prompt for generating section content when resources are available. Variables: {section}, {resources}",
    )
    section_generation_without_resources: str = Field(
        description="Prompt for generating section content when no resources are available. Variables: {section}",
    )
    section_annotations: str = Field(
        description="Prompt for getting annotations and notes for a section. Variables: {section}, {section_content}",
    )
    section_refinement: str = Field(
        description="Prompt for refining section content. Variables: {section}",
    )

    # Timeline generation
    timeline_generation: str = Field(
        description="If timeline field is false, this will not be used",
    )
    timeline_format: str = Field(
        description="If timeline field is false, this will not be used",
    )

    # Milestones generation
    milestones_generation: str = Field(
        description="If milestone field is false, this will not be used",
    )
    milestones_refinement: str = Field(
        description="If milestone field is false, this will not be used",
    )
    milestones_format: str = Field(
        description="If milestone field is false, this will not be used",
    )

    # Final assembly
    action_plan_generation: str

    # Edit-specific prompts
    edit_section_selection: str = Field(
        description="Prompt for selecting which sections to modify. Variables: {sections_titles}",
    )
    edit_section_change: str = Field(
        description="Prompt for modifying existing section content. Variables: {section}, {extra_instructions}, {clean_markdown_content}",
    )
    edit_timeline: str = Field(
        description="Prompt for editing timeline. Variables: {extra_instructions}. If milestone field is false, this will not be used"
    )
    edit_milestones: str = Field(
        description="Prompt for editing milestones. Variables: {extra_instructions}. If milestone field is false, this will not be used",
    )
    edit_action_plan_generation: str = Field(
        description="Prompt for final action plan assembly during edit"
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
