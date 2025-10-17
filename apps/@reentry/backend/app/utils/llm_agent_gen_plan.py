import asyncio
from textwrap import dedent
from typing import Literal

import structlog
from anthropic import RateLimitError as AnthropicRateLimitError
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.pregel import RetryPolicy
from langgraph.types import Send
from openai import RateLimitError as OpenAIRateLimitError
from pydantic import ValidationError

from app.core.config import gen_model as model
from app.core.config import tracer
from app.services.resources import (
    CATEGORY_SUBCATEGORY_MAP,
    GetResourcesRequest,
    Resource,
    ResourceFailureReason,
    ClientExtractedInfo,
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
from app.utils.regex import extract_uuids_from_links

from .llm_tools import convert_to_markdown

logger = structlog.get_logger(__name__)

### Prompts
system_message = """
You are a caseworker, tasked with generating an action plan for a client, combining decision tree best practices, client data, assessment results, and available resources into a structured output.

- The action plan should be clearly understandable to the client and written in plain language without jargon. The primary focus must be on what the client needs to know and do.
- The action plan and all sections MUST be addressed as written by the caseworker to the client.
- Do not refer the client by "the client" or as a third person. Use "you" and "your" instead.
- The action plan should clearly delineate which steps need to be taken, and when, by the client, and which should be taken by the caseworker.
- Recommended steps should be actionable (less "Get treatment", more "Register with XYZ treatment center's 3-month outpatient treatment program").
- When available, assessment scores should be used to prioritize and focus the action plan on high-risk areas identified through formal assessment tools.
- Please ensure all enumerated items are formatted as proper bullet or numbered lists throughout the entire action plan
- The plan generator should take care to:
    - Generate the report in a kind, supportive, down-to-earth (not false friendly), but objective tone.
    - Ignore factors which may suggest race (e.g., name or express mentions of racial or ethnic background), sex, or age except as relevant to needs or action plan (e.g., immigration status, or need for men's vs. women's vs. youth shelter, etc.).
    - Not quote source materials verbatim, or mention judgments or subjective statements, except in the notes, which are to be quoted verbatim and are only visible to the case worker.
    - Not to recommend local resources except as provided through the resource pipeline.
    - If questions arise during the action plan generation, please note them in the `notes` fields of the appropriate section that the case worker can address.
- The action plan will be separated into the following sections:
    - Immediate needs: Which issues should be addressed urgently to create the stability necessary for success.
    - [Plans by section]: Each section should be specific to an area of needs or risks (e.g., housing, employment, etc.).
      A section should not cross over with another section.
      It should contain a paragraph describing the area of needs or risk, how to help in this area, and an action plan/timeline.
      If assessment data is available, sections with higher risk scores should receive more detailed attention.
    - Milestones: Milestones the case worker and client can check in on together to know whether it's working / they're on the right track.
    - Timeline: An enumeration week-by-week, then month-by-month after 2mo, of each of the steps the individual and their case worker should take along the path of the action plan.
    - Quick summary of circumstances: A brief summary of the client's circumstances (based on intake summary and assessment results).
    - Overview: A brief summary of the action plan, including the section title and a quick description of each section (Do not mention immediate needs).
"""


### Graph state
class ExtendedMessagesState(CommonMessagesState):
    resources_associations: ActionPlanResourcesAssociations | None
    client_extracted_info: ClientExtractedInfo


### Transition functions
def call_generate_sections(state: ExtendedMessagesState) -> Literal["section"]:
    return [
        Send(
            "section",
            {
                "messages": state["messages"],
                "section_to_generate": section,
                "resources_associations": state["resources_associations"],
                "client_extracted_info": state["client_extracted_info"],
            },
        )
        for section in state["sections_to_generate"]
    ]


def format_resources_for_display(resources: list[Resource]) -> str:
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
        if resource.operationalStatus:
            ratings_info.append(f"Status: {resource.operationalStatus}")
        if resource.price_level:
            ratings_info.append(f"Price Level: {resource.price_level}")
        if ratings_info:
            formatted_output += "   Additional Information:\n"
            for info in ratings_info:
                formatted_output += f"   - {info}\n"

        if resource.tags:
            formatted_output += f"   Tags: {', '.join(resource.tags)}\n"

        formatted_output += "\n"

    return formatted_output


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
            logger.error(f"Unexpected error on attempt {attempt + 1}: {str(e)}")

    logger.error("Max attempt reached, no resources found")
    return []


async def call_generate_section(config: dict, state: ExtendedMessagesState):
    # This function is shared with LLMAgentEdit
    section = state["section_to_generate"]
    logger.debug("Generating section", section=section)
    resources = []
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

                request = GetResourcesRequest.from_client_extracted_info(
                    category=parent_category,
                    subcategory=subcategory,
                    limit=2,
                    client_info=state.client_extracted_info,
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
                    request = GetResourcesRequest.from_client_extracted_info(
                        category=category,
                        subcategory=None,
                        client_info=state.client_extracted_info,
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

    message = HumanMessage(
        content=dedent(f"""
        Let's focus on the section: {section}.
        Here are the resources available for this section:
        {format_resources_for_display(resources)}

        1. Elaborate on the client's situation and what could be useful for them, and always refer to the client as "you".
        2. Review assessment data if available. If assessment scores indicate this is a high-risk area, address those specific risks in your plan.
        3. Check if there are any resources or providers to connect with. Always reference a resource using markdown link [name of the resource](#resource ID).
        4. Recall decision tree recommendations about this subject.
        5. Does the section include an urgent need (finding immediate housing, getting a health screening, etc.)?
        6. If so, establish a timeline with short-term and long-term tasks. Immediate needs go into short-term.
        7. Does the section include a need that is not that urgent?
            If so, establish a timeline with tasks that lead up to the best-case outcome.
        8. For timeline title (short-term/long-term), use the date format 1-3 weeks, 3-6 months or such.
        Here is an example of a timeline:
        ```markdown
        # Short-Term Addiction Treatment (1-3 months)
        1. Enroll in Intensive Outpatient Treatment (Weeks 1-2)
            - Contact addiction treatment providers like Recovery Café or Therapeutic Health Services
            - Commit to an intensive outpatient program to address your substance use
            - **Goal**: By the end of week 2, you should be enrolled with a treatment provider and have a plan for practicing what you learn.
        2. Mental Health and Recovery Support (Months 1-3)
            - Schedule regular sessions with a youth counselor or therapist at Youth Eastside Services
            - Attend support groups for young adults in recovery, as recommended by Officer Kindra
            - **Goal**: By three months from now, you've attended at least five sessions with a youth counselor, and have a stable support network.
        ```
        8. Goals must be concrete and measurable.
        For example, instead of "Goal: By month 4, maintain consistent engagement with mental health support and expand your support network.", write "Goal: By month 4, be ready to review recent work from your mental health routine, how expanding your social circles has gone, and any guidance advised by your counselor."
        9. Guidance must first refer the client to their current one, and provide guidance if they don't have one.
        For example, instead of "Contact City General Hospital to arrange a comprehensive health check-up and review your current medications.", write "Contact your doctor to arrange a comprehensive check-up and review your current medications. If you don't have a primary care physician and aren't sure how to find one, ask your insurance provider or reach out to City General Hospital for help". This should be the same for all guidance (lawyer, therapist, etc.)
        10. Do not use the ```markdown tag or such, it's only for the example, the content you'll generate is already in markdown.
        """)
    )

    if resources:
        content = dedent(f"""
        Let's focus on the section: {section}.
        Here are the resources available for this section:
        {format_resources_for_display(resources)}

        1. Elaborate on the client's situation and what could be useful for them, and always refer to the client as "you".
        2. Review assessment data if available. If assessment scores indicate this is a high-risk area, address those specific risks in your plan.
        3. Check if there are any resources or providers to connect with. Always reference a resource using markdown link [name of the resource](#resource ID).
        4. Recall decision tree recommendations about this subject.
        5. Does the section include an urgent need (finding immediate housing, getting a health screening, etc.)?
        6. If so, establish a timeline with short-term and long-term tasks. Immediate needs go into short-term.
        7. Does the section include a need that is not that urgent?
            If so, establish a timeline with tasks that lead up to the best-case outcome.
        8. For timeline title (short-term/long-term), use the date format 1-3 weeks, 3-6 months or such.
        Here is an example of a timeline:
        ```markdown
        # Short-Term Addiction Treatment (1-3 months)
        1. Enroll in Intensive Outpatient Treatment (Weeks 1-2)
            - Contact addiction treatment providers like Recovery Café or Therapeutic Health Services
            - Commit to an intensive outpatient program to address your substance use
            - **Goal**: By the end of week 2, you should be enrolled with a treatment provider and have a plan for practicing what you learn.
        2. Mental Health and Recovery Support (Months 1-3)
            - Schedule regular sessions with a youth counselor or therapist at Youth Eastside Services
            - Attend support groups for young adults in recovery, as recommended by Officer Kindra
            - **Goal**: By three months from now, you've attended at least five sessions with a youth counselor, and have a stable support network.
        ```
        9. Goals must be concrete and measurable.
        For example, instead of "Goal: By month 4, maintain consistent engagement with mental health support and expand your support network.", write "Goal: By month 4, be ready to review recent work from your mental health routine, how expanding your social circles has gone, and any guidance advised by your counselor."
        10. Guidance must first refer the client to their current one, and provide guidance if they don't have one.
        For example, instead of "Contact City General Hospital to arrange a comprehensive health check-up and review your current medications.", write "Contact your doctor to arrange a comprehensive check-up and review your current medications. If you don't have a primary care physician and aren't sure how to find one, ask your insurance provider or reach out to City General Hospital for help". This should be the same for all guidance (lawyer, therapist, etc.)
        11. Do not use the ```markdown tag or such, it's only for the example, the content you'll generate is already in markdown.
        """)
    else:
        content = dedent(f"""
        Let's focus on the section: {section}.
        Note: No specific resources are currently available for this section, so focus on general guidance and self-directed actions.

        1. Elaborate on the client's situation and what could be useful for them, and always refer to the client as "you".
        2. Review assessment data if available. If assessment scores indicate this is a high-risk area, address those specific risks in your plan.
        3. Provide general guidance on how to find appropriate services or providers in their area (e.g., "Contact your insurance provider for covered services" or "Search for local community centers").
        4. Recall decision tree recommendations about this subject.
        5. Does the section include an urgent need (finding immediate housing, getting a health screening, etc.)?
        6. If so, establish a timeline with short-term and long-term tasks. Immediate needs go into short-term.
        7. Does the section include a need that is not that urgent?
            If so, establish a timeline with tasks that lead up to the best-case outcome.
        8. For timeline title (short-term/long-term), use the date format 1-3 weeks, 3-6 months or such.
        Here is an example of a timeline:
        ```markdown
        # Short-Term Addiction Treatment (1-3 months)
        1. Research and Contact Treatment Options (Weeks 1-2)
            - Research local addiction treatment providers in your area through your insurance provider or online directories
            - Contact at least 3 different treatment centers to compare programs and availability
            - **Goal**: By the end of week 2, you should have contacted multiple providers and selected an appropriate treatment program.
        2. Mental Health and Recovery Support (Months 1-3)
            - Contact your current therapist or ask your primary care doctor for mental health referrals
            - Look for local support groups through community centers, hospitals, or online platforms
            - **Goal**: By three months from now, you've attended at least five therapy sessions and have connected with a support group that meets regularly.
        ```
        9. Goals must be concrete and measurable.
        For example, instead of "Goal: By month 4, maintain consistent engagement with mental health support and expand your support network.", write "Goal: By month 4, be ready to review recent work from your mental health routine, how expanding your social circles has gone, and any guidance advised by your counselor."
        10. Guidance must first refer the client to their current one, and provide guidance if they don't have one.
        For example, instead of "Contact City General Hospital to arrange a comprehensive health check-up and review your current medications.", write "Contact your doctor to arrange a comprehensive check-up and review your current medications. If you don't have a primary care physician and aren't sure how to find one, ask your insurance provider or reach out to City General Hospital for help". This should be the same for all guidance (lawyer, therapist, etc.)
        11. Do not use the ```markdown tag or such, it's only for the example, the content you'll generate is already in markdown.
        12. Since no specific resources are available, focus on actionable steps the client can take independently or general ways to find appropriate services.
        """)

    message = HumanMessage(content=content)

    result_messages = []
    messages = state["messages"] + [message]

    try:
        temp_response = await model.with_retry(
            stop_after_attempt=5,
            retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
        ).ainvoke(messages, config)
    except Exception as error:
        logger.error(
            "Failed to generate initial section content",
            section=section,
            error=str(error),
        )

    # Get annotations and notes
    logger.debug("Getting annotations and notes for the section", section=section)
    prompt = HumanMessage(
        content=dedent(f"""Find relevant annotations and notes for this section. This content is for the case worker only and does not need to be addressed to the client
        Section title: {section}
        Section content: {temp_response.content}

        For the notes, provide information about what you should be prepared to talk with the client.
        For example, if the recommandations within the section may incur new costs for the client or are expensive, which may be difficult depending on their financial situation, you should be prepared. If it's the case, write a little note to discuss options that are covered by their insurance or available for free in the community, or ways to defer this care until after they've become more financially stable.
        It could be about money, time, or any other constraint that could be a barrier to the recommandations.
        """)
    )
    annotations = (
        await model.with_structured_output(ActionPlanSectionPartial)
        .with_retry(
            stop_after_attempt=5,
            retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
        )
        .ainvoke(messages + [prompt], config)
    )

    logger.debug("Refinining the content of the section", section=section)
    prompt = HumanMessage(
        content=f"Perfect, now let's refine the content of the section '{section}'."
        "1. Have a introduction of the section addressed to the client, summarizing what can be done"
        "2. Copy back the timeline you generated in the previous step, refine it if the timeline seems too long or too short"
        "3. Ensure the timeline is actionable."
        "4. The content must be markdown, and no title, except for the short/long term plan."
        "5. Use ## for the short/long term plan."
    )
    final_response = await model.with_retry(
        stop_after_attempt=5,
        retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
    ).ainvoke(messages + [temp_response] + [prompt], config)
    result_messages.append(final_response)

    resource_ids = extract_uuids_from_links(final_response.content)
    suggested_resources = []
    for resource_id in resource_ids:
        for resource in resources:
            if resource.id == resource_id:
                suggested_resources.append(resource)
                break

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
        client_extracted_info,
        previous_sections: list[str] | None,
        thread_id,
    ):
        self.client_data = client_data
        self.decision_tree_statements = decision_tree_statements
        self.client_extracted_info = client_extracted_info
        self.previous_sections = previous_sections

        self.config = {
            "configurable": {"thread_id": thread_id},
            "callbacks": [self.custom_metrics_callback],
            "recursion_limit": 50,
        }
        if tracer:
            self.config["callbacks"].append(tracer)

        ### llm calls
        async def call_reflexion(state: ExtendedMessagesState):
            logger.debug("Self reflexion on the action plan")

            if not self.previous_sections:
                # first original generation
                message = HumanMessage(
                    content="Before generating the action plan, let's first identify the area of needs/risk that we should focus on."
                    "Please provide some context about the client's situation and what could be useful for him/her."
                    "Do not generate the action plan yet."
                )
            else:
                # It's a forced-generation, but let's try to keep the same section
                message = HumanMessage(
                    content="Before generating the action plan, let's first identify the area of needs/risk that we should focus on."
                    f"You previously identified these areas: {', '.join(self.previous_sections)}."
                    "Please provide some context about the client's situation and what could be useful for him/her."
                    "Do not generate the action plan yet."
                )
            state["messages"].append(message)
            response = await model.with_retry(
                stop_after_attempt=5,
                retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
            ).ainvoke(state["messages"], self.config)

            state["messages"].append(response)
            return state

        async def call_area_of_needs(state: ExtendedMessagesState):
            logger.debug("Generating area of needs")

            message = HumanMessage(
                content="Compile a list of areas of needs/risk that the client is facing."
                "We'll call them section."
                "Combine the propositions that are semantically close to each other, and provide a clear title."
                "Avoid title like 'X and Y'."
                "An area of needs/risk should be a short title without description."
            )

            state["messages"].append(message)

            if self.previous_sections:
                # since we already got the area of needs from a previous generation, let's output them here.
                # as we don't want to mess with the context, we include them as if they were actually an answer from the LLM.
                response = AreaOfRiskNeeds(sections=self.previous_sections)
                logger.debug("Re-using previous generated section")
            else:
                response = (
                    await model.with_structured_output(AreaOfRiskNeeds)
                    .with_retry(
                        stop_after_attempt=5,
                        retry_if_exception_type=(
                            OpenAIRateLimitError,
                            AnthropicRateLimitError,
                        ),
                    )
                    .ainvoke(state["messages"], self.config)
                )

            state["messages"].append(AIMessage(content=response.json()))
            logger.debug("Sections to work on", sections=response.sections)
            state["sections_to_generate"] = response.sections

            return state

        async def call_resources_options(state: ExtendedMessagesState):
            logger.debug("Identifying resource options")

            message = HumanMessage(
                content=dedent("""
                1. For each area of needs/risk, choose the most relevant resources types to query in the resource pipeline.
                2. The same resource type cannot be used for multiple sections.
                3. If assessment data is available, prioritize resources for areas with higher risk scores or identified problems.
                """)
            )
            state["messages"].append(message)
            associations = (
                await model.with_structured_output(ActionPlanResourcesAssociations)
                .with_retry(
                    stop_after_attempt=5,
                    retry_if_exception_type=(
                        OpenAIRateLimitError,
                        AnthropicRateLimitError,
                    ),
                )
                .ainvoke(state["messages"], self.config)
            )
            state["messages"].append(AIMessage(content=associations.json()))
            state["resources_associations"] = associations

            return state

        async def call_generate_section_node(state: ExtendedMessagesState):
            return await call_generate_section(config=self.config, state=state)

        async def call_generate_timeline(state: MessagesState):
            logger.debug("Generating timeline")
            messages = state["messages"]
            message = HumanMessage(
                content=dedent("""
                Generate a timeline by compiling all tasks and keypoints identified for the action plan.
                1. Enumerate them week-by-week for the first two months, and then month-by-month thereafter.
                2. Ensure the timeline aligns with any urgent tasks that were identified in the previous sections.
                3. Prioritize the urgent needs first.
                4. Balance the non-urgent client tasks over a reasonable timeframes
                (e.g., if month 3 will have a lot of tasks related to applying for school,
                and finding part-time work can wait until month 4, delay it so they client isn't overwhelmed)
                5. Do not create unnecessary actions, it is OK if the timeline is not full.
                6. Take account of previous action success or failure.
                For example, instead of writing:
                ```markdown
                Week 1, Transportation: Explore public transit options by contacting X to learn about bus and train routes connecting your home and workplace.
                Week 2, Transportation: Continue exploring public transit options and finalize your understanding of routes and schedules.
                Week 3, Transportation: Evaluate carpool or ride-sharing options by reaching out to colleagues or local ride-sharing services.
                ```
                You should emphase on possible failure or success and ask the client to circle back to you:
                ```markdown
                Week 1, Transportation: Explore public transit options by contacting X to learn about bus and train routes connecting your home and workplace.
                Week 2, Transportation: Continue exploring public transit options. If none seem to be a good option for your home/work locations without significant burden, start evaluating carpool or ride-sharing options by reaching out to colleagues or local ride-sharing services.
                Week 3, Transportation: Continue exploring ride-share options if needed. If you haven't been able to find any viable transportation options between transit, ride-share, or carpool by the end of three weeks please reach out to me for help with a list of what you've investigated so far and what you found.
                ```
                """)
            )
            response = await model.with_retry(
                stop_after_attempt=5,
                retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
            ).ainvoke(messages + [message], self.config)
            messages.append(response)

            format_message = HumanMessage("Please format your message")

            timeline = (
                await model.with_structured_output(ActionPlanTimelines)
                .with_retry(
                    stop_after_attempt=5,
                    retry_if_exception_type=(
                        OpenAIRateLimitError,
                        AnthropicRateLimitError,
                    ),
                )
                .ainvoke(messages + [format_message], self.config)
            )

            state["generated_timeline"] = timeline
            return state

        async def call_generate_milestones(state: MessagesState):
            logger.debug("Generating milestones")
            messages = state["messages"]
            message = HumanMessage(
                content=dedent("""
                What are the key milestones that the client should aim for each section of the action plan?
                1. A milestone is a checkpoint for the you and the client can check to see if they're on-track.
                2. This should be the most important of the goals or outcomes from the sections up above. E.g., it should be less small tactical milestones (e.g., having applied for something) and more large milestone outcomes the you worker and the client can be aiming for (e.g., getting the driver's license, completing a course, etc.).
                3. Phrasing must be backward-looking, and gives something concrete to you to check if the client is still on track.
                For example, instead of "Successfully establish a consistent and reliable method of commuting to and from work, whether through public transit, carpooling, or ride-sharing", write "By the end of Week 8, you should have a reliable commute pattern that's been tested over several weeks—whether through transit, carpooling, ride-sharing, or another approach. This will significantly reduce the risk of interruptions to your employment"
                Such phrasing reinforce why this is important, and why the client should feed good about achieving it.
                4. Do not mention "This milestone", just "this" is enough to refer to the milestone.
                5. Do not write an introduction or conclusion, just the milestones.
                6. You can have one or more milestones per section.
                7. Organize the milestones in the same order as the sections, giving a title to each group of milestones.
                """)
            )
            messages.append(message)
            intermediate_response = await model.with_retry(
                stop_after_attempt=5,
                retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
            ).ainvoke(messages, self.config)

            # ignore the first generation as most of the time it's not ordered correctly nor grouped correctly
            # in my tests it's better to just let the llm do it, and ask to refine the output
            # we have no value to save the intermediate here
            # we just save the message after refinement

            intermediate_message = HumanMessage(
                content=(
                    "Ensure the order of the milestones is logical and that they build on each other."
                    "Group the milestones per section of the action plan."
                )
            )
            response = await model.with_retry(
                stop_after_attempt=5,
                retry_if_exception_type=(
                    OpenAIRateLimitError,
                    AnthropicRateLimitError,
                    ValidationError,
                ),
            ).ainvoke(
                messages + [intermediate_response, intermediate_message], self.config
            )
            messages.append(response)

            format_message = HumanMessage(
                "Please format the last message into milestones"
            )

            milestones = (
                await model.with_structured_output(ActionPlanMilestones)
                .with_retry(
                    stop_after_attempt=5,
                    retry_if_exception_type=(
                        OpenAIRateLimitError,
                        AnthropicRateLimitError,
                    ),
                )
                .ainvoke(messages + [format_message], self.config)
            )

            state["generated_milestones"] = milestones
            return state

        async def call_generate_action_plan(state: ExtendedMessagesState):
            logger.debug("Generating action plan")

            message = HumanMessage(
                content="Now you can generate the action plan by combining all your research."
                "Do not use the resources in this step."
                "Always refer to the client as 'you'."
            )
            state["messages"].append(message)
            response = (
                await model.with_structured_output(ActionPlanPartial)
                .with_retry(
                    stop_after_attempt=5,
                    retry_if_exception_type=(
                        OpenAIRateLimitError,
                        AnthropicRateLimitError,
                    ),
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
        workflow.add_node("reflexion", call_reflexion)
        workflow.add_node("area_of_needs", call_area_of_needs)
        workflow.add_node("resources", call_resources_options)
        workflow.add_node("section", call_generate_section_node)
        workflow.add_node("timeline", call_generate_timeline)
        workflow.add_node("milestones", call_generate_milestones)
        workflow.add_node("assemble", call_generate_action_plan, retry=RetryPolicy())

        # Links
        workflow.add_edge(START, "reflexion")
        workflow.add_edge("reflexion", "area_of_needs")
        workflow.add_edge("area_of_needs", "resources")
        workflow.add_conditional_edges("resources", call_generate_sections)
        workflow.add_edge("section", "timeline")
        workflow.add_edge("timeline", "milestones")
        workflow.add_edge("milestones", "assemble")
        workflow.add_edge("assemble", END)

        self.graph = workflow.compile()
        print(self.graph.get_graph().draw_mermaid())

    async def generate(self):
        # Use the Runnable
        user_prompt = dedent(f"""
        ---
        Client Data: {self.client_data}
        ---
        """)

        if self.decision_tree_statements:
            user_prompt += f"Decision Tree Recommendations: ```{self.decision_tree_statements}```\n\n---\n\n"

        events = self.graph.astream(
            {
                "messages": [
                    ("user", system_message),
                    ("user", user_prompt),
                ],
                "sections_to_generate": [],
                "generated_sections": [],
                "plan": None,
                "generated_timeline": None,
                "generated_milestones": None,
                "client_extracted_info": self.client_extracted_info,
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
        plan = ActionPlan(
            immediate_needs=final_state["plan"].immediate_needs,
            milestones=final_state["generated_milestones"].milestones,
            timeline=final_state["generated_timeline"].timelines,
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

    async def main():
        agent = LLMAgentGenerate(
            client_data=client_data,
            decision_tree_statements=decision_tree_statements,
            thread_id=12345,
        )
        action_plan = await agent.generate()

        import json

        print(json.dumps(action_plan.model_dump()))

    asyncio.run(main())
