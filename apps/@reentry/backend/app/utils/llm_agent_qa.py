from anthropic import RateLimitError as AnthropicRateLimitError
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from openai import RateLimitError as OpenAIRateLimitError

from app.core.config import dt_model as model
from app.core.config import tracer


### Graph state
class ExtendedMessagesState(MessagesState):
    result: dict
    question: str


class LLMAgentQA:
    """
    A class to interact with the LLM agent for QA purposes.
    It allows you to create one instance with a system prompt and thread_id, then ask multiple questions without duplicating this initial informaion, and keep all questions in the same context, both in terms of what is passed to the llm, and of how it is tracked in langsmith.
    Optionnaly, you can pass a result_class to the call method to get a structured output.
    """

    initial_call = True
    result_class = None

    def __init__(self, system_prompt, thread_id):
        self.config: RunnableConfig = {
            "configurable": {"thread_id": thread_id},
            "callbacks": [],
        }
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

        workflow.add_node("agent", call_model)

        workflow.add_edge(START, "agent")

        self.graph = workflow.compile(checkpointer=self.checkpointer)

    async def call(self, message, result_class=None):
        messages: list[HumanMessage | SystemMessage] = [HumanMessage(message)]
        self.result_class = result_class

        if self.initial_call:
            self.initial_call = False
            messages.insert(0, SystemMessage(self.sytem_prompt))

        final_state = await self.graph.with_retry(
            stop_after_attempt=5,
            retry_if_exception_type=(OpenAIRateLimitError, AnthropicRateLimitError),
        ).ainvoke(
            {"messages": messages, "result": None, "question": message},
            config=self.config,
        )

        if self.result_class:
            return final_state["result"]

        return final_state["messages"][-1].content
