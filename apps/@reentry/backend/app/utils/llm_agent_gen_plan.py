from typing import Literal

import structlog
from langchain_core.messages import AIMessage
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.types import RetryPolicy, Send
from langsmith import traceable
from pydantic import ValidationError

from app.core.config import create_model_from_config
from app.core.data_config.output_configs.output_config import ActionPlanConfigFile
from app.utils.action_plan_types import (
    ActionPlan,
    ActionPlanMarkdown,
    ActionPlanMilestones,
    ActionPlanPartial,
    ActionPlanResourcesAssociations,
    ActionPlanSection,
    ActionPlanSectionPartial,
    ActionPlanTimelines,
    AreaOfRiskNeeds,
    CommonMessagesState,
)
from app.utils.CustomMetricsCallbackHandler import CustomMetricsCallbackHandler
from app.utils.langsmith_utils import build_langsmith_config

from .llm_agent_gen_plan_prompts import ActionPlanPrompts
from .llm_retry_config import DEFAULT_MAX_RETRIES, ERRORS_TO_RETRY_ON
from .llm_tools import convert_to_markdown

logger = structlog.get_logger(__name__)


### Graph state
class ExtendedMessagesState(CommonMessagesState):
    resources_associations: ActionPlanResourcesAssociations | None = None


### Transition functions
def call_generate_sections(state: ExtendedMessagesState) -> Literal["gen_section"]:
    return [
        Send(
            "gen_section",
            {
                "messages": state["messages"],
                "section_to_generate": section,
                "resources_associations": (
                    state["resources_associations"]
                    if state.get("resources_associations")
                    else None
                ),
            },
        )
        for section in state["sections_to_generate"]
    ]


@traceable(name="call_generate_section")
async def call_generate_section(
    config: dict,
    state: ExtendedMessagesState,
    client_address: str,
    prompts: ActionPlanPrompts,
    model,
):
    # This function is shared with LLMAgentEdit
    section = state["section_to_generate"]
    logger.debug("Generating section", section=section)
    if not section:
        raise ValueError("Error generating section")

    message = prompts.get_unified_section_generation_prompt(section)

    result_messages = []
    messages = state["messages"] + [message]

    try:
        response = (
            await model.with_structured_output(ActionPlanSection)
            .with_retry(
                stop_after_attempt=DEFAULT_MAX_RETRIES,
                retry_if_exception_type=ERRORS_TO_RETRY_ON,
            )
            .ainvoke(messages, config)
        )
    except Exception as error:
        logger.error(
            "Failed to generate unified section content",
            section=section,
            error=str(error),
        )

    result_messages.append(AIMessage(content=response.json()))

    # Deduplicate annotations by exact quote text before saving
    seen: set[str] = set()
    unique_annotations = []
    for ann in response.annotations:
        if ann.source_text_extract not in seen:
            seen.add(ann.source_text_extract)
            unique_annotations.append(ann)

    # Save the section
    action_plan_section = ActionPlanSection(
        title=section,
        markdown_content=response.markdown_content,
        annotations=unique_annotations,
        notes=response.notes,
        resources=[],
    )

    logger.info(
        "Section generation completed",
        section=section,
    )

    return {
        "generated_sections": [action_plan_section],
        "messages": result_messages,
    }


class LLMAgentGenerate:
    initial_call = True
    custom_metrics_callback = CustomMetricsCallbackHandler(prefix="llm_plan_creation")

    def __init__(
        self,
        client_data,
        decision_tree_statements,
        client_address,
        previous_sections: list[str] | None,
        thread_id,
        action_plan_config: ActionPlanConfigFile | None = None,
        client_pseudo_id: str | None = None,
    ):
        self.client_data = client_data
        self.decision_tree_statements = decision_tree_statements
        self.client_address = client_address
        self.previous_sections = previous_sections

        # Require config
        if not action_plan_config:
            raise ValueError(
                "action_plan_config is required - cannot generate plan without configuration"
            )

        # Initialize prompts with config
        self.prompts = ActionPlanPrompts(action_plan_config.prompts)

        # Extract structure flags from config
        self.include_timeline = action_plan_config.structure.timeline
        self.include_milestones = action_plan_config.structure.milestones
        self.include_resources = (
            action_plan_config.external_api.resources_pipeline_enabled
        )

        self.model = create_model_from_config(
            action_plan_config.model.provider,
            action_plan_config.model.name,
            action_plan_config.model.version,
        )

        # Store for error handling context
        self.client_pseudo_id = client_pseudo_id

        # Create semantic thread_id for LangSmith legibility
        thread_id_str = str(thread_id) if thread_id else "unknown"
        client_id_suffix = f"-{client_pseudo_id[:8]}" if client_pseudo_id else ""
        semantic_thread_id = f"plan-gen-{thread_id_str}{client_id_suffix}"

        self.run_name = "ActionPlan-Generate"

        # Build config with LangSmith metadata and tags
        self.config = build_langsmith_config(
            thread_id=semantic_thread_id,
            run_name=self.run_name,
            callbacks=[self.custom_metrics_callback],
            client_pseudo_id=client_pseudo_id,
            plan_id=str(thread_id) if thread_id else None,
            workflow_type="plan_generation",
            model_provider=action_plan_config.model.provider,
            model_name=action_plan_config.model.name,
        )

        ### llm calls
        async def call_reflexion(state: ExtendedMessagesState):
            logger.debug("Self reflexion on the action plan")

            if not self.previous_sections:
                # first original generation
                message = self.prompts.get_reflexion_prompt_initial()
            else:
                # It's a forced-generation, but let's try to keep the same section
                message = self.prompts.get_reflexion_prompt_with_previous_sections(
                    self.previous_sections
                )
            state["messages"].append(message)

            response = await self.model.with_retry(
                stop_after_attempt=DEFAULT_MAX_RETRIES,
                retry_if_exception_type=ERRORS_TO_RETRY_ON,
            ).ainvoke(state["messages"], self.config)

            state["messages"].append(response)
            return state

        async def call_area_of_needs(state: ExtendedMessagesState):
            logger.debug("Generating area of needs")

            message = self.prompts.get_area_of_needs_prompt()

            state["messages"].append(message)

            if self.previous_sections:
                # since we already got the area of needs from a previous generation, let's output them here.
                # as we don't want to mess with the context, we include them as if they were actually an answer from the LLM.
                response = AreaOfRiskNeeds(sections=self.previous_sections)
                logger.debug("Re-using previous generated section")
            else:
                response = (
                    await self.model.with_structured_output(AreaOfRiskNeeds)
                    .with_retry(
                        stop_after_attempt=DEFAULT_MAX_RETRIES,
                        retry_if_exception_type=ERRORS_TO_RETRY_ON,
                    )
                    .ainvoke(state["messages"], self.config)
                )

            state["messages"].append(AIMessage(content=response.json()))
            logger.debug("Sections to work on", sections=response.sections)
            state["sections_to_generate"] = response.sections

            return state

        async def call_resources_options(state: ExtendedMessagesState):
            logger.debug("Identifying resource options")

            message = self.prompts.get_resources_options_prompt()
            state["messages"].append(message)
            associations = (
                await self.model.with_structured_output(ActionPlanResourcesAssociations)
                .with_retry(
                    stop_after_attempt=DEFAULT_MAX_RETRIES,
                    retry_if_exception_type=ERRORS_TO_RETRY_ON,
                )
                .ainvoke(state["messages"], self.config)
            )
            state["messages"].append(AIMessage(content=associations.json()))
            state["resources_associations"] = associations

            return state

        async def call_generate_section_node(state: ExtendedMessagesState):
            return await call_generate_section(
                config=self.config,
                state=state,
                client_address=self.client_address,
                prompts=self.prompts,
                model=self.model,
            )

        async def call_generate_timeline(state: MessagesState):
            logger.debug("Generating timeline")
            messages = state["messages"]
            message = self.prompts.get_timeline_generation_prompt()

            response = await self.model.with_retry(
                stop_after_attempt=DEFAULT_MAX_RETRIES,
                retry_if_exception_type=ERRORS_TO_RETRY_ON,
            ).ainvoke(messages + [message], self.config)
            messages.append(response)

            format_message = self.prompts.get_timeline_format_prompt()

            timeline = (
                await self.model.with_structured_output(ActionPlanTimelines)
                .with_retry(
                    stop_after_attempt=DEFAULT_MAX_RETRIES,
                    retry_if_exception_type=ERRORS_TO_RETRY_ON,
                )
                .ainvoke(messages + [format_message], self.config)
            )

            state["generated_timeline"] = timeline
            return state

        async def call_generate_milestones(state: MessagesState):
            logger.debug("Generating milestones")
            messages = state["messages"]
            message = self.prompts.get_milestones_generation_prompt()
            messages.append(message)
            intermediate_response = await self.model.with_retry(
                stop_after_attempt=DEFAULT_MAX_RETRIES,
                retry_if_exception_type=ERRORS_TO_RETRY_ON,
            ).ainvoke(messages, self.config)

            # ignore the first generation as most of the time it's not ordered correctly nor grouped correctly
            # in my tests it's better to just let the llm do it, and ask to refine the output
            # we have no value to save the intermediate here
            # we just save the message after refinement

            intermediate_message = self.prompts.get_milestones_refinement_prompt()
            response = await self.model.with_retry(
                stop_after_attempt=DEFAULT_MAX_RETRIES,
                retry_if_exception_type=ERRORS_TO_RETRY_ON
                + (ValidationError,),  # need the comma to make it a tuple
            ).ainvoke(
                messages + [intermediate_response, intermediate_message], self.config
            )
            messages.append(response)

            format_message = self.prompts.get_milestones_format_prompt()

            milestones = (
                await self.model.with_structured_output(ActionPlanMilestones)
                .with_retry(
                    stop_after_attempt=DEFAULT_MAX_RETRIES,
                    retry_if_exception_type=ERRORS_TO_RETRY_ON,
                )
                .ainvoke(messages + [format_message], self.config)
            )

            state["generated_milestones"] = milestones
            return state

        async def call_generate_action_plan(state: ExtendedMessagesState):
            logger.debug("Generating action plan")

            message = self.prompts.get_action_plan_generation_prompt()
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
        # Define a new graph with semantic node names for LangSmith legibility
        workflow = StateGraph(ExtendedMessagesState)
        # Create a new plan
        workflow.add_node("gen_reflexion", call_reflexion)
        workflow.add_node("gen_area_of_needs", call_area_of_needs)

        if self.include_resources:
            workflow.add_node("gen_resources", call_resources_options)

        workflow.add_node("gen_section", call_generate_section_node)

        # Conditionally add timeline and milestones nodes
        if self.include_timeline:
            workflow.add_node("gen_timeline", call_generate_timeline)
        if self.include_milestones:
            workflow.add_node("gen_milestones", call_generate_milestones)

        workflow.add_node(
            "gen_assemble", call_generate_action_plan, retry=RetryPolicy()
        )

        # Links
        workflow.add_edge(START, "gen_reflexion")
        workflow.add_edge("gen_reflexion", "gen_area_of_needs")
        if self.include_resources:
            workflow.add_edge("gen_area_of_needs", "gen_resources")
            workflow.add_conditional_edges("gen_resources", call_generate_sections)
        else:
            workflow.add_conditional_edges("gen_area_of_needs", call_generate_sections)

        # Conditionally connect section -> timeline -> milestones -> assemble
        # based on which features are enabled
        if self.include_timeline and self.include_milestones:
            workflow.add_edge("gen_section", "gen_timeline")
            workflow.add_edge("gen_timeline", "gen_milestones")
            workflow.add_edge("gen_milestones", "gen_assemble")
        elif self.include_timeline and not self.include_milestones:
            workflow.add_edge("gen_section", "gen_timeline")
            workflow.add_edge("gen_timeline", "gen_assemble")
        elif not self.include_timeline and self.include_milestones:
            workflow.add_edge("gen_section", "gen_milestones")
            workflow.add_edge("gen_milestones", "gen_assemble")
        else:
            # Neither timeline nor milestones enabled
            workflow.add_edge("gen_section", "gen_assemble")

        workflow.add_edge("gen_assemble", END)

        self.graph = workflow.compile()
        print(self.graph.get_graph().draw_mermaid())

    async def generate(self):
        # Use the Runnable
        user_prompt = self.prompts.get_initial_user_prompt(
            self.client_data, self.client_address, self.decision_tree_statements
        )

        # Include run_name in config for LangSmith trace legibility
        invoke_config = {
            **self.config,
            "run_name": self.run_name,
        }

        events = self.graph.astream(
            {
                "messages": [
                    ("user", self.prompts.get_system_message()),
                    ("user", user_prompt),
                ],
                "sections_to_generate": [],
                "generated_sections": [],
                "plan": None,
                "generated_timeline": None,
                "generated_milestones": None,
            },
            invoke_config,
            stream_mode="values",
        )

        # iterate over the events just for debugging, it allow us to have nice messages
        # and keep the last event as final_state
        final_state = None
        async for event in events:
            message = event["messages"][-1]
            message.pretty_print()
            final_state = event

        # Log the raw state before deduplication
        logger.debug(
            "Raw generated sections before deduplication",
            total_sections=len(final_state["generated_sections"]),
            sections_to_generate=final_state["sections_to_generate"],
        )

        # deduplicate generated_sections
        # XXX is that a bug of langgraph ? we use operator.add
        # i have the right amount of sections generated, but at this point
        # in the code, we get more sections than expected.
        # When check with pdb, their id() are the same.

        # So rewrite the generated sections list to be unique, in the intented
        # order of the sections_to_generate
        generated_sections = []
        # Use a dictionary to ensure unique resources by ID
        resource_dict = {}
        for name in final_state["sections_to_generate"]:
            for section in final_state["generated_sections"]:
                if section.title == name:
                    generated_sections.append(section)
                    # Log resources for this section
                    logger.debug(
                        "Processing section resources",
                        section_title=name,
                        resources_count=len(section.resources),
                    )
                    for resource in section.resources:
                        resource_dict[resource.id] = resource
                    break

        final_resources = list(resource_dict.values())
        logger.info(
            "Resource processing completed",
            sections_generated=len(generated_sections),
            final_resources=len(final_resources),
        )

        # Conditionally include timeline and milestones based on config
        plan = ActionPlan(
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

        return ActionPlanMarkdown(
            messages=final_state["messages"],
            user_prompt=user_prompt,
            action_plan=convert_to_markdown(
                plan, resource_bank_enabled=self.include_resources
            ),
            structured_action_plan=plan,
            suggested_resources=final_resources,
            resources_associations=(final_state.get("resources_associations")),
        )
