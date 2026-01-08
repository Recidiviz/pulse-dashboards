from typing import Any, Literal
from uuid import UUID

import structlog
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from app.models.decision_tree import DecisionTree
from app.utils.langsmith_utils import build_langsmith_config
from app.utils.llm_agent_qa import LLMAgentQA
from app.utils.mermaid import (
    MermaidGraph,
    MermaidGraphTraversalEnd,
    MermaidGraphTraversalQuestion,
    MermaidGraphTraversalStatement,
    MermaidParser,
)

logger = structlog.get_logger(__name__)

# =============================================================================
# Decision tree selection
# =============================================================================


class Annotation(BaseModel):
    source: str = Field(description="The source of the annotation")
    source_location: str = Field(
        description="The location of the annotation in the source"
    )
    source_text_extract: str = Field(description="The text extract of the annotation")


class DecisionTreeSelection(BaseModel):
    decision_tree_key: str = Field(description="The key of the decision tree")
    annotations: list[Annotation] = Field(
        description="The annotations of the decision tree"
    )


class DecisionTreeSelections(BaseModel):
    selection: list[DecisionTreeSelection]


DT_SELECTION_SYSTEM_PROMPT = (
    "You are an agent specialized to find out which facts correspond the most to the client's situation. "
    "Based on the facts, you will be able to determine which decision tree to apply. "
    "You'll receive all the questions/answers of the client, as well as additional information about the client. "
    "You'll be given a list of possible decision tree that could applies to the client's situation. "
    "You must answer with the list of decision trees that applies the most to the client's situation. "
)
DT_SELECTION_PROMPT = (
    "# Client intake\n{client_messages}\n\n"
    "# Client intake summary\n{client_summary}\n\n"
    "# Available decision trees\n{decision_trees}\n\n"
    "\n\n"
    "You search for the applicable decisions trees based on the client's situation. "
    "For each decision tree, ask yourself if the client's situation corresponds to the decision tree. "
    "For each applicable decision tree, you must provide the source of the decision tree "
    "and the text extract that corresponds to the client's situation. "
    "Add as many annotations as needed."
    "Use `source` to indicate which document you used (e.g. Client intake, etc.). "
    "Use `source_location` to indicate in a consise way where in the document you found the information (Question X);"
    "Use `source_text_extract` to give an extract/citation that corresponds to the client's situation. "
)

# =============================================================================
# Decision tree execution
# =============================================================================


class DecisionTreeExecution(BaseModel):
    answer: str = Field(description="The possible answer that is best suited")
    annotations: list[Annotation] = Field(description="The annotations of the answer")


DT_EXECUTION_SYSTEM_PROMPT = (
    "You are a AI designed to assist a social worker for intake interviews. "
    "You are give a list of question/answers and additional informations from a client. "
    "Based on theses informations, you are going to be asked question about the client's situation. "
    "You'll look back on the client situation and formalize an answer to our questions. "
    "# Client intake\n{client_messages}\n\n"
    "# Client intake summary\n{client_summary}\n\n"
)
DT_EXECUTION_PROMPT = (
    "Based on the client's situation, {question}?\n"
    "You MUST choose EXACTLY one of these possible answers: {possible_answers}\n"
    "Do NOT use any other words or phrases for your answer. Choose the most appropriate option from the list above.\n"
    "If you cannot determine a clear answer from the available information, "
    "choose the most reasonable option based on what you know.\n"
    "Describe the answer by adding annotations.\n"
    "Use `source` to indicate which document you used (e.g. Client intake, etc.). "
    "Use `source_location` to indicate in a consise way where in the document you found the information (Question X);"
    "Use `source_text_extract` to give an extract/citation that corresponds to the client's situation. "
)


# =============================================================================
# Result of a decision tree runner
# =============================================================================


class DecisionTreeRunnerStep(BaseModel):
    node_key: str = Field(description="Node traversed during the execution")
    node_value: str | None = Field(description="Value of the node, for reference")
    node_type: str = Field(description="Type of the node, for reference")
    annotations: list[Annotation] | None = Field(
        description="The annotations of the answer (for question only)",
        default=None,
    )


class DecisionTreeRunnerResult(BaseModel):
    steps: list[DecisionTreeRunnerStep] = Field(
        description="The steps of the decision tree runner",
        default=[],
    )
    statements: list[str] = Field(
        description="The statements of the decision tree runner",
        default=[],
    )


# =============================================================================
# LangGraph State for Decision Tree Traversal
# =============================================================================


class DecisionTreeTraversalState(TypedDict):
    """State for the decision tree traversal LangGraph workflow."""

    tree_name: str
    tree: MermaidGraph | None
    generator: Any  # The tree traversal generator
    current_step: Any  # Current MermaidGraphTraversal* object
    current_step_type: str  # Type of current step for routing
    steps: list[DecisionTreeRunnerStep]
    statements: list[str]
    agent: LLMAgentQA | None
    is_complete: bool
    # Context data needed for agent creation
    client_messages: str
    client_summary: str
    client_assessment_summary: str
    system_prompt: str
    last_annotations: list[Annotation] | None


# =============================================================================
# LangGraph Node Handlers (class-based approach)
# =============================================================================


class DecisionTreeTraversalNodes:
    """
    Encapsulates all LangGraph node handlers for decision tree traversal.
    """

    def __init__(self, runner: "DecisionTreeRunner"):
        """
        Initialize with a reference to the parent DecisionTreeRunner.

        Args:
            runner: The DecisionTreeRunner instance that owns this handler.
        """
        self.runner = runner

    async def dt_initialize(
        self, state: DecisionTreeTraversalState
    ) -> DecisionTreeTraversalState:
        """Initialize the decision tree traversal - start the generator and get first step."""
        tree = self.runner.decision_trees[state["tree_name"]]
        generator = tree.traverse()
        first_step = next(generator)

        # Determine step type for routing
        step_type = self._get_step_type(first_step)

        # Create agent for this traversal
        task_id_short = (
            self.runner.task_id.hex[:8] if self.runner.task_id else "unknown"
        )
        dt_name_short = (
            state["tree_name"][:20].replace(" ", "_")
            if state["tree_name"]
            else "unknown"
        )
        semantic_thread_id = f"dt-exec-{dt_name_short}-{task_id_short}"

        agent = LLMAgentQA(
            system_prompt=state["system_prompt"],
            thread_id=semantic_thread_id,
            model_config=self.runner.model,
            run_name=f"DecisionTree-Execute-{state['tree_name']}",
            workflow_type="decision_tree_execution",
        )

        return {
            **state,
            "tree": tree,
            "generator": generator,
            "current_step": first_step,
            "current_step_type": step_type,
            "agent": agent,
        }

    async def dt_evaluate(
        self, state: DecisionTreeTraversalState
    ) -> DecisionTreeTraversalState:
        """Evaluate the current step and record it in results."""
        step = state["current_step"]
        node_type = step.__class__.__name__.replace("MermaidGraphTraversal", "").lower()

        step_logger = logger.bind(
            node_key=step.node_key,
            node_type=node_type,
        )
        step_logger.info("Processing step", step=step)

        # Create step result
        step_result = DecisionTreeRunnerStep(
            node_key=step.node_key,
            node_value=step.node_value,
            node_type=node_type,
            annotations=state.get("last_annotations"),
        )

        # Clear last_annotations after using them
        new_steps = state["steps"] + [step_result]

        return {
            **state,
            "steps": new_steps,
            "last_annotations": None,
        }

    async def dt_ask_question(
        self, state: DecisionTreeTraversalState
    ) -> DecisionTreeTraversalState:
        """Ask LLM to answer a decision tree question."""
        step: MermaidGraphTraversalQuestion = state["current_step"]
        agent: LLMAgentQA = state["agent"]
        generator = state["generator"]

        step_logger = logger.bind(node_key=step.node_key)
        step_logger.info("Question step", question=step.question)

        # Ask LLM for answer
        llm_result = await self.runner.ask_decision_tree_question_llm(
            step.question, step.answers, agent
        )

        # Send answer back to generator to advance
        next_step = generator.send(llm_result.answer)

        # Determine next step type for routing
        next_step_type = self._get_step_type(next_step)

        return {
            **state,
            "generator": generator,
            "current_step": next_step,
            "current_step_type": next_step_type,
            "last_annotations": llm_result.annotations,
        }

    async def dt_record_statement(
        self, state: DecisionTreeTraversalState
    ) -> DecisionTreeTraversalState:
        """Record a statement and advance to next step."""
        step: MermaidGraphTraversalStatement = state["current_step"]
        generator = state["generator"]
        statements = state["statements"]

        # Record statement if present
        if step.node_value:
            statements = statements + [step.node_value]

        # Advance to next step
        next_step = next(generator)
        next_step_type = self._get_step_type(next_step)

        return {
            **state,
            "generator": generator,
            "current_step": next_step,
            "current_step_type": next_step_type,
            "statements": statements,
        }

    async def dt_complete(
        self, state: DecisionTreeTraversalState
    ) -> DecisionTreeTraversalState:
        """Mark traversal as complete."""
        step_logger = logger.bind(node_key=state["current_step"].node_key)
        step_logger.info(
            "End of decision tree execution",
            steps=len(state["steps"]),
            statements=len(state["statements"]),
        )

        return {
            **state,
            "is_complete": True,
        }

    def route_by_step_type(
        self, state: DecisionTreeTraversalState
    ) -> Literal["dt_ask_question", "dt_record_statement", "dt_complete"]:
        """Route to appropriate handler based on step type."""
        step_type = state["current_step_type"]
        if step_type == "end":
            return "dt_complete"
        elif step_type == "question":
            return "dt_ask_question"
        else:
            return "dt_record_statement"

    def _get_step_type(self, step) -> str:
        """Determine the type of a traversal step for routing."""
        if isinstance(step, MermaidGraphTraversalEnd):
            return "end"
        elif isinstance(step, MermaidGraphTraversalQuestion):
            return "question"
        elif isinstance(step, MermaidGraphTraversalStatement):
            return "statement"
        else:
            # For any other type (start, answer, count), treat as statement
            return "other"


# =============================================================================
# Decision Tree Runner
# =============================================================================


class DecisionTreeRunner:
    def __init__(self, action_plan_config, task_id=UUID | None):
        if not action_plan_config:
            raise ValueError(
                "action_plan_config is required - cannot run decision tree without configuration"
            )

        self.decision_trees = {}
        self.client_messages = ""
        self.client_summary = ""
        self.client_assessment_summary = ""
        self.task_id = task_id
        self.model = action_plan_config.small_model

        # Initialize the node handlers
        self.traversal_nodes = DecisionTreeTraversalNodes(self)

        # Build the LangGraph workflow for tree traversal
        self._build_traversal_graph()

    def _build_traversal_graph(self):
        """Build LangGraph workflow for decision tree traversal with named nodes."""
        # Build the graph with semantic node names for LangSmith visibility
        workflow = StateGraph(DecisionTreeTraversalState)

        # Add nodes with descriptive names that appear in LangSmith
        workflow.add_node("dt_initialize", self.traversal_nodes.dt_initialize)
        workflow.add_node("dt_evaluate", self.traversal_nodes.dt_evaluate)
        workflow.add_node("dt_ask_question", self.traversal_nodes.dt_ask_question)
        workflow.add_node(
            "dt_record_statement", self.traversal_nodes.dt_record_statement
        )
        workflow.add_node("dt_complete", self.traversal_nodes.dt_complete)

        # Define edges
        workflow.add_edge(START, "dt_initialize")
        workflow.add_edge("dt_initialize", "dt_evaluate")
        workflow.add_conditional_edges(
            "dt_evaluate",
            self.traversal_nodes.route_by_step_type,
            {
                "dt_ask_question": "dt_ask_question",
                "dt_record_statement": "dt_record_statement",
                "dt_complete": "dt_complete",
            },
        )
        # After processing, go back to evaluate for next step
        workflow.add_edge("dt_ask_question", "dt_evaluate")
        workflow.add_edge("dt_record_statement", "dt_evaluate")
        workflow.add_edge("dt_complete", END)

        self.traversal_graph = workflow.compile()

    def set_client_messages(self, messages):
        self.client_messages = messages
        if isinstance(messages, list):
            # Convert list of messages to a single string
            # messages are openai-based with role
            formatted_client_messages = []
            for message in messages:
                role = message["role"]
                content = message["content"]
                line = f"{role}: {content}"
                formatted_client_messages.append(line)
            self.client_messages = "\n".join(formatted_client_messages)

    def set_client_summary(self, summary):
        self.client_summary = summary

    def set_client_assessment_summary(self, assessment_summary):
        self.client_assessment_summary = assessment_summary

    def load_decision_trees(self, decision_trees: list[DecisionTree]):
        """
        Load decision trees into the runner.
        """
        for dt in decision_trees:
            revision = dt.revisions[-1]
            self.load_decision_tree_content(dt.name, revision.mermaid_content)

    def load_decision_tree_content(self, name, content):
        """
        Load a decision tree by parsing its content and storing it within the runner.

        This function takes the name and mermaid content of a decision tree,
        parses the content using a mermaid parser, and stores the resulting
        graph structure in the decision_trees attribute.
        """
        # iterate over all decision trees at data/examples/decisiontrees
        graph = MermaidParser.parse(content)
        self.decision_trees[name] = graph

        start_key = graph.get_start_node_key()
        start = graph.get_node(start_key)["value"].replace("Start: ", "")

        print(f"Loaded: {name} - {start}")

    async def find_decision_trees_to_applies(self) -> list[DecisionTreeSelection]:
        """
        Find the decision trees that applies to the client's situation
        """
        # Create semantic thread_id for LangSmith legibility
        task_id_short = self.task_id.hex[:8] if self.task_id else "unknown"
        semantic_thread_id = f"dt-selection-{task_id_short}"

        agent = LLMAgentQA(
            system_prompt=DT_SELECTION_SYSTEM_PROMPT,
            thread_id=semantic_thread_id,
            model_config=self.model,
            run_name="DecisionTree-Selection",
            workflow_type="decision_tree_selection",
        )

        data = {
            "client_messages": self.client_messages,
            "client_summary": self.client_summary,
            "client_assessment_summary": self.client_assessment_summary,
            "decision_trees": self.decision_tree_formatted,
        }
        message = DT_SELECTION_PROMPT.format(**data)
        output = await agent.call(message, DecisionTreeSelections)
        self.selected_decision_trees = output.selection
        return self.selected_decision_trees

    async def run_decision_tree(
        self, decision_tree_name: str
    ) -> DecisionTreeRunnerResult:
        """
        Execute the given decision tree using LangGraph workflow.

        This method uses a LangGraph workflow for full visibility in LangSmith,
        with named nodes for each step type (initialize, evaluate, ask_question,
        record_statement, complete).
        """
        # Prepare system prompt
        data = {
            "client_messages": self.client_messages,
            "client_summary": self.client_summary,
            "client_assessment_summary": self.client_assessment_summary,
        }
        system_prompt = DT_EXECUTION_SYSTEM_PROMPT.format(**data)

        # Initial state for the LangGraph workflow
        initial_state: DecisionTreeTraversalState = {
            "tree_name": decision_tree_name,
            "tree": None,
            "generator": None,
            "current_step": None,
            "current_step_type": "",
            "steps": [],
            "statements": [],
            "agent": None,
            "is_complete": False,
            "client_messages": self.client_messages,
            "client_summary": self.client_summary,
            "client_assessment_summary": self.client_assessment_summary,
            "system_prompt": system_prompt,
            "last_annotations": None,
        }

        # Build config for LangSmith tracing
        task_id_short = self.task_id.hex[:8] if self.task_id else "unknown"
        dt_name_short = (
            decision_tree_name[:20].replace(" ", "_")
            if decision_tree_name
            else "unknown"
        )

        config = build_langsmith_config(
            thread_id=f"dt-traversal-{dt_name_short}-{task_id_short}",
            run_name=f"DecisionTree-Traversal-{decision_tree_name}",
            workflow_type="decision_tree_traversal",
            recursion_limit=100,  # Higher limit for complex trees
            decision_tree_name=decision_tree_name,
        )

        # Execute the LangGraph workflow
        final_state = await self.traversal_graph.ainvoke(initial_state, config)

        return DecisionTreeRunnerResult(
            steps=final_state["steps"],
            statements=final_state["statements"],
        )

    async def ask_decision_tree_question_llm(
        self, question: str, possible_answers: list[str], agent: LLMAgentQA
    ) -> DecisionTreeExecution:
        """
        Asks a decision tree question using a language model.

        This function utilizes a language model to assist in answering decision
        tree questions based on the provided client intake extractions and the
        possible answers to the question.

        The interaction with the language model involves formatting the necessary
        data into a compatible structure and invoking the model to obtain a
        result which is then parsed into a pydantic object.
        """
        data = {
            "question": question,
            "possible_answers": possible_answers,
        }

        result = await agent.call(
            DT_EXECUTION_PROMPT.format(**data), result_class=DecisionTreeExecution
        )
        return result

    @property
    def decision_tree_formatted(self):
        def format_decision_tree(key, e):
            start_key = e.get_start_node_key()
            start = e.get_node(start_key)["value"].replace("Start: ", "")
            return f"- id:{key} title:{start}\n"

        return "".join(
            [format_decision_tree(k, e) for k, e in self.decision_trees.items()]
        )
