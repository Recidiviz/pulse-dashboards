import operator
from typing import Annotated, Literal

from langgraph.graph import MessagesState
from pydantic import BaseModel, Field

from app.services.resources import Resource, ResourceCategory, ResourceSubcategory


### Result Types
class Annotation(BaseModel):
    source: str = Field(
        description="The source of the annotation (for eg: Client intake, Client intake summary, Decision tree)"
    )
    source_location: str = Field(
        description="The location of the annotation in the source (for eg: name of the section, name of the decision tree, or just 'conversation' if it's a conversation)"
    )
    source_text_extract: str = Field(
        description="Text extract from the source, but not the full paragraph (for eg: ...but i'm struggling with housing...)"
    )


class ActionPlanSectionResourceTypes(BaseModel):
    section_title: str = Field(description="Name of the section")
    categories: list[ResourceCategory] = Field(
        description="List of resource categories to look for this section"
    )
    subcategories: list[ResourceSubcategory] = Field(
        description="List of resource subcategories to look for this section"
    )


class ActionPlanResourcesAssociations(BaseModel):
    associations: list[ActionPlanSectionResourceTypes] = Field(
        description="List of resource types to look for each section"
    )


class ActionPlanSectionPartial(BaseModel):
    annotations: list[Annotation] = Field(
        description="If the reasoning reference that informed this section includes source documents, the annotations should be provided here"
    )
    notes: str | None = Field(
        description="Optional notes at the destination of the case worker only"
        "Indicate if you didn't found any resources to help the client.",
        default=None,
    )


class ActionPlanSection(ActionPlanSectionPartial):
    title: str = Field(description="The title of the section")
    markdown_content: str = Field(
        description=(
            "Result of your previous reasoning in Markdown."
            "1. Always reference a resource using markdown link [name of the resource](#id), the id will be then included in the resources section."
            "2. Explain first the intention of the section, then introduce an action plan to address the needs or risks of the section."
            "3. Include both short and long term plan, or only long term is there is no short term."
        )
    )
    resources: list[Resource] = Field(
        description="The resources cited in the section", default=[]
    )


class ActionPlanMilestone(BaseModel):
    date: str = Field(description="The date of the milestone (Week 1, Week 2, ...)")
    title: str = Field(description="The title of the milestone")
    markdown_content: str = Field(
        description="Description of the milestone in markdown, 1 item list minimum"
    )
    notes: str | None = Field(
        description="Optional notes at the destination of the case worker"
    )


class ActionPlanMilestones(BaseModel):
    milestones: list[ActionPlanMilestone] = Field(
        description="Milestones for the client"
    )


class ActionPlanTimeline(BaseModel):
    date: str = Field(
        description="The date of the timeline, enumeration week-by-week, then month-by-month after 2mo"
    )
    markdown_content: str = Field(description="The markdown content of the timeline")
    notes: str | None = Field(
        description="Optional notes at the destination of the case worker", default=None
    )


class ActionPlanImmediateNeed(ActionPlanSectionPartial):
    title: str = Field(
        description="The title of the section (should be 'Immediate Need' except if instructed otherwise)"
    )
    markdown_content: str = Field(
        description=(
            "A paragraph markdown-formatted describing the immediate need of the client: "
            "Which issues should be addressed urgently to create the stability necessary for success"
        )
    )


class ActionPlanTimelines(BaseModel):
    timelines: list[ActionPlanTimeline] = Field(description="Timeline for the client")


class ActionPlanPartial(BaseModel):
    immediate_needs: ActionPlanImmediateNeed = Field(
        description="The immediate needs of the client"
    )

    quick_summary_circumstances: str = Field(
        description="A quick summary of the client's circumstances, in one or two paragraph. "
        "Starts with 'Based on your intake assessments, '"
    )
    overview: str = Field(
        description="An overview of the action plan. "
        "Include all sections title and a quick description of each section of area of needs."
        "Start the overview with 'This action plan consists of xxx components: '"
        "followed by a list of '1. **Section Title**: Description of the section', one by line."
    )
    sections_order: list[str] = Field(
        description="List the sections title in the order you're mentioning them in the overview"
    )


class ActionPlan(ActionPlanPartial):
    sections: list[ActionPlanSection] = Field(
        description="The plans by section, where each is specific to an area of needs or risks"
    )
    milestones: list[ActionPlanMilestone] = Field(
        description="Milestones for the client"
    )
    timeline: list[ActionPlanTimeline] = Field(description="Timeline for the client")


class AreaOfRiskNeeds(BaseModel):
    sections: list[str] = Field(description="List of areas of needs or risks")


class ActionPlanMarkdown(BaseModel):
    """
    Used to store the markdown content of the action plan
    """

    user_prompt: str
    action_plan: str
    messages: list  # openai-like messages
    structured_action_plan: ActionPlan  # structured action plan as ActionPlan
    suggested_resources: list[Resource]  # list of suggested resources


#
# Common workflow state for gen and edit
#


class CommonMessagesState(MessagesState):
    sections_to_generate: list[str] | None
    section_to_generate: str | None
    generated_sections: Annotated[list[ActionPlanSection], operator.add]
    plan: ActionPlanPartial | None
    generated_timeline: ActionPlanTimelines | None
    generated_milestones: ActionPlanMilestones | None


class TranscriptionMessage(BaseModel):
    role: Literal["client", "caseworker"]
    content: str


