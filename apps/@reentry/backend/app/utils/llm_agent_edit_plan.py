from textwrap import dedent
from typing import Literal

import structlog
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, START, StateGraph
from langgraph.types import Send
from pydantic import BaseModel, Field

from app.core.config import create_model_from_config, tracer
from app.core.data_config.output_configs.output_config import ActionPlanConfigFile
from app.services.resources import Resource
from app.utils.action_plan_types import (
    ActionPlan,
    ActionPlanMarkdown,
    ActionPlanMilestones,
    ActionPlanPartial,
    ActionPlanSection,
    ActionPlanSectionPartial,
    ActionPlanTimelines,
    CommonMessagesState,
)
from app.utils.CustomMetricsCallbackHandler import CustomMetricsCallbackHandler
from app.utils.regex import extract_uuids_from_links

from .llm_agent_edit_plan_prompts import ActionPlanEditPrompts
from .llm_agent_gen_plan import ActionPlanPrompts, call_generate_section
from .llm_retry_config import DEFAULT_MAX_RETRIES, ERRORS_TO_RETRY_ON
from .llm_tools import convert_to_markdown

logger = structlog.get_logger(__name__)


### Graph state
class ExtendedMessagesState(CommonMessagesState):
    current_sections: list[ActionPlanSection] = []


class SectionAction(BaseModel):
    title: str | None = Field(
        description="The title of the section to add, remove or change, from the previous sections list"
    )
    action: (
        Literal["add"]
        | Literal["remove"]
        | Literal["change_content"]
        | Literal["change_title_and_content"]
    ) = Field(description="The action to perform on the section")
    new_title: str | None = Field(
        description="The new title of the section, if the action is 'change_title_and_content', or if the section is to be added"
    )


class RegenerationAction(BaseModel):
    section_changes: list[SectionAction]


### Transition functions


def call_generate_sections(
    state: ExtendedMessagesState,
) -> Literal["section", "section-change", "timeline"]:
    if not state["sections_to_generate"]:
        return "timeline"
    return [
        Send(
            "section" if section["action"] == "add" else "section-change",
            {
                "messages": state["messages"],
                "section_to_generate": section["title"],
                "current_sections": state["current_sections"],
            },
        )
        for section in state["sections_to_generate"]
    ]


class LLMAgentEdit:
    initial_call = True
    custom_metrics_callback = CustomMetricsCallbackHandler(prefix="llm_regenerations")

    def __init__(
        self,
        messages,
        current_sections: list[ActionPlanSection],
        suggested_resources: list[Resource],
        thread_id,
        client_address: str,
        current_timeline: ActionPlanTimelines | None = None,
        current_milestones: ActionPlanMilestones | None = None,
        action_plan_config: ActionPlanConfigFile | None = None,
    ):
        self.config = {
            "configurable": {"thread_id": thread_id},
            "callbacks": [self.custom_metrics_callback],
        }
        if tracer:
            self.config["callbacks"].append(tracer)
        self.messages = messages
        self.current_sections = current_sections[:]
        self.previous_sections = current_sections[:]
        self.suggested_resources = suggested_resources
        self.current_timeline = current_timeline
        self.current_milestones = current_milestones
        self.client_address = client_address

        # Require config
        if not action_plan_config:
            raise ValueError(
                "action_plan_config is required - cannot edit plan without configuration"
            )

        # Initialize prompts with config
        self.gen_prompts = ActionPlanPrompts(action_plan_config.prompts)
        self.edit_prompts = ActionPlanEditPrompts(action_plan_config.prompts)

        # Extract structure flags from config
        self.include_timeline = action_plan_config.structure.timeline
        self.include_milestones = action_plan_config.structure.milestones

        # Initialize model from config
        self.model = create_model_from_config(
            action_plan_config.model.provider,
            action_plan_config.model.name,
            action_plan_config.model.version,
        )

        async def call_select_starting_node(state: ExtendedMessagesState):
            logger.debug("Selecting starting node")
            sections = state["current_sections"]
            sections_titles = ", ".join([s.title for s in sections])
            message = self.edit_prompts.get_section_selection_prompt(sections_titles)
            logger.debug(message.content)
            response = (
                await self.model.with_structured_output(RegenerationAction)
                .with_retry(
                    stop_after_attempt=DEFAULT_MAX_RETRIES,
                    retry_if_exception_type=ERRORS_TO_RETRY_ON,
                )
                .ainvoke(state["messages"] + [message], self.config)
            )
            logger.debug("Actions", action=response.section_changes)

            # when re-generation is asked, we remove the previously saved section...
            actions_to_remove = ["remove", "change_title_and_content", "change_content"]
            titles_to_remove = [
                s.title
                for s in response.section_changes
                if s.action in actions_to_remove
            ]

            actions_to_generate = ["add", "change_content", "change_title_and_content"]

            # prevent duplication of sections when user asks to add a section that already exists
            state["current_sections"] = [
                s for s in state["current_sections"] if s.title not in titles_to_remove
            ]
            generated_sections_titles = [s.title for s in state["current_sections"]]

            # ... and generate it again
            state["sections_to_generate"] = [
                {"title": s.new_title or s.title, "action": s.action}
                for s in response.section_changes
                if s.action in actions_to_generate
                and (s.new_title or s.title) not in generated_sections_titles
            ]
            logger.debug("Sections to generate", sections=state["sections_to_generate"])

            return state

        async def call_generate_section_change(state: ExtendedMessagesState):
            section = state["section_to_generate"]
            logger.debug("(Re)-generating section", section=section)

            result_messages = []
            messages = state["messages"]

            # Get annotations and notes from the previous generation
            # find the previous section by title (use variable section) from the state["current_sections"]
            previous_section: ActionPlanSection | None = None
            for current_section in self.previous_sections:
                if current_section.title == section:
                    previous_section = current_section
                    break

            clean_markdown_content = (
                previous_section.markdown_content
                if previous_section and previous_section.markdown_content
                else ""
            )
            prompt = self.edit_prompts.get_section_change_prompt(
                section, self.extra_instructions, clean_markdown_content
            )

            response = await self.model.with_retry(
                stop_after_attempt=DEFAULT_MAX_RETRIES,
                retry_if_exception_type=ERRORS_TO_RETRY_ON,
            ).ainvoke(messages + [prompt], self.config)
            result_messages.append(response)

            if previous_section is None:
                logger.warning(f"No previous annotations found for section: {section}")
                previous_section = ActionPlanSectionPartial(annotations=[])

            resource_ids = extract_uuids_from_links(response.content)
            resources = []
            for resource_id in resource_ids:
                for resource in self.suggested_resources:
                    if resource.id == resource_id:
                        resources.append(resource)
                        break

            # Save the section
            action_plan_section = ActionPlanSection(
                title=section,
                markdown_content=response.content,
                annotations=previous_section.annotations,
                notes=previous_section.notes,
                resources=resources,
            )

            return {
                "generated_sections": [action_plan_section],
                "messages": result_messages,
            }

        async def _call_generate_section(state: ExtendedMessagesState):
            return await call_generate_section(
                self.config, state, self.client_address, self.gen_prompts, self.model
            )

        async def call_generate_timeline(state: ExtendedMessagesState):
            logger.debug("Generating timeline")
            messages = state["messages"]
            messages.append(
                self.edit_prompts.get_timeline_edit_prompt(self.extra_instructions)
            )

            response = await self.model.with_retry(
                stop_after_attempt=DEFAULT_MAX_RETRIES,
                retry_if_exception_type=ERRORS_TO_RETRY_ON,
            ).ainvoke(messages, self.config)
            messages.append(response)

            timeline = (
                await self.model.with_structured_output(ActionPlanTimelines)
                .with_retry(
                    stop_after_attempt=DEFAULT_MAX_RETRIES,
                    retry_if_exception_type=ERRORS_TO_RETRY_ON,
                )
                .ainvoke(state["messages"], self.config)
            )

            if timeline:
                state["generated_timeline"] = timeline

            return state

        async def call_generate_milestones(state: ExtendedMessagesState):
            logger.debug("Generating milestones")
            messages = state["messages"]
            messages.append(
                self.edit_prompts.get_milestones_edit_prompt(self.extra_instructions)
            )

            response = await self.model.with_retry(
                stop_after_attempt=DEFAULT_MAX_RETRIES,
                retry_if_exception_type=ERRORS_TO_RETRY_ON,
            ).ainvoke(messages, self.config)
            messages.append(response)

            milestones = (
                await self.model.with_structured_output(ActionPlanMilestones)
                .with_retry(
                    stop_after_attempt=DEFAULT_MAX_RETRIES,
                    retry_if_exception_type=ERRORS_TO_RETRY_ON,
                )
                .ainvoke(state["messages"], self.config)
            )

            if milestones:
                state["generated_milestones"] = milestones

            return state

        async def call_generate_action_plan(state: ExtendedMessagesState):
            logger.debug("Generating action plan")

            message = self.edit_prompts.get_action_plan_generation_prompt()
            state["messages"].append(message)
            response = (
                await self.model.with_structured_output(ActionPlanPartial)
                .with_retry(
                    stop_after_attempt=DEFAULT_MAX_RETRIES,
                    retry_if_exception_type=ERRORS_TO_RETRY_ON,
                )
                .ainvoke(state["messages"], self.config)
            )
            state["plan"] = response
            state["messages"].append(AIMessage(content=response.json()))

            return state

        ### Graph definition
        # Define a new graph
        workflow = StateGraph(ExtendedMessagesState)

        # Create a new plan
        workflow.add_node("section", _call_generate_section)
        workflow.add_node("section-change", call_generate_section_change)
        workflow.add_node("assemble", call_generate_action_plan)
        workflow.add_node("select_starting_node", call_select_starting_node)

        # Conditionally add timeline and milestones nodes
        if self.include_timeline:
            workflow.add_node("timeline", call_generate_timeline)
        if self.include_milestones:
            workflow.add_node("milestones", call_generate_milestones)

        # Links
        workflow.add_edge(START, "select_starting_node")
        workflow.add_conditional_edges("select_starting_node", call_generate_sections)

        # Determine the target after section nodes based on enabled features
        if self.include_timeline and self.include_milestones:
            workflow.add_edge("section", "timeline")
            workflow.add_edge("section-change", "timeline")
            workflow.add_edge("timeline", "milestones")
            workflow.add_edge("milestones", "assemble")
        elif self.include_timeline and not self.include_milestones:
            workflow.add_edge("section", "timeline")
            workflow.add_edge("section-change", "timeline")
            workflow.add_edge("timeline", "assemble")
        elif not self.include_timeline and self.include_milestones:
            workflow.add_edge("section", "milestones")
            workflow.add_edge("section-change", "milestones")
            workflow.add_edge("milestones", "assemble")
        else:
            # Neither timeline nor milestones enabled
            workflow.add_edge("section", "assemble")
            workflow.add_edge("section-change", "assemble")

        workflow.add_edge("assemble", END)

        self.graph = workflow.compile()

    async def generate(
        self,
        extra_instructions: str,
        resource_to_add: Resource | None = None,
        resource_to_remove_id: str | None = None,
    ):
        # Use the Runnable
        user_prompt = dedent(f"""
        ---
        Extra instructions to apply on this action plan: {extra_instructions}
        ---
        """)
        self.messages.append(HumanMessage(content=user_prompt))
        self.extra_instructions = extra_instructions
        logger.debug(
            "Applying extra instructions", extra_instructions=extra_instructions
        )
        if resource_to_add:
            self.suggested_resources.append(resource_to_add)

        if resource_to_add or resource_to_remove_id:
            logger.debug(
                "Applying resource changes",
                resource_to_add_id=resource_to_add.id,
                resource_to_remove_id=resource_to_remove_id,
            )

        events = self.graph.astream(
            {
                "messages": self.messages,
                "sections_to_generate": [],
                "current_sections": self.current_sections,
                "generated_sections": [],
                "plan": None,
                "generated_timeline": self.current_timeline,
                "generated_milestones": self.current_milestones,
                "suggested_resources": self.suggested_resources,
            },
            self.config,
            stream_mode="values",
        )

        # iterate over the events just for debugging, it allow us to have nice messages
        # and keep the last event as final_state
        final_state = None
        async for event in events:
            message = event["messages"][-1]
            message.pretty_print()
            final_state = event

        # Merge section in the preferred order given by the plan
        # Process all sections in order, keeping the latest version of each title
        sections_by_title = {}
        for section in (
            final_state["current_sections"] + final_state["generated_sections"]
        ):
            sections_by_title[section.title] = section
        # Build the final ordered list
        try:
            sections_order = final_state["plan"].sections_order
        except Exception:
            # Previous generated plan may not have sections order
            sections_order = []
        generated_sections = []
        for title in sections_order:
            if title in sections_by_title:
                generated_sections.append(sections_by_title.pop(title))
        # Append any remaining new sections at the end
        generated_sections.extend(sections_by_title.values())

        # Conditionally include timeline and milestones based on config flags
        self.plan = ActionPlan(
            immediate_needs=final_state["plan"].immediate_needs,
            milestones=(
                final_state["generated_milestones"].milestones
                if self.include_milestones and final_state.get("generated_milestones")
                else []
            ),
            timeline=(
                final_state["generated_timeline"].timelines
                if self.include_timeline and final_state.get("generated_timeline")
                else []
            ),
            quick_summary_circumstances=final_state["plan"].quick_summary_circumstances,
            overview=final_state["plan"].overview,
            sections=generated_sections,
            sections_order=final_state["plan"].sections_order,
        )
        self.messages = final_state["messages"]
        self.current_sections = generated_sections

        return ActionPlanMarkdown(
            messages=self.messages,
            user_prompt=user_prompt,
            action_plan=convert_to_markdown(self.plan),
            structured_action_plan=self.plan,
            suggested_resources=self.suggested_resources,
        )
