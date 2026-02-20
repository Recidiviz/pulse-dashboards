from langchain_core.messages import HumanMessage

from app.core.data_config.output_configs.output_config import ActionPlanPromptsConfig
from app.utils.template_formatter import SafeTemplateFormatter


class ActionPlanEditPrompts:
    """Manages prompts for action plan editing with optional config overrides."""

    def __init__(self, config: ActionPlanPromptsConfig):
        self.config = config
        self.formatter = SafeTemplateFormatter()

    def get_section_selection_prompt(self, sections_titles: str) -> HumanMessage:
        """Generate prompt for selecting which sections to modify."""
        content = self.formatter.format(
            self.config.edit_section_selection, sections_titles=sections_titles
        )
        return HumanMessage(content=content)

    def get_section_change_prompt(
        self, section: str, extra_instructions: str, clean_markdown_content: str
    ) -> HumanMessage:
        """Generate prompt for modifying an existing section."""
        content = self.formatter.format(
            self.config.edit_section_change,
            section=section,
            extra_instructions=extra_instructions,
            clean_markdown_content=clean_markdown_content,
        )
        return HumanMessage(content=content)

    def get_timeline_edit_prompt(self, extra_instructions: str) -> HumanMessage:
        """Generate prompt for editing timeline."""
        content = self.formatter.format(
            self.config.edit_timeline, extra_instructions=extra_instructions
        )
        return HumanMessage(content=content)

    def get_milestones_edit_prompt(self, extra_instructions: str) -> HumanMessage:
        """Generate prompt for editing milestones."""
        content = self.formatter.format(
            self.config.edit_milestones, extra_instructions=extra_instructions
        )
        return HumanMessage(content=content)

    def get_action_plan_generation_prompt(self) -> HumanMessage:
        """Generate prompt for final action plan assembly."""
        return HumanMessage(content=self.config.edit_action_plan_generation)
