from pathlib import Path

import pytest

MERMAID_CONTENT_1 = """
graph TD
    a --> b
"""

# no whitespace and in uppercase
MERMAID_CONTENT_2 = """
graph TD
    A-->B
"""

# add annotation with text and {}
MERMAID_CONTENT_3 = """
graph TD
    a-->b{hello}
"""

# add annotation with text and []
MERMAID_CONTENT_4 = """
graph TD
    a-->b[hello]
"""

# add annotation with some special characters
MERMAID_CONTENT_5 = """
graph TD
    a-->b[hello, world! ? `super`'"]
"""

# test with &
MERMAID_CONTENT_6 = """
graph TD
    a-->b[hello world]
    a & b --> c
"""

# test with & recursive
MERMAID_CONTENT_7 = """
graph TD
    a & b & c & d --> e
"""


MERMAID_CONTENT_INVALID_1 = "hello world"
MERMAID_CONTENT_INVALID_2 = "graph MEH"
MERMAID_CONTENT_INVALID_3 = "graph TD\n"  # no nodes
MERMAID_CONTENT_INVALID_4 = "graph TD\na[]"  # no text in annotation
MERMAID_CONTENT_INVALID_5 = "graph TD\na{}"  # no text in annotation


def test_mermaid_parsing_only_one_output():
    from app.utils.mermaid import MermaidParser

    filename = Path(__file__).parent / "data" / "employment_substances.mermaid"

    graph = MermaidParser.parse(filename.read_text())

    start = graph.get_start_node_key()
    assert start == "A"
    ends = graph.get_end_node_keys()
    assert ends == {"AE"}


def test_mermaid_parsing_multiple_ends():
    from app.utils.mermaid import MermaidGraph, MermaidParser

    filename = Path(__file__).parent / "data" / "employment_children.mermaid"

    graph: MermaidGraph = MermaidParser.parse(filename.read_text())

    start = graph.get_start_node_key()
    assert start == "A"
    ends = graph.get_end_node_keys()
    assert ends == {"END"}

    # now try to traverse all possible answers
    # this demonstrate how to traverse their graphs
    # XXX have a proper traversal pattern / class
    def traverse(question_key, level=0):
        prefix = "  " * level + "+- "
        if question_key in ends:
            print(f"{prefix}END[{question_key}]: {graph.get_node(question_key)}")
            return

        print(f"{prefix}Q[{question_key}]: {graph.get_node(question_key)}")
        answers = graph.get_children_nodes(question_key)

        for answer in answers:
            # potentially, it's not an statement, but a question.
            answer_node = graph.get_node(answer)
            if answer_node["type"] == "question":
                traverse(answer, level + 1)
                continue

            # now on an answer, we can have the node for the next question, or the end
            print(f"{prefix}A[{answer}]: {graph.get_node(answer)}")
            nodes = graph.get_children_nodes(answer)
            assert len(nodes) == 1 or (answer in ends)
            if len(nodes) > 0:
                traverse(nodes[0], level + 1)

    # get the first question attached to start
    nodes = graph.get_children_nodes(start)
    assert len(nodes) == 1
    traverse(nodes[0])


@pytest.mark.parametrize(
    "mermaid_content",
    [
        MERMAID_CONTENT_1,
        MERMAID_CONTENT_2,
        MERMAID_CONTENT_3,
        MERMAID_CONTENT_4,
        MERMAID_CONTENT_5,
        MERMAID_CONTENT_6,
        MERMAID_CONTENT_7,
    ],
)
def test_mermaid_parser(mermaid_content):
    print(repr(mermaid_content))
    from app.utils.mermaid import MermaidParser

    MermaidParser.parse(mermaid_content)


@pytest.mark.parametrize(
    "invalid_mermaid_content",
    [
        MERMAID_CONTENT_INVALID_1,
        MERMAID_CONTENT_INVALID_2,
        MERMAID_CONTENT_INVALID_3,
        MERMAID_CONTENT_INVALID_4,
        MERMAID_CONTENT_INVALID_5,
    ],
)
def test_invalid_mermaid_parser(invalid_mermaid_content):
    from app.utils.mermaid import MermaidParser

    with pytest.raises(Exception):
        MermaidParser.parse(invalid_mermaid_content)
