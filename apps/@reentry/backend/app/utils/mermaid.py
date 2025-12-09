"""
# Mermaid parser, using Lark

WARNING: basic parser made for our files, not a general parser for all Mermaid files.
"""

from typing import Annotated, Literal, TypedDict

from annotated_types import Len
from lark import Lark, Transformer
from pydantic import BaseModel
from yaml import Loader, load

MERMAID_GRAMMAR = r"""
    start: "graph" direction (node|link)+
    direction: "TD" | "LR"
    node: NAME (node_question | node_statement)? (COMMENT)?
    link: node ARROW node | node AND link
    node_question: "{" TEXT "}"
    node_statement: "[" TEXT "]"

    TEXT: /[a-zA-Z0-9:,'\s\?\/\-;()\.\’!`"]+/
    NAME: /[a-zA-Z0-9_]+(\-[a-zA-Z0-9_]+)?/
    ARROW: "-->"
    AND: "&"
    COMMENT: /%% [a-zA-Z0-9:,'\s\?\/\-;()\.\’!`"]+ %%/

    %import common.WS
    %ignore WS
"""

question_types = Literal["score_box", "yes/no"]


class AdditionalQuestionBase(BaseModel):
    question: str


class AdditionalQuestionYesNo(AdditionalQuestionBase):
    type: Literal["yes/no"]


class AdditionalQuestionScoreBox(AdditionalQuestionBase):
    type: Literal["score_box"]
    possible_answers: Annotated[list[str], Len(min_length=2, max_length=5)]


class MermaidNode(TypedDict):
    key: str
    question_text: str | None
    question_type: question_types | None
    possible_answers: list[str] | None
    type: str
    value: str
    isEnd: bool


def _parse_additional(additional_questions, node_value):
    question_raw = (
        additional_questions.get(node_value) if additional_questions else None
    )
    question_text = None
    possible_answers = None
    question_type = None
    if question_raw:
        if question_raw.get("type") == "score_box":
            question = AdditionalQuestionScoreBox(**question_raw)
            question_text = question.question
            possible_answers = [pa.casefold() for pa in question.possible_answers]
            question_type = question.type
        if question_raw.get("type") == "yes/no":
            question = AdditionalQuestionYesNo(**question_raw)
            question_text = question.question
            possible_answers = ["yes", "no", "unclear"]
            question_type = question.type
        if question_raw.get("type") is None:
            question = AdditionalQuestionBase(**question_raw)
            question_text = question.question

    return question_text, question_type, possible_answers


class MermaidTransformer(Transformer):
    def __init__(self, additional_questions: dict[str, dict] | None = None):
        self.nodes: dict[str, MermaidNode | None] = {}
        self.links = set()
        self.additional_questions = additional_questions

    def node(self, args):
        name = str(args[0])
        if len(args) >= 2:  # There could be a comment, making it a length 3 node.
            tree = args[1]
            token = tree.data
            type = str(token).replace("node_", "")
            value = str(tree.children[0])
            question_text, question_type, possible_answers = None, None, None

            if type == "question":
                question_text, question_type, possible_answers = _parse_additional(
                    self.additional_questions, value
                )

            self.nodes[name] = {
                "key": name,
                "question_text": question_text or None,
                "question_type": question_type or None,
                "possible_answers": possible_answers or None,
                "type": type,
                "value": value,
                "isEnd": value.startswith("End:"),
            }
        elif name not in self.nodes:
            # node ['B1']
            self.nodes[name] = None
        return name

    def link(self, args):
        if len(args) == 2:
            src, dest = args
            self.links.add((src, dest))
        elif len(args) == 3:
            src, link, dest = args
            if isinstance(dest, list):
                # recursive link: A & B -> C
                # becomes: A -> C, B -> C
                # another example: A & B & C -> D
                # becomes: A -> D, B -> D, C -> D
                dest = self._get_end_link(dest)
            self.links.add((src, dest))
        return args

    def _get_end_link(self, dest: list):
        assert len(dest) == 3
        if isinstance(dest[2], list):
            return self._get_end_link(dest[2])
        return dest[2]

    def start(self, args):
        return MermaidGraph(self.nodes, self.links)

    def TEXT(self, token):
        return token.strip()

    def NAME(self, token):
        return str(token)


class MermaidGraphTraversalError(Exception):
    pass


class MermaidGraphTraversalStep(BaseModel):
    node_key: str
    node_value: str | None = None


class MermaidGraphTraversalStart(MermaidGraphTraversalStep):
    pass


class MermaidGraphTraversalEnd(MermaidGraphTraversalStep):
    pass


class MermaidGraphTraversalStatement(MermaidGraphTraversalStep):
    # statement is the node_value
    pass


class MermaidGraphTraversalQuestion(MermaidGraphTraversalStep):
    question: str
    answer_keys: list[str]
    answer_nodes: list[MermaidNode]
    answers: list[str]


class MermaidGraphTraversalCount(MermaidGraphTraversalStep):
    score_modifier: Literal["miss"] | int
    pass


class MermaidGraphTraversalAnswer(MermaidGraphTraversalStep):
    pass


def _traverse_count_node(node_value: str):
    if node_value == "Count:miss":
        return "miss"

    COUNT_YES_NO = {"1": 1, "0": 0}
    COUNT_SCORE_BOX = {"0": 1, "1": 0, "2": -2, "3": -3}

    parts = node_value[4:].split("-") if node_value else []

    if len(parts) == 2:
        if parts[1].startswith("S"):
            score_modifier = COUNT_SCORE_BOX.get(parts[1][1:])
            if score_modifier is None:
                raise ValueError("Wrong scoring pattern")
            return score_modifier

        score_modifier = COUNT_YES_NO.get(parts[1])
        if score_modifier is None:
            raise ValueError("Wrong scoring pattern")
        return score_modifier

    else:
        raise ValueError("Wrong scoring pattern")


def _get_oras_score(
    case_result: str, possible_answers: list[str]
) -> int | Literal["miss"]:
    if case_result == "unclear":
        return "miss"
    if case_result not in [answer.casefold() for answer in possible_answers]:
        raise ValueError(f"Unhandled answer {case_result}")
    index = possible_answers.index(case_result)
    score = len(possible_answers) - 1 - index
    return score


def _traverse_handle_typed_question_result(
    result, possible_answers, question_type, assessment_type
) -> int | Literal["miss"]:
    from app.models.base import AssessmentType

    case_result = result.casefold()
    if case_result not in possible_answers and assessment_type == AssessmentType.LSIR:
        raise ValueError(f"Unhandled answer {result}")

    COUNT_YES_NO = {"yes": 1, "no": 0}
    COUNT_SCORE_BOX = {"0": 1, "1": 0, "2": -2, "3": -3, "4": "miss"}
    DEFAULT = "miss"

    match question_type:
        case "score_box":
            if assessment_type == AssessmentType.LSIR:
                return COUNT_SCORE_BOX.get(case_result, DEFAULT)
            elif assessment_type in [AssessmentType.ORAS_PIT, AssessmentType.ORAS_RT]:
                return _get_oras_score(case_result, possible_answers)
        case "yes/no":
            return COUNT_YES_NO.get(case_result, DEFAULT)
        case _:
            raise ValueError(f"Unhandled question type {question_type}")


class MermaidGraph:
    def __init__(self, nodes, links):
        self.nodes: dict[str, MermaidNode] = nodes
        self.links = links

    def __repr__(self):
        return f"<MermaidGraph nodes={self.nodes} links={self.links}>"

    def as_dict(self):
        return {
            "nodes": self.nodes,
            "links": self.links,
        }

    def get_start_node_key(self):
        # Unsure that all starts with key A
        for key, node in self.nodes.items():
            if node.get("value").startswith("Start:"):
                return key

    def get_end_node_keys(self):
        # Same here, not all examples ends with END key
        # So we search on the text instead "End: "
        return set(
            dest
            for src, dest in self.links
            if (self.get_node(dest) and self.get_node(dest).get("isEnd"))
        )

    def get_node(self, key):
        return self.nodes[key]

    def get_children_nodes(self, key):
        return [dest for src, dest in self.links if src == key]

    def traverse(self, assessment_type: str = "dt"):
        start_node_key = self.get_start_node_key()
        self.current_node_key = start_node_key
        self.next_nodes_keys = []
        while self.current_node_key is not None:
            current_node = self.get_node(self.current_node_key)
            current_node_value = current_node.get("value")
            children_nodes_keys = self.get_children_nodes(self.current_node_key)
            node_text = current_node.get("question_text") or current_node["value"]

            if current_node.get("type") == "question":
                if current_node_value.startswith("Count:"):
                    score_modifier = _traverse_count_node(current_node_value)

                    yield MermaidGraphTraversalCount(
                        node_key=self.current_node_key,
                        node_value=current_node_value,
                        score_modifier=score_modifier,
                    )
                elif current_node.get("question_type"):
                    possible_answers = current_node.get("possible_answers")
                    result = yield MermaidGraphTraversalQuestion(
                        node_key=self.current_node_key,
                        node_value=current_node_value,
                        question=node_text,
                        answer_keys=[],
                        answer_nodes=[],
                        answers=possible_answers,
                    )
                    score_modifier = _traverse_handle_typed_question_result(
                        result,
                        possible_answers,
                        current_node.get("question_type"),
                        assessment_type,
                    )

                    yield MermaidGraphTraversalCount(
                        node_key=self.current_node_key,
                        node_value=current_node_value,
                        score_modifier=score_modifier,
                    )

                elif len(children_nodes_keys) > 1:
                    next_nodes = [self.get_node(key) for key in children_nodes_keys]
                    answers = [node["value"].casefold() for node in next_nodes]
                    result = yield MermaidGraphTraversalQuestion(
                        node_key=self.current_node_key,
                        node_value=current_node_value,
                        question=current_node.get("question_text")
                        or current_node["value"],
                        answer_keys=children_nodes_keys,
                        answer_nodes=next_nodes,
                        answers=answers,
                    )

                    if result is None:
                        raise MermaidGraphTraversalError("No answer provided")

                    # Handle case where LLM returns invalid answer
                    try:
                        answer_result_idx = answers.index(result.casefold())
                    except ValueError:
                        # If the exact answer isn't found, try to find a partial match
                        result_lower = result.casefold()
                        found_match = False
                        for i, answer in enumerate(answers):
                            if answer in result_lower or result_lower in answer:
                                answer_result_idx = i
                                found_match = True
                                break

                        if not found_match:
                            raise MermaidGraphTraversalError(
                                f"Invalid answer '{result}' provided. Expected one of: {answers}"
                            )
                    self.current_node_key = children_nodes_keys[answer_result_idx]
                    yield MermaidGraphTraversalAnswer(
                        node_key=self.current_node_key,
                        node_value=self.get_node(self.current_node_key).get("value"),
                    )
                else:  # A question with only one possible answer is a statement
                    cls = MermaidGraphTraversalStatement
                    if self.current_node_key == start_node_key:
                        cls = MermaidGraphTraversalStart
                    yield cls(
                        node_key=self.current_node_key,
                        node_value=current_node["value"],
                    )

                # now, current_node is one of the possible answers, at the end of an arrow.
                # We need to find all the arrows that start from there
                # set the current node to the first of them
                # and save the rest for later
                children_nodes_keys = self.get_children_nodes(self.current_node_key)
                # This is a leaf.
                if not children_nodes_keys:
                    node = self.get_node(self.current_node_key)
                    # We walked the whole reachable tree, or this node tells us to stop
                    if not self.next_nodes_keys or node.get("isEnd"):
                        yield MermaidGraphTraversalEnd(
                            node_key=self.current_node_key,
                            node_value=node.get("value"),
                        )
                        break
                    else:
                        self.current_node_key = self.next_nodes_keys.pop()
                else:
                    self.current_node_key = children_nodes_keys[0]
                    self.next_nodes_keys = (
                        children_nodes_keys[1:] + self.next_nodes_keys
                    )

            elif not children_nodes_keys:
                if not self.next_nodes_keys:
                    yield MermaidGraphTraversalEnd(
                        node_key=self.current_node_key, node_value=current_node_value
                    )
                    break
                else:
                    self.current_node_key = self.next_nodes_keys.pop()
                    break

            else:
                # It's not a question, so it's a statement
                cls = MermaidGraphTraversalStatement
                if self.current_node_key == start_node_key:
                    cls = MermaidGraphTraversalStart
                yield cls(
                    node_key=self.current_node_key,
                    node_value=current_node["value"],
                )
                self.current_node_key = children_nodes_keys[0]
                self.next_nodes_keys = children_nodes_keys[1:] + self.next_nodes_keys

        yield MermaidGraphTraversalEnd(node_key="END", node_value="Handled all leaves")


class MermaidParser:
    @staticmethod
    def parse(data, obj: dict | None = None) -> MermaidGraph:
        # XXX this does is not ideal, but because transformer is stateful
        # we need to create a new instance for each parsing
        mermaid_parser = Lark(
            MERMAID_GRAMMAR,
            parser="lalr",
            transformer=MermaidTransformer(additional_questions=obj),
        )
        return mermaid_parser.parse(data)


def dumb_walk(dt: MermaidGraph):
    """
    Execute the given decision tree answering the first option all the time
    """
    dt_gen = dt.traverse(assessment_type="lsir")
    step = next(dt_gen)

    node_key = None
    score = 0
    unclarities = 0

    while step is not None:
        node_key = step.node_key

        if isinstance(step, MermaidGraphTraversalEnd):
            print(f"\n Score = {score}")
            print(f"\n Unclarities = {score}")

            print("\n\nTHE END")
            break

        elif isinstance(step, MermaidGraphTraversalQuestion):
            print(node_key + "{" + (step.node_value or "") + "}")
            print(f"question: {step.question}")
            print(
                [
                    (answer.get("key"), answer.get("value"))
                    for answer in step.answer_nodes
                ]
            )

            dumb_result = step.answer_nodes[0].get("value")
            print(f"dumb_result: {dumb_result}")

            # send back the answer to the decision tree
            # in order to take the right path
            step = dt_gen.send(dumb_result)

        elif isinstance(step, MermaidGraphTraversalCount):
            if step.score_modifier == "miss":
                unclarities += 1
            else:
                score += step.score_modifier

                print(f"new total {score}")

            step = next(dt_gen)

        elif isinstance(step, MermaidGraphTraversalStatement):
            print(node_key + "[" + (step.node_value or "") + "]")

            # extract the annotations and add it to the current step result
            tstep: MermaidGraphTraversalStatement = step
            if tstep.node_value:
                print(f"statement: {tstep.node_value}")

            step = next(dt_gen)

        else:
            # for any other node, just go to the next step
            step = next(dt_gen)

    return


if __name__ == "__main__":
    import argparse
    from pprint import pprint

    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", help="Path to one or more Mermaid files")
    parser.add_argument(
        "--dump", action="store_true", help="Dump the parsed Mermaid graph"
    )
    parser.add_argument("--additional_yaml", help="A yaml file with questions")
    args = parser.parse_args()

    for file_path in args.files:
        with open(file_path, "r") as file:
            data = file.read()

        add = None
        if args.additional_yaml:
            with open(args.additional_yaml, "r") as y:
                add = load(y.read(), Loader)
        graph: MermaidGraph = MermaidParser.parse(data, add)

        if args.dump:
            pprint(graph.as_dict())
            start_node_key = graph.get_start_node_key()
            start_node = graph.get_node(start_node_key)
            print(f"Start: {start_node_key} = {start_node}")
            for end_node_key in graph.get_end_node_keys():
                end_node = graph.get_node(end_node_key)
                print(f"End: {end_node_key} = {end_node}")

            dumb_walk(graph)

        else:
            start_node_key = graph.get_start_node_key()
            start_node = graph.get_node(start_node_key)
            print(f"- {file_path} key={start_node_key} node={start_node}")
