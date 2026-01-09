import asyncio
from typing import Literal

import structlog
from langchain_core.messages import AIMessage
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.pregel import RetryPolicy
from langgraph.types import Send
from pydantic import ValidationError

from app.core.config import create_model_from_config
from app.core.data_config.output_configs.output_config import ActionPlanConfigFile
from app.services.resources import (
    CATEGORY_SUBCATEGORY_MAP,
    GetResourcesRequest,
    ResourceFailureReason,
    list_resources,
)
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
                "resources_associations": state["resources_associations"]
                if state.get("resources_associations")
                else None,
            },
        )
        for section in state["sections_to_generate"]
    ]


async def fetch_resources_with_retry(
    request: GetResourcesRequest, max_retries: int = 2
):
    """
    Fetch resources with retry logic for both API errors and no results found.

    Args:
        request: The original resource request
        max_retries: Maximum number of retry attempts (default: 2)

    Returns:
        List of resources (empty list if all attempts fail)
    """
    current_request = request

    for attempt in range(max_retries + 1):  # +1 for the initial attempt
        try:
            if attempt > 0:
                # Wait between retries (exponential backoff 1s, 2s, 4s...)
                wait_time = 2 ** (attempt - 1)
                logger.debug(f"Waiting {wait_time}s before retry attempt {attempt}")
                await asyncio.sleep(wait_time)

            logger.debug(f"Resource fetch attempt {attempt + 1}/{max_retries + 1}")
            result = await list_resources(current_request)

            if result.failure_reason == ResourceFailureReason.SUCCESS:
                resources = result.resources
                logger.debug(
                    f"Successfully fetched {len(resources)} resources on attempt {attempt + 1}"
                )
                return resources
            elif result.failure_reason == ResourceFailureReason.API_ERROR:
                logger.warning(
                    f"API error on attempt {attempt + 1}: {result.error_message}"
                )
            elif result.failure_reason == ResourceFailureReason.NO_RESULTS_FOUND:
                # if there were not results we can modify the request to broaden the search, pending to define with the client
                # but in theory this should be done for the resources api
                # current_request = modified_request_with_broader_search
                logger.debug(f"No results found on attempt {attempt + 1}")
        except Exception as e:
            logger.exception(f"Unexpected error on attempt {attempt + 1}: {str(e)}")

    logger.error("Max attempt reached, no resources found")
    return []


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
    resources = []
    if state.get("resources_associations"):
        for association in state["resources_associations"].associations:
            if association.section_title == section:
                # First, handle all specified subcategories
                for subcategory in association.subcategories:
                    # Find the parent category for this subcategory
                    parent_category = None
                    for category, subcategories in CATEGORY_SUBCATEGORY_MAP.items():
                        if subcategory in subcategories:
                            parent_category = category
                            break
                    if not parent_category:
                        logger.warning(
                            "No parent category found for subcategory",
                            subcategory=subcategory,
                        )
                        continue

                    request = GetResourcesRequest(
                        category=parent_category,
                        subcategory=subcategory,
                        address=client_address,
                        limit=2,
                        exclude_names=None,
                        exclude_ids=None,
                    )
                    try:
                        fetched_resources = await fetch_resources_with_retry(
                            request, max_retries=2
                        )
                        resources.extend(fetched_resources)
                    except Exception as error:
                        logger.error(
                            "Failed to fetch resources for subcategory",
                            category=parent_category,
                            subcategory=subcategory,
                            error=str(error),
                        )
                # Then handle categories that don't have specific subcategories listed
                for category in association.categories:
                    # Check if this category already had subcategories handled
                    subcategories_handled = False
                    for subcategory in association.subcategories:
                        if any(
                            subcategory in subcat_list
                            for cat, subcat_list in CATEGORY_SUBCATEGORY_MAP.items()
                            if cat == category
                        ):
                            subcategories_handled = True
                            break

                    # If no subcategories were handled for this category, get all resources for the category
                    if not subcategories_handled:
                        request = GetResourcesRequest(
                            category=category,
                            subcategory=None,
                            address=client_address,
                            exclude_names=None,
                            exclude_ids=None,
                            limit=2,
                        )
                        try:
                            fetched_resources = await fetch_resources_with_retry(
                                request, max_retries=2
                            )
                            resources.extend(fetched_resources)
                        except Exception as error:
                            logger.error(
                                "Failed to fetch resources for category",
                                category=category,
                                error=str(error),
                            )

    if resources:
        message = prompts.get_section_generation_prompt_with_resources(
            section, resources
        )
    else:
        message = prompts.get_section_generation_prompt_without_resources(section)

    result_messages = []
    messages = state["messages"] + [message]

    try:
        temp_response = await model.with_retry(
            stop_after_attempt=DEFAULT_MAX_RETRIES,
            retry_if_exception_type=ERRORS_TO_RETRY_ON,
        ).ainvoke(messages, config)
    except Exception as error:
        logger.error(
            "Failed to generate initial section content",
            section=section,
            error=str(error),
        )

    # Get annotations and notes
    logger.debug("Getting annotations and notes for the section", section=section)
    prompt = prompts.get_section_annotations_prompt(section, temp_response.content)
    annotations = (
        await model.with_structured_output(ActionPlanSectionPartial)
        .with_retry(
            stop_after_attempt=DEFAULT_MAX_RETRIES,
            retry_if_exception_type=ERRORS_TO_RETRY_ON,
        )
        .ainvoke(messages + [prompt], config)
    )

    logger.debug("Refinining the content of the section", section=section)
    prompt = prompts.get_section_refinement_prompt(section)
    final_response = await model.with_retry(
        stop_after_attempt=DEFAULT_MAX_RETRIES,
        retry_if_exception_type=ERRORS_TO_RETRY_ON,
    ).ainvoke(messages + [temp_response] + [prompt], config)
    result_messages.append(final_response)

    suggested_resources = [
        resource for resource in resources if resource.id in final_response.content
    ]

    # Save the section
    action_plan_section = ActionPlanSection(
        title=section,
        markdown_content=final_response.content,
        annotations=annotations.annotations,
        notes=annotations.notes,
        resources=suggested_resources,
    )

    logger.info(
        "Section generation completed",
        section=section,
        total_resources=len(resources),
        suggested_resources_count=len(suggested_resources),
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
            action_plan=convert_to_markdown(plan),
            structured_action_plan=plan,
            suggested_resources=final_resources,
        )


if __name__ == "__main__":
    client_data = """# Client informations

    ```
    doc_id: 108734
    supervision_type: Parole
    supervision_level: Low
    phone_number: (650) 709-6454
    status: TBD
    status_tag: NEW
    dob: 7/14/2007
    next_appointment: 01/13/2025 10:30 AM
    surname: Jones
    given_names: Allistor
    preferred_name: Allistor
    address_home: 4639 S Frontenac St, Seattle, WA 98118
    address_work: 6301 Beacon Ave S, Seattle, WA 98108
    address_school: 1410 NE Campus Pkwy, Seattle, WA 98195
    ```

    # Client intake messages

    ```
    [{"id": "3d1acf94-80f2-4e9c-b45e-27166c973489", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I drink alcohol only socially. I've heard (a LOT now) that it can interact with my prescription medication, which I use for headaches. I started the painkillers several years ago after a bike accident, and my doctor assures me it's not unusual to still be on them after years have passed if you still have occasional aches and pains. These are LEGAL drugs PRESCRIBED by my doctor. No, I don't have any gang associations though I suspect that may change if you throw me into prison.", "createdAt": "2024-10-14T20:08:20.30968+00:00"}, {"id": "5acbad7e-d3ac-4fa8-b938-e990cdb4441f", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I hear your concerns, and I appreciate your clarity on your use of prescription medication and your social alcohol consumption. Let\u2019s talk about your health and psychological well-being next. Do you have any physical limitations or medical history you're concerned about? Have you had any psychological conditions or cultural beliefs that might affect your interactions or how you feel about life events? Do you generally feel in control of your life?", "createdAt": "2024-10-14T20:08:26.159241+00:00"}, {"id": "d79a8ebb-b772-4ddb-b591-73610c330858", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "What kind of issue?", "createdAt": "2024-10-14T20:11:11.88716+00:00"}, {"id": "b8a9ca3f-997a-4f9d-945c-60e0e8c0a810", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I definitely do not feel in control of my life since this whole escapade began. Traffic accidents happen every day, but we call them accidents for a reason. It's RIDICULOUS that I'm here filling out this intake survey for something that's going to be overturned any day now. Aside from my pain medication, I also take blood pressure medication due to the amount of stress my work and home lives bring. Having four kids running around expensive furniture all through the evening hours isn't for the faint of heart, I can tell you that.", "createdAt": "2024-10-14T20:10:46.889133+00:00"}, {"id": "4ccaf859-7828-4554-9358-dfd6ea07fd55", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "Thank you for your patience. It looks like there was an issue when trying to record some details, but I've noted all the areas we've covered so far. Since we've discussed each topic in detail, is there anything else you'd like to share or ask about? If you seek advice on any particular aspect, feel free to mention it, and I will consider your full situation before offering suggestions.", "createdAt": "2024-10-14T20:10:58.747649+00:00"}, {"id": "028241d1-f9df-4936-9b7b-df13a575f0b4", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "All the information you provided has been successfully recorded. Thank you for your patience throughout this process. If you have any further questions or need support, don't hesitate to reach out. I'm here to help!", "createdAt": "2024-10-14T20:11:58.662218+00:00"}, {"id": "c22cfa75-a9c1-43aa-95b2-1c5bba8bd943", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "Alright, so I guess we're done. Finally.", "createdAt": "2024-10-14T20:12:09.947117+00:00"}, {"id": "9035c31d-3c64-4e72-8a35-59b3b7624c49", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "The issue was simply a brief technical problem with recording the details, but rest assured that your information is being accurately captured now. If there's anything else on your mind or if you have specific questions or need advice, please feel free to let me know. I'm here to help.", "createdAt": "2024-10-14T20:11:17.39484+00:00"}, {"id": "b7c5952c-3b09-475e-8021-2574338ab356", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "You said the technical problem was fixed earlier. Do I need to come back and do this whole thing all over again now?", "createdAt": "2024-10-14T20:11:41.709355+00:00"}, {"id": "4035c913-eb26-4a4c-8197-534e62a63af6", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "Thank you for your patience throughout this process. If you have any further questions or need support in the future, please feel free to reach out. Take care!", "createdAt": "2024-10-14T20:12:41.106724+00:00"}, {"id": "2cdded7c-1a24-43bd-9e44-707003e48abb", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "Alright, what do I have to do here?", "createdAt": "2024-10-14T19:52:41.251139+00:00"}, {"id": "19d2790f-9cf4-4c00-943b-b6e7241b4d5d", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I'm here to help gather some information from you as part of an intake process. We will discuss a range of topics to get a complete picture of your situation. This includes your criminal history, education, employment, financial situation, family relationships, housing and recreation activities, associates and drug use, and health and psychological details.\n\nLet's start with your criminal history. Could you tell me if you have any convictions and, if so, what they were for?", "createdAt": "2024-10-14T19:52:47.497254+00:00"}, {"id": "c71642ee-1758-43aa-9cd9-e19f0812ca90", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "No, I'm not a criminal. Honestly, it's a complete miscarriage of justice that we're evendoing this, I told the judge my attorneys were planning to appeal.", "createdAt": "2024-10-14T19:53:32.938376+00:00"}, {"id": "275d2bae-7e1b-4785-80b4-34ea1fda9685", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "It sounds like you're going through a challenging time, and I appreciate you sharing that with me. Let\u2019s move on to another topic. Could you tell me about your education history? What's the highest level of education you've completed? Have you faced any challenges, such as expulsions?", "createdAt": "2024-10-14T19:53:37.654328+00:00"}, {"id": "bc6a1667-d723-4497-9797-616f5ab3de69", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "Look just to be clear, I was on prescription meds - which I had a prescription for! - at the time of the accident. My doctor gave them to me for my headaches, and I was disoriented by a headache when I started driving down the highway to begin with, so it's not like I was in a good space to be thinking about whether I should drive. I'm sorry those people were on the road, and what happened happened, but this wasn't on my. This is my only time ever being convicted of anything, and I can PROMISE you it won't stick.", "createdAt": "2024-10-14T19:55:42.630682+00:00"}, {"id": "1f719fa2-b705-4d4a-bd58-51fc67b6fe6e", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I understand that this situation is quite complex and it sounds like you're dealing with a lot right now. Let's talk a bit about your education history. Could you share what is the highest level of education you've completed?", "createdAt": "2024-10-14T19:55:50.060417+00:00"}, {"id": "4bc58f6c-5193-4cfa-ac66-b247149f29b5", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "It seems there's a little technical hiccup on my end, but no worries, we'll keep going. Thank you for sharing your employment history. Let's move on to discussing your current financial situation. Do you have any savings or specific sources of income you'd like to mention? Also, are you currently enrolled in any government-sponsored programs?", "createdAt": "2024-10-14T19:59:32.520223+00:00"}, {"id": "e8a44d13-5a0e-461c-ad27-d74340fc7506", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I have a Masters from U Penn in Business Administration, and a Bachelor of Arts in Comparative Politics from Duke.", "createdAt": "2024-10-14T19:56:34.870347+00:00"}, {"id": "b0a6f7a4-0fd3-4ccc-a6bf-2a9ef01142b0", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I'm the Vice President of Data Science at Morton & Dolton Architecture, Ltd. I've been in the role for two years, prior to which I was Director of Data Science. I previously held roles in data science and analysis at the Arbor Institute in London for seven years.", "createdAt": "2024-10-14T19:59:22.435701+00:00"}, {"id": "c9d46ab5-36d1-4fd8-a25e-a8fe728a4593", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I own my home outright, it's in Riverside, and it's definitely not high crime. And I have a car, though my license is now suspended and I don't have a way to get to work anymore - thanks for mentioning it. Why don't you just get all this info from the court documents?", "createdAt": "2024-10-14T20:03:28.8838+00:00"}, {"id": "386b7d1e-d9da-4627-9695-c8f48b4b15ac", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I've noted the information you've shared about your family relationships and the support dynamics. Let's talk about your social circle and any substance use. Do you use any drugs or alcohol? If so, when did you start? Additionally, how do these substances impact your life, such as legal or employment issues? Are any of your friends involved in drug use or have criminal backgrounds? Any gang associations?", "createdAt": "2024-10-14T20:05:59.880158+00:00"}, {"id": "b9738dcf-99bd-42ac-8dd0-5f9b8301094d", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "That's impressive, and it sounds like you've had a strong educational background. Moving on to employment, can you tell me about your current job? Are you employed, and if so, what do you do? Also, if you're comfortable, could you share any past employment experiences and whether you were employed at the time of the incident?", "createdAt": "2024-10-14T19:56:44.29972+00:00"}, {"id": "6ff7fd2d-2eac-4e14-82b6-46f492b09ea1", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I understand that you're managing your finances independently and working through legal expenses. Let's talk about your housing situation next. Can you describe your current living situation? Do you own your home, rent, or something else? Additionally, is your neighborhood considered a high crime area? Do you have reliable transportation?", "createdAt": "2024-10-14T20:01:46.708206+00:00"}, {"id": "34a6e9c3-9b1f-4e9d-872b-d7044670406c", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I understand this process can be frustrating, and I appreciate your patience. It sounds like you have stability in your housing but are dealing with transportation issues due to the situation with your license. Let's focus next on your free time. When you do have free time, what kinds of activities do you enjoy? Are there any recreational activities or hobbies that are significant for you?", "createdAt": "2024-10-14T20:03:34.129843+00:00"}, {"id": "da822d5a-f559-4900-809f-f66e9f5b28bb", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I'm part of the men's choir at my church, I play golf on the weekends at the club, and I'm a member of the cheese society here in town and am responsible for curating experiences as part of the society's education and outreach.", "createdAt": "2024-10-14T20:04:26.898597+00:00"}, {"id": "5e80eef6-4c62-4a13-aeeb-95af4db628f4", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "Thank you for sharing about your recreational activities\u2014it sounds like you have a rich and diverse range of interests.\n\nLet's move on to discussing your family relationships. How is your relationship with your family? Are you married or single, and do you have any children? Also, does your family support you emotionally or financially in any way?", "createdAt": "2024-10-14T20:04:39.069369+00:00"}, {"id": "de34d85e-dbdf-48af-bb53-9859fec2a83d", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "What's a technical hiccup? Am I going to have to do this again? I'm pretty busy, you know, and this was _not_ convenient to schedule.", "createdAt": "2024-10-14T20:00:03.209489+00:00"}, {"id": "df9606c3-6276-4352-8651-3c8c2b76f79d", "role": "assistant", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "A \"technical hiccup\" just means there was a small issue on my side, but it's been resolved now. You won't have to do this again; I assure you it won't interrupt things further. Let's continue with your financial situation. Are there any savings or sources of income you want to mention, or are you enrolled in any government-sponsored programs?", "createdAt": "2024-10-14T20:00:08.241011+00:00"}, {"id": "e503227a-8209-4b24-a9ae-70dbd02049ef", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "I'm married and have four children. All of them are deeply traumatized by this entire misadventure you're putting me through. My wife is supportive, but can't be expected to remain that way forever if she has to keep driving me around.", "createdAt": "2024-10-14T20:05:44.634101+00:00"}, {"id": "ad96eb7c-f731-4364-a070-5ac07cfbf1fa", "role": "user", "agentId": "4aaac40b-a70a-4997-817a-b0f2b4b3b205", "content": "Yes, of course I have savings accounts. I have several years' of savings in my Vanguard account, plus a Roth 401k that I rolled over two years ago. I'm not involved in any 'government-sponsored programs', and unless the attorney's fees for all this bankrupt me I don't ever intend to be.", "createdAt": "2024-10-14T20:01:41.123584+00:00"}]
    ```

    # Client intake summary

    ```
    ### Personal Background
    The client is a Vice President of Data Science at an architecture firm and possesses a strong educational background, with a Master's in Business Administration from the University of Pennsylvania. He is married with four children and currently facing legal challenges resulting from a traffic accident. He was under the influence of prescribed medications during the incident, which he contends affects his judgment at the time.

    ### Needs and Risks Overview
    - **Education:** No immediate needs identified; strong educational background.
    - **Employment:** Need for stable employment; current role as Vice President.
    - **Financial:** Legal fees due to ongoing court case might impact savings.
    - **Family:** Emotional strain on family due to legal issues and transportation challenges.
    - **Housing:** Owns home outright; stable housing situation.
    - **Recreation:** Engaged in community activities like men's choir and golf.
    - **Associates:** No concerns with illegal associations mentioned.
    - **Cognition/Psych:** Psychological stress due to legal proceedings.
    - **Health:** Physical health concerns with headaches and high blood pressure.

    ### Priority Needs
    - **Transportation:** License suspension impacts ability to commute to work.
    - **Legal Support:** Ongoing legal defense to manage charges related to the traffic incident.

    ### Longer-term Needs
    - **Psychological Well-being:** Managing stress levels related to work and home life.
    - **Health:** Monitoring and managing high blood pressure and effects of medication.

    ### Final Thoughts
    The client faces significant stress surrounding an ongoing legal issue from a traffic accident. While he maintains a stable job and home life, his transportation challenges and legal battles pose immediate concerns. Long-term, addressing stress and health management will be crucial.
    ```
    """

    decision_tree_statements = """For the decision tree "employment_mobility", the recommandations are:
    - Are there alternative transportation options available?
    - Facilitate connections with coworkers or local carpool programs
    - Develop an Action Plan addressing transportation barriers"""
