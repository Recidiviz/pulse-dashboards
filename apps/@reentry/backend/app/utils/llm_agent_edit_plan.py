from textwrap import dedent
from typing import Literal

import structlog
from anthropic import RateLimitError as AnthropicRateLimitError
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, START, StateGraph
from langgraph.types import Send
from openai import RateLimitError as OpenAIRateLimitError
from pydantic import BaseModel, Field

from app.core.config import gen_model as model
from app.core.config import tracer
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

from .llm_agent_gen_plan import call_generate_section
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
        current_timeline: ActionPlanTimelines | None = None,
        current_milestones: ActionPlanMilestones | None = None,
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

        async def call_select_starting_node(state: ExtendedMessagesState):
            logger.debug("Selecting starting node")
            sections = state["current_sections"]
            sections_titles = ", ".join([s.title for s in sections])
            message = HumanMessage(
                content=f"Here are the previous sections titles: {sections_titles}."
                "To accomplish the user's intructions, go though this list, for each section recall its content and decide how the user instruction applies."
                "You can add a new section, remove a section, or change the title and/or content of a section."
                "To merge two sections, use the add action for the new section and the remove action for the old sections."
                "If no action is needed for a section, just skip the section."
                "Only remove a section if explicitely asked, otherwise modify its content"
            )
            logger.debug(message.content)
            response = (
                await model.with_structured_output(RegenerationAction)
                .with_retry(
                    stop_after_attempt=5,
                    retry_if_exception_type=(
                        OpenAIRateLimitError,
                        AnthropicRateLimitError,
                    ),
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
            prompt = HumanMessage(
                content=dedent(f"""
                Perfect, now let's edit the section '{section}' according to the new instructions:
                {self.extra_instructions}.
                Apply the part of the instructions that are relevant to this section.
                Do not change the structure of the content unless asked to do so.
                Here is the markdown content of the current section: ```{clean_markdown_content}```
                """)
            )

            response = await model.with_retry(
                stop_after_attempt=5,
                retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
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
            return await call_generate_section(self.config, state)

        async def call_generate_timeline(state: ExtendedMessagesState):
            logger.debug("Generating timeline")
            messages = state["messages"]
            messages.append(
                HumanMessage(
                    content=f"Edit the timeline according to the new instructions: {self.extra_instructions}."
                    "Do not change the content structure unless asked to do so."
                )
            )
            response = await model.with_retry(
                stop_after_attempt=5,
                retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
            ).ainvoke(messages, self.config)
            messages.append(response)

            timeline = (
                await model.with_structured_output(ActionPlanTimelines)
                .with_retry(
                    stop_after_attempt=5,
                    retry_if_exception_type=(
                        OpenAIRateLimitError,
                        AnthropicRateLimitError,
                    ),
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
                HumanMessage(
                    content=f"Edit the milestones according to the new instructions: {self.extra_instructions}."
                    "Do not change the content structure unless asked to do so."
                )
            )
            response = await model.with_retry(
                stop_after_attempt=5,
                retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
            ).ainvoke(messages, self.config)
            messages.append(response)

            milestones = (
                await model.with_structured_output(ActionPlanMilestones)
                .with_retry(
                    stop_after_attempt=5,
                    retry_if_exception_type=(
                        OpenAIRateLimitError,
                        AnthropicRateLimitError,
                    ),
                )
                .ainvoke(state["messages"], self.config)
            )

            if milestones:
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
        workflow.add_node("section", _call_generate_section)
        workflow.add_node("section-change", call_generate_section_change)
        workflow.add_node("assemble", call_generate_action_plan)
        workflow.add_node("select_starting_node", call_select_starting_node)
        workflow.add_node("timeline", call_generate_timeline)
        workflow.add_node("milestones", call_generate_milestones)

        # Links
        workflow.add_edge("section", "timeline")
        workflow.add_edge("section-change", "timeline")
        workflow.add_edge("timeline", "milestones")
        workflow.add_edge("milestones", "assemble")
        workflow.add_edge("assemble", END)

        workflow.add_edge(START, "select_starting_node")
        workflow.add_conditional_edges("select_starting_node", call_generate_sections)

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

        self.plan = ActionPlan(
            immediate_needs=final_state["plan"].immediate_needs,
            milestones=final_state["generated_milestones"].milestones,
            timeline=final_state["generated_timeline"].timelines,
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


if __name__ == "__main__":
    import asyncio

    from .messages import messages

    current_sections = [
        ActionPlanSection.model_validate(
            {
                "annotations": [
                    {
                        "source": "Client intake summary",
                        "source_location": "### Needs and Risks Overview",
                        "source_text_extract": "### Needs and Risks Overview",
                    },
                    {
                        "source": "Client intake summary",
                        "source_location": "### Priority Needs",
                        "source_text_extract": "### Priority Needs",
                    },
                ],
                "notes": "No transportation resources found. Consider local public transportation and carpooling options.",
                "title": "Transportation Issues",
                "markdown_content": "### Transportation Issues\n\n**Situation**: Allistor is currently facing transportation challenges due to a suspended driver's license, which affects his ability to commute to work and engage in daily activities. This situation has increased his dependency on his wife for transportation, adding further stress to family dynamics.\n\n**Useful Solutions**:\n- Exploring alternative transportation methods that can provide reliable and convenient options for commuting to work and other necessary places.\n- Considering public transportation options, carpooling with coworkers, or using ride-sharing services to maintain his work commitments and daily routines.\n- Ensuring that transportation solutions do not add further financial strain or inconvenience to his family.\n\n### Tasks to Address Transportation Needs\n\n1. **Research Public Transportation Options**: \n   - Look into local bus routes and schedules that connect Allistor's home to his workplace. Consider purchasing a transit pass if feasible.\n\n2. **Explore Carpooling Opportunities**: \n   - Discuss with coworkers the possibility of carpooling to and from work. This could reduce dependency on family and provide a consistent commuting option.\n\n3. **Consider Ride-Sharing Services**:\n   - Evaluate the cost and feasibility of using ride-sharing services like Uber or Lyft for essential travel, particularly for commuting to work.\n\n4. **Investigate Local Transportation Assistance Programs**:\n   - Reach out to local community centers or organizations that might offer transportation assistance programs for individuals facing temporary transportation challenges.\n\n5. **Develop a Long-term Transportation Plan**:\n   - Work with your caseworker to develop a sustainable transportation plan that includes reviewing the status of your driver's license and exploring options for reinstatement if applicable. \n\nBy following these tasks, you can find manageable and practical solutions to your transportation issues, reducing stress and maintaining your professional commitments.",
            }
        ),
        ActionPlanSection.model_validate(
            {
                "annotations": [
                    {
                        "source": "Client intake summary",
                        "source_location": "Priority Needs",
                        "source_text_extract": "Legal Support: Ongoing legal defense to manage charges related to the traffic incident.",
                    },
                    {
                        "source": "Client intake messages",
                        "source_location": "c71642ee-1758-43aa-9cd9-e19f0812ca90",
                        "source_text_extract": "No, I'm not a criminal. Honestly, it's a complete miscarriage of justice that we're evendoing this, I told the judge my attorneys were planning to appeal.",
                    },
                    {
                        "source": "Client intake messages",
                        "source_location": "bc6a1667-d723-4497-9797-616f5ab3de69",
                        "source_text_extract": "Look just to be clear, I was on prescription meds - which I had a prescription for! - at the time of the accident. My doctor gave them to me for my headaches, and I was disoriented by a headache when I started driving down the highway to begin with.",
                    },
                ],
                "title": "Legal Support",
                "markdown_content": "### Legal Support\n\n**Situation**: Allistor is currently navigating a legal challenge stemming from a traffic accident where he was under the influence of prescribed medication. This has not only led to financial strain due to legal fees but also added significant stress to his life. Ensuring adequate legal support is crucial for managing this situation effectively and working towards a resolution.\n\n**Useful Solutions**:\n- Connecting with legal aid services that can offer advice, representation, or resources to help manage the ongoing legal case.\n- Exploring financial assistance options to alleviate the burden of legal fees.\n- Regularly consulting with legal professionals to stay informed about the case's progress and make informed decisions.\n\n### Tasks to Address Legal Support Needs\n\n1. **Contact Legal Aid Services**:\n   - Reach out to [City Legal Assistance](#RESOURCE-1) at 800-700-8801 or visit them at 100 Justice St, Cityville for support and guidance.\n   - Alternatively, contact [Northside Legal Clinic](#RESOURCE-2) at 800-700-8802, located at 200 Court Rd, Northside.\n\n2. **Schedule a Consultation with Your Attorney**:\n   - Arrange regular meetings with your current attorney to discuss case updates and any concerns you might have.\n\n3. **Explore Financial Assistance for Legal Fees**:\n   - Investigate if there are any programs available that assist with covering legal fees, especially those offered by local organizations or community groups.\n\n4. **Gather and Organize Legal Documents**:\n   - Compile all relevant legal documents, prescriptions, and medical records that might support your case. This will be useful for your legal team to have a comprehensive view of your situation.\n\n5. **Stay Informed and Engaged**:\n   - Actively participate in the legal process by asking questions and ensuring you understand each step of the proceedings. This will help you make informed decisions.\n\nBy following these tasks, you can ensure that you have the necessary legal support and resources to navigate your current challenges effectively.",
            }
        ),
        ActionPlanSection.model_validate(
            {
                "annotations": [
                    {
                        "source": "Client intake summary",
                        "source_location": "### Needs and Risks Overview",
                        "source_text_extract": "Physical health concerns with headaches and high blood pressure.",
                    },
                    {
                        "source": "Client intake summary",
                        "source_location": "### Priority Needs",
                        "source_text_extract": "Managing stress levels related to work and home life.",
                    },
                    {
                        "source": "Client intake summary",
                        "source_location": "### Longer-term Needs",
                        "source_text_extract": "Monitoring and managing high blood pressure and effects of medication.",
                    },
                ],
                "notes": "No mental health resources were found. Consider recommending local community centers or hospitals for counseling or mental health support groups.",
                "title": "Health and Stress Management",
                "markdown_content": "### Health and Stress Management\n\n**Situation**: Allistor is experiencing health challenges, including chronic headaches and high blood pressure, which are compounded by the stress from his legal issues. Managing these health concerns is crucial to maintaining his overall well-being and ensuring he can effectively handle the demands of his personal and professional life.\n\n**Useful Solutions**:\n- Seeking regular medical check-ups to monitor and manage his health conditions, particularly his blood pressure and headaches.\n- Exploring stress management techniques or counseling services to help cope with the psychological strain of his current situation.\n- Engaging in activities that promote physical and mental well-being.\n\n### Tasks to Address Health and Stress Management Needs\n\n1. **Schedule Regular Medical Check-ups**:\n   - Visit [City General Hospital](#RESOURCE-3) by calling 800-600-7701 or visiting 100 Main St, Cityville for comprehensive medical care.\n   - Alternatively, for more immediate needs, consider [Downtown Urgent Care](#RESOURCE-4) at 50 Broad St, Cityville, phone: 800-600-7702.\n\n2. **Consult a Healthcare Provider about Medications**:\n   - Discuss your prescribed medications with your healthcare provider to ensure they are managed effectively alongside your lifestyle and stress levels.\n\n3. **Incorporate Stress Management Techniques**:\n   - Explore activities such as meditation, yoga, or deep-breathing exercises that can be practiced at home or through local classes.\n\n4. **Seek Counseling or Support Groups**:\n   - Although specific mental health resources were not identified, consider reaching out to local community centers or hospitals for recommendations on counseling services or support groups.\n\n5. **Engage in Regular Physical Activity**:\n   - Find time to engage in light physical activities, such as walking or participating in community sports, which can help reduce stress and improve health.\n\nBy focusing on these tasks, you can better manage your health and stress, ultimately contributing to a more balanced and resilient approach to life's challenges.",
            }
        ),
        ActionPlanSection.model_validate(
            {
                "annotations": [
                    {
                        "source": "Client intake summary",
                        "source_location": "Priority Needs",
                        "source_text_extract": "License suspension impacts ability to commute to work.",
                    },
                    {
                        "source": "Client intake messages",
                        "source_location": "c9d46ab5-36d1-4fd8-a25e-a8fe728a4593",
                        "source_text_extract": "my license is now suspended and I don't have a way to get to work anymore",
                    },
                    {
                        "source": "Decision Tree Recommendations",
                        "source_location": "employment_mobility",
                        "source_text_extract": "Facilitate connections with coworkers or local carpool programs",
                    },
                ],
                "notes": "No specific transportation resources were found for alternative commuting methods. Consider local community boards for carpool opportunities.",
                "title": "Family and Emotional Well-being",
                "markdown_content": "### Family and Emotional Well-being\n\n**Situation**: Allistor is married with four children, and the ongoing legal challenges are causing emotional strain within the family. His wife is currently supporting him by managing transportation needs, which adds to the family's stress. Ensuring emotional well-being and family support is critical during this challenging time.\n\n**Useful Solutions**:\n- Strengthening family relationships through open communication and shared activities.\n- Seeking family counseling or support services to navigate the emotional impacts of the legal situation.\n- Exploring childcare support options to provide relief and stability for the children.\n\n### Tasks to Address Family and Emotional Well-being Needs\n\n1. **Enhance Family Communication**:\n   - Set aside regular family meetings to discuss everyone's feelings and concerns, ensuring that each family member feels heard and supported.\n\n2. **Schedule Family Activities**:\n   - Plan activities that the whole family can enjoy together, such as a weekly game night or outdoor outings, to strengthen bonds and provide positive experiences.\n\n3. **Explore Family Counseling Options**:\n   - Although specific mental health resources were not identified, consider reaching out to local community centers or family services for recommendations on family counseling.\n\n4. **Consider Childcare Support**:\n   - Look into local childcare options or programs that can provide temporary relief for your wife and ensure that your children have a stable environment.\n\n5. **Create a Support Network**:\n   - Connect with friends, extended family, or community groups who can offer additional emotional or practical support during this time.\n\nBy focusing on these tasks, you can foster a supportive and resilient family environment, helping everyone cope with the current challenges more effectively.",
            }
        ),
    ]

    async def main():
        agent = LLMAgentEdit(messages, current_sections, thread_id=12345)

        instructions = "remove the section about transportation issues"
        print(f"Applying the instructions: {instructions}")
        action_plan = await agent.generate(extra_instructions=instructions)
        print(action_plan.action_plan)

        instructions = "replace the City General Hospital with Downtown Urgent Care"
        print(f"Applying the instructions: {instructions}")
        action_plan = await agent.generate(extra_instructions=instructions)
        print(action_plan.action_plan)

        instructions = "Split the mental health section into health section and mental health section. In the healt section, add taks to help the client understand the side effects of his medication"
        print(f"Applying the instructions: {instructions}")
        action_plan = await agent.generate(extra_instructions=instructions)
        print(action_plan.action_plan)

        instructions = "elaborate the timeline to include weekly check-ins with the client, and all the points listed in the sections"
        print(f"Applying the instructions: {instructions}")
        action_plan = await agent.generate(extra_instructions=instructions)
        print(action_plan.action_plan)

        instructions = "Remove the Youth Financial Support resource, replace it with some other resource"
        print(f"Applying the instructions: {instructions}")
        action_plan = await agent.generate(extra_instructions=instructions)
        print(action_plan.action_plan)

        instructions = "Add the section about transportation issues"
        print(f"Applying the instructions: {instructions}")
        action_plan = await agent.generate(extra_instructions=instructions)
        print(action_plan.action_plan)

    asyncio.run(main())
