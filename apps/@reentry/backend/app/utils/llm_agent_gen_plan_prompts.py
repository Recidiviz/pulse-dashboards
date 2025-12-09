from langchain_core.messages import HumanMessage

from app.core.data_config.output_configs.output_config import ActionPlanPromptsConfig
from app.services.resources import Resource


def format_resources_for_display(resources: list[Resource]) -> str:
    """Format a list of resources for display in prompts."""
    formatted_output = ""

    for i, resource in enumerate(resources, 1):
        formatted_output += f"\n{i}. {resource.name} (ID: {resource.id})\n"
        formatted_output += (
            "   " + "=" * (len(resource.name) + len(resource.id) + 6) + "\n"
        )

        formatted_output += f"   Category: {resource.category.value}"
        if resource.subcategory:
            formatted_output += f" > {resource.subcategory.value}"
        formatted_output += "\n"

        if resource.description:
            formatted_output += f"   Description: {resource.description}\n"

        # Contact Information
        contact_info = []
        if resource.phone:
            contact_info.append(f"Phone: {resource.phone}")
        if resource.email:
            contact_info.append(f"Email: {resource.email}")
        if resource.website:
            contact_info.append(f"Website: {resource.website}")
        if contact_info:
            formatted_output += "   Contact:\n"
            for info in contact_info:
                formatted_output += f"   - {info}\n"

        if resource.address:
            formatted_output += f"   Location: {resource.address}\n"

        # Ratings and Status (if available)
        ratings_info = []
        if resource.rating:
            ratings_info.append(
                f"Rating: {resource.rating}/5 ({resource.ratingCount} reviews)"
            )

        if ratings_info:
            formatted_output += "   Additional Information:\n"
            for info in ratings_info:
                formatted_output += f"   - {info}\n"

        formatted_output += "\n"

    return formatted_output


class ActionPlanPrompts:
    """Manages prompts for action plan generation with optional config overrides."""

    def __init__(self, config: ActionPlanPromptsConfig):
        self.config = config

    def get_system_message(self) -> str:
        """Return the system message for action plan generation."""
        return self.config.system

    def get_section_generation_prompt_with_resources(
        self, section: str, resources: list[Resource]
    ) -> HumanMessage:
        """Generate prompt for section generation when resources are available."""
        content = self.config.section_generation_with_resources.format(
            section=section,
            resources=format_resources_for_display(resources),
        )
        return HumanMessage(content=content)

    def get_section_generation_prompt_without_resources(
        self, section: str
    ) -> HumanMessage:
        """Generate prompt for section generation when no resources are available."""
        content = self.config.section_generation_without_resources.format(
            section=section
        )
        return HumanMessage(content=content)

    def get_section_annotations_prompt(
        self, section: str, section_content: str
    ) -> HumanMessage:
        """Generate prompt for getting annotations and notes for a section."""
        content = self.config.section_annotations.format(
            section=section,
            section_content=section_content,
        )
        return HumanMessage(content=content)

    def get_section_refinement_prompt(self, section: str) -> HumanMessage:
        """Generate prompt for refining section content."""
        content = self.config.section_refinement.format(section=section)
        return HumanMessage(content=content)

    def get_reflexion_prompt_initial(self) -> HumanMessage:
        """Generate prompt for initial reflexion on the action plan."""
        return HumanMessage(content=self.config.reflexion_initial)

    def get_reflexion_prompt_with_previous_sections(
        self, previous_sections: list[str]
    ) -> HumanMessage:
        """Generate prompt for reflexion when previous sections exist."""
        content = self.config.reflexion_with_previous_sections.format(
            previous_sections=", ".join(previous_sections)
        )
        return HumanMessage(content=content)

    def get_area_of_needs_prompt(self) -> HumanMessage:
        """Generate prompt for compiling areas of needs/risk."""
        return HumanMessage(content=self.config.area_of_needs)

    def get_resources_options_prompt(self) -> HumanMessage:
        """Generate prompt for identifying resource options."""
        return HumanMessage(content=self.config.resources_options)

    def get_timeline_generation_prompt(self) -> HumanMessage:
        """Generate prompt for timeline generation."""
        return HumanMessage(content=self.config.timeline_generation)

    def get_timeline_format_prompt(self) -> HumanMessage:
        """Generate prompt for formatting timeline."""
        return HumanMessage(content=self.config.timeline_format)

    def get_milestones_generation_prompt(self) -> HumanMessage:
        """Generate prompt for milestones generation."""
        return HumanMessage(content=self.config.milestones_generation)

    def get_milestones_refinement_prompt(self) -> HumanMessage:
        """Generate prompt for refining milestones."""
        return HumanMessage(content=self.config.milestones_refinement)

    def get_milestones_format_prompt(self) -> HumanMessage:
        """Generate prompt for formatting milestones."""
        return HumanMessage(content=self.config.milestones_format)

    def get_action_plan_generation_prompt(self) -> HumanMessage:
        """Generate prompt for action plan generation."""
        return HumanMessage(content=self.config.action_plan_generation)

    def get_initial_user_prompt(
        self, client_data: str, address: str, decision_tree_statements: str | None
    ) -> str:
        """Generate the initial user prompt with client data and decision tree statements."""
        # Use custom template from config
        return self.config.data_template.format(
            client_data=client_data,
            address=address,
            decision_tree_statements=decision_tree_statements or "",
        )
