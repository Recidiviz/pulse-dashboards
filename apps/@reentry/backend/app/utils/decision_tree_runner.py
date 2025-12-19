from uuid import UUID

import structlog
from pydantic import BaseModel, Field

from app.models.decision_tree import DecisionTree
from app.utils.llm_agent_qa import LLMAgentQA
from app.utils.mermaid import (
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
    "For each applicable decision tree, you must provide the source of the decision tree and the text extract that corresponds to the client's situation. "
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
    "# Client risk summary\n{client_assessment_summary}\n\n"
)
DT_EXECUTION_PROMPT = (
    "Based on the client's situation, {question}?\n"
    "You MUST choose EXACTLY one of these possible answers: {possible_answers}\n"
    "Do NOT use any other words or phrases for your answer. Choose the most appropriate option from the list above.\n"
    "If you cannot determine a clear answer from the available information, choose the most reasonable option based on what you know.\n"
    "Describe the answer by adding annotations.\n"
    "Use `source` to indicate which document you used (e.g. Client intake, etc.). "
    "Use `source_location` to indicate in a consise way where in the document you found the information (Question X);"
    "Use `source_text_extract` to give an extract/citation that corresponds to the client's situation. "
)

# set_debug(True)
# set_verbose(True)


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

        agent = LLMAgentQA(
            system_prompt=DT_SELECTION_SYSTEM_PROMPT,
            thread_id=self.task_id.hex,
            model_config=self.model,
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
        Execute the given decision tree based on the client's situation.

        This method traverses the decision tree graph, evaluating each node,
        and determining the flow based on client information and determined answers.

        At each step, it determines whether the step is a question, statement,
        answer, or the end of the traversal, and processes accordingly.
        """
        dt = self.decision_trees[decision_tree_name]
        dt_gen = dt.traverse()
        step = next(dt_gen)

        result = DecisionTreeRunnerResult()
        data = {
            "client_messages": self.client_messages,
            "client_summary": self.client_summary,
            "client_assessment_summary": self.client_assessment_summary,
        }
        system_prompt = DT_EXECUTION_SYSTEM_PROMPT.format(**data)

        agent = LLMAgentQA(
            system_prompt=system_prompt,
            thread_id=self.task_id.hex,
            model_config=self.model,
        )

        node_key = prev_node_key = None

        while step is not None:
            # get informations
            node_type = step.__class__.__name__.replace(
                "MermaidGraphTraversal", ""
            ).lower()
            prev_node_key, node_key = node_key, step.node_key
            step_logger = logger.bind(
                node_key=node_key,
                node_type=node_type,
                prev_node_key=prev_node_key,
            )

            # prepare the result
            step_logger.info("Processing step", step=step)
            step_result = DecisionTreeRunnerStep(
                node_key=node_key,
                node_value=step.node_value,
                node_type=node_type,
            )
            result.steps.append(step_result)

            if isinstance(step, MermaidGraphTraversalEnd):
                step_logger.info(
                    "End of decision tree execution",
                    steps=len(result.steps),
                    statements=len(result.statements),
                )
                break

            elif isinstance(step, MermaidGraphTraversalQuestion):
                step_logger.info("Question step", question=step.question)

                llm_result = await self.ask_decision_tree_question_llm(
                    step.question, step.answers, agent
                )

                # send back the answer to the decision tree
                # in order to take the right path
                step = dt_gen.send(llm_result.answer)

                # add the LLM annotations of the current answer
                # to the current step result
                step_result.annotations = llm_result.annotations

            elif isinstance(step, MermaidGraphTraversalStatement):
                # extract the annotations and add it to the current step result
                tstep: MermaidGraphTraversalStatement = step
                if tstep.node_value:
                    result.statements.append(tstep.node_value)

                step = next(dt_gen)

            else:
                # for any other node, just go to the next step
                step = next(dt_gen)

        return result

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
