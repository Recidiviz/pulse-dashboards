"""
# Test decision tree with langchain

1. from a set of decision tree, try to see if one or multiple applies
2. for each decision tree, try to traverse it
"""

import json
from pathlib import Path

from langchain.globals import set_debug, set_verbose
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from app.core.config import settings
from app.utils.mermaid import (
    MermaidGraph,
    MermaidGraphTraversalAnswer,
    MermaidGraphTraversalEnded,
    MermaidGraphTraversalQuestion,
    MermaidGraphTraversalStatement,
    MermaidParser,
)

MODEL = ChatOpenAI(openai_api_key=settings.OPENAI_API_KEY, model_name="gpt-4o")

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


DT_SELECTION_PARSER = JsonOutputParser(pydantic_object=DecisionTreeSelections)
DT_SELECTION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are an agent specialized to find out which facts correspond the most to the client's situation. "
                "Based on the facts, you will be able to determine which decision tree to apply. "
                "You'll receive all the questions/answers of the client, as well as additional information about the client. "
                "You'll be given a list of possible decision tree that could applies to the client's situation. "
                "You must answer with the list of decision trees that applies the most to the client's situation. "
            ),
        ),
        (
            "user",
            (
                "# Client intake\n{intake_extractions}\n\n"
                "# Available decision trees\n{decision_trees}\n\n"
                "\n\n"
                "You search for the applicable decisions trees based on the client's situation. "
                "For each decision tree, ask yourself if the client's situation corresponds to the decision tree. "
                "For each applicable decision tree, you must provide the source of the decision tree and the text extract that corresponds to the client's situation. "
                "Add as many annotations as needed."
                "Use `source` to indicate which document you used (e.g. Client intake, etc.). "
                "Use `source_location` to indicate in a consise way where in the document you found the information (Question X);"
                "Use `source_text_extract` to give an extract/citation that corresponds to the client's situation. "
                "{format_instructions}"
            ),
        ),
    ]
)
DT_SELECTION_LLM = DT_SELECTION_PROMPT.pipe(MODEL).pipe(DT_SELECTION_PARSER)

# =============================================================================
# Decision tree execution
# =============================================================================


class DecisionTreeExecution(BaseModel):
    answer: str = Field(description="The answer to the question")
    annotations: list[Annotation] = Field(description="The annotations of the answer")


DT_EXECUTION_PARSER = JsonOutputParser(pydantic_object=DecisionTreeExecution)
DT_EXECUTION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are a AI designed to assist a social worker for intake interviews. "
                "You are give a list of question/answers and additional informations from a client. "
                "Based on theses informations, you are going to be asked question about the client's situation. "
                "You'll look back on the client situation and formalize an answer to our questions. "
            ),
        ),
        (
            "user",
            (
                "# Client intake\n{intake_extractions}\n\n"
                "Based on the client's situation, {question}?\n"
                "Answer only with one of theses possible answers: {possible_answers}\n"
                "Describe your answer by adding annotations.\n"
                "Use `source` to indicate which document you used (e.g. Client intake, etc.). "
                "Use `source_location` to indicate in a consise way where in the document you found the information (Question X);"
                "Use `source_text_extract` to give an extract/citation that corresponds to the client's situation. "
                "{format_instructions}"
            ),
        ),
    ]
)
DT_EXECUTION_LLM = DT_EXECUTION_PROMPT.pipe(MODEL).pipe(DT_EXECUTION_PARSER)

set_debug(True)
set_verbose(True)


class DecisionTreeAgent:
    def __init__(self, persona: str):
        self.persona_folder = Path(__file__).parent / "data" / persona

    def run(self):
        self.load_decision_intake()
        self.load_decision_trees()
        # self.find_decision_trees_to_applies()
        # self.execute_decision_trees()
        self.execute_decision_tree(self.decision_trees["employment_mh"])

    def load_decision_intake(self):
        intake_fn = self.persona_folder / "intake.json"
        with open(intake_fn) as fd:
            intake_json = json.load(fd)

        # get extractions
        extractions = []
        for entry in intake_json["data"]:
            extractions.extend(entry["extraction"])

        # reformat for prompt
        def format_extraction(e):
            questionName = e["questionName"]
            questionAnswer = e["questionAnswer"]
            return f"## Question: {questionName}\nClient answer: {questionAnswer}\n"

        self.p_intake_extractions = "\n".join(
            [format_extraction(e) for e in extractions]
        )

    def load_decision_trees(self):
        self.decision_trees = {}
        # iterate over all decision trees at data/examples/decisiontrees
        for filename in Path("data/examples/decisiontrees").glob("*.mermaid"):
            graph = MermaidParser.parse(filename.read_text())
            self.decision_trees[filename.stem] = graph

            start_key = graph.get_start_node_key()
            start = graph.get_node(start_key)["value"].replace("Start: ", "")

            print(f"Loaded: {filename.stem} - {start}")

        # reformat for prompt
        def format_decision_tree(key, e):
            start_key = e.get_start_node_key()
            start = e.get_node(start_key)["value"].replace("Start: ", "")
            return f"- id:{key} title:{start}\n"

        self.p_decision_trees = "".join(
            [format_decision_tree(k, e) for k, e in self.decision_trees.items()]
        )

    def find_decision_trees_to_applies(self):
        data = {
            "intake_extractions": self.p_intake_extractions,
            "decision_trees": self.p_decision_trees,
            "format_instructions": DT_SELECTION_PARSER.get_format_instructions(),
        }
        output = DT_SELECTION_LLM.invoke(data)
        # XXX why output is not a pydantic object ?
        result = DT_SELECTION_PARSER.pydantic_object.model_validate(output)
        self.selected_decision_trees = result.selection

    def execute_decision_trees(self):
        for entry in self.selected_decision_trees:
            key = entry.decision_tree_key
            dt = self.decision_trees[key]
            self.execute_decision_tree(dt)

    def execute_decision_tree(self, dt: MermaidGraph):
        print(f"Graph: {dt}")

        dt_gen = dt.traverse()
        step = next(dt_gen)

        history = []

        while step is not None:
            print("Execute step")
            history.append(
                {
                    "type": step.__class__.__name__.replace(
                        "MermaidGraphTraversal", ""
                    ).lower(),
                    "node_key": step.node_key,
                    "step": step,
                }
            )
            if isinstance(step, MermaidGraphTraversalStatement):
                print(f"==> Statement: {step}")
                step = next(dt_gen)
            elif isinstance(step, MermaidGraphTraversalEnded):
                print(f"==> End: {step}")
                break
            elif isinstance(step, MermaidGraphTraversalQuestion):
                print(f"==> Question: {step}")

                llm_result = self.ask_decision_tree_question_llm(
                    step.question,
                    step.answers,
                )

                history[-1]["llm_result"] = llm_result
                step = dt_gen.send(llm_result.answer)
            elif isinstance(step, MermaidGraphTraversalAnswer):
                print(f"==> Answer: {step}")
                step = next(dt_gen)

        print("== history")
        last_node_key = None
        for entry in history:
            node_key = entry["node_key"]
            print(f"{last_node_key} -> {node_key}")
            if entry["type"] == "question":
                print()
                print(f"Q: {entry['step'].question}")
                print(f"A: {entry['llm_result'].answer}")
                print("Annotations:")
                for annotation in entry["llm_result"].annotations:
                    print(
                        f'  - In "{annotation.source}", on "{annotation.source_location}": '
                        f'"{annotation.source_text_extract}"'
                    )
                print()
            elif entry["type"] == "statement":
                print()
                print(f"S: {entry['step'].statement}")
                print()
            last_node_key = node_key

        return

    def ask_decision_tree_question_llm(
        self, question, possible_answers
    ) -> DecisionTreeExecution:
        data = {
            "intake_extractions": self.p_intake_extractions,
            "question": question,
            "possible_answers": possible_answers,
            "format_instructions": DT_EXECUTION_PARSER.get_format_instructions(),
        }

        output = DT_EXECUTION_LLM.invoke(data)
        result = DT_EXECUTION_PARSER.pydantic_object.model_validate(output)
        return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    # get persona name
    parser.add_argument(
        "persona",
        type=str,
        help="The persona name",
    )
    kwargs = vars(parser.parse_args())

    agent = DecisionTreeAgent(**kwargs)
    agent.run()
