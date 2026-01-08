from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph

from app.core.config import tracer
from app.core.data_config.assessment_configs.assessment_config import ModelConfig
from app.utils.CustomMetricsCallbackHandler import CustomMetricsCallbackHandler
from app.utils.langsmith_utils import create_langsmith_metadata, create_langsmith_tags
from app.utils.llm_retry_config import DEFAULT_MAX_RETRIES, ERRORS_TO_RETRY_ON


# Graph state
class ExtendedMessagesState(MessagesState):
    result: dict
    question: str


class LLMAgentQA:
    """
    A class to interact with the LLM agent for QA purposes.

    It allows you to create one instance with a system prompt and thread_id,
    then ask multiple questions without duplicating this initial information,
    and keep all questions in the same context, both in terms of what is passed
    to the llm, and of how it is tracked in langsmith.

    Optionally, you can pass a result_class to the call method to get a
    structured output.

    Args:
        system_prompt: The system prompt to initialize the agent
        thread_id: Thread identifier for LangSmith grouping
        model_config: Model configuration (provider, name, version)
        run_name: Name for the LangSmith trace (default: "QA-Agent")
        workflow_type: Type of workflow for metadata/tags (e.g., 'intake_summary')
        client_pseudo_id: Client ID for metadata tracking
        metrics_prefix: Optional prefix for Redis metrics tracking via CustomMetricsCallbackHandler.
                       If provided, enables token/cost tracking in Redis.
    """

    initial_call = True
    result_class = None

    def __init__(
        self,
        system_prompt,
        thread_id,
        model_config: ModelConfig,
        run_name: str = "QA-Agent",
        workflow_type: str | None = None,
        client_pseudo_id: str | None = None,
        metrics_prefix: str | None = None,
    ):
        # Create model from action_plan_config.small_model
        from app.core.config import create_model_from_config

        model = create_model_from_config(
            model_config.provider,
            model_config.name,
            model_config.version,
        )

        self.run_name = run_name
        self.thread_id = thread_id
        self.workflow_type = workflow_type
        self.client_pseudo_id = client_pseudo_id
        self.custom_metrics = None

        # Build config with LangSmith metadata and tags
        self.config: RunnableConfig = {
            "configurable": {"thread_id": thread_id},
            "callbacks": [],
            "run_name": run_name,
            "metadata": create_langsmith_metadata(
                client_pseudo_id=client_pseudo_id,
                workflow_type=workflow_type or "qa_agent",
                model_provider=model_config.provider,
                model_name=model_config.name,
            ),
            "tags": create_langsmith_tags(
                workflow_type=workflow_type or "qa_agent",
            ),
        }

        # Add custom metrics callback if prefix provided (for token/cost tracking)
        if metrics_prefix:
            self.custom_metrics = CustomMetricsCallbackHandler(prefix=metrics_prefix)
            self.config["callbacks"].append(self.custom_metrics)

        if tracer:
            self.config["callbacks"].append(tracer)
        self.sytem_prompt = system_prompt

        self.model = model

        self.checkpointer = MemorySaver()

        def call_model(state: ExtendedMessagesState):
            messages = state["messages"]
            if self.result_class:
                response = self.model.with_structured_output(self.result_class).invoke(
                    messages, config=self.config
                )
                return {
                    "messages": [AIMessage(response.model_dump_json())],
                    "result": response,
                }
            else:
                response = self.model.invoke(messages, config=self.config)
                return {"messages": [response], "result": None}

        workflow = StateGraph(ExtendedMessagesState)

        # Use semantic node name for LangSmith legibility
        workflow.add_node("qa_model_call", call_model)

        workflow.add_edge(START, "qa_model_call")

        self.graph = workflow.compile(checkpointer=self.checkpointer)

    async def call(self, message, result_class=None):
        messages: list[HumanMessage | SystemMessage] = [HumanMessage(message)]
        self.result_class = result_class

        if self.initial_call:
            self.initial_call = False
            messages.insert(0, SystemMessage(self.sytem_prompt))

        # Include run_name in config for LangSmith trace legibility
        invoke_config = {
            **self.config,
            "run_name": self.run_name,
        }

        final_state = await self.graph.with_retry(
            stop_after_attempt=DEFAULT_MAX_RETRIES,
            retry_if_exception_type=ERRORS_TO_RETRY_ON,
        ).ainvoke(
            {"messages": messages, "result": None, "question": message},
            config=invoke_config,
        )

        if self.result_class:
            return final_state["result"]

        return final_state["messages"][-1].content
