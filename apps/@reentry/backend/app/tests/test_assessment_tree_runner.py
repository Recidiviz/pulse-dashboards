from unittest.mock import AsyncMock, patch

import pytest

from app.utils.assessment_runner import Annotation, AssessmentAnswer, AssessmentRunner
from app.utils.mermaid import MermaidParser

ASSESSMENT_TREE_FULL = """
graph TD
    A[Start: One quick question]
    A --> B{Q1}
    B --> B1[yes]
    B --> B2[no]
    B1 --> BYes{Count:Q1-1}
    B2 --> BNo{Count:Q2-0}
    BYes & BNo --> C[End: goodbye]
"""
structued_tree_data_full = {"Q1": {"question": "Is the person happy?"}}


ASSESSMENT_TREE_SHORTHANDS = """
graph TD
    A[Start: One quick question]
    A --> B{Q1}
    B --> C{Q2}
    C --> D[End: goodbye]
"""
structued_tree_data_shorthand = {
    "Q1": {"question": "Is the person happy?", "type": "yes/no"},
    "Q2": {
        "question": "How satisfied are they with the superbowl results ?",
        "type": "score_box",
        "possible_answers": [
            "dissatified",
            "unphased",
            "unintresested",
            "satisfied",
            "unclear",
        ],
    },
}


client_info = "Hi, I'm so happy to be here today !"


@pytest.mark.asyncio
async def test_simple_run():
    graph = MermaidParser.parse(ASSESSMENT_TREE_FULL, structued_tree_data_full)

    runner = AssessmentRunner(graph, client_info)

    # Mock LLMAgentQA to return "yes" for the question "Is the person happy?"
    mock_answer = AssessmentAnswer(
        answer="yes",
        annotations=[
            Annotation(
                source="client_info",
                source_location="conversation",
                source_text_extract="I'm so happy to be here today",
            )
        ],
    )

    with patch("app.utils.assessment_runner.LLMAgentQA") as mock_llm_class:
        mock_llm_instance = AsyncMock()
        mock_llm_instance.call = AsyncMock(return_value=mock_answer)
        mock_llm_class.return_value = mock_llm_instance

        result = await runner.run_decision_tree()

    assert result.final_score == 1
    assert result.steps[1].node_attached_question == "Is the person happy?"
    assert [step.node_key for step in result.steps] == ["A", "B", "B1", "BYes", "C"]


@pytest.mark.asyncio
async def test_simple_run_question_type():
    graph = MermaidParser.parse(
        ASSESSMENT_TREE_SHORTHANDS, structued_tree_data_shorthand
    )

    runner = AssessmentRunner(graph, client_info, assessment_type="lsir")

    # Mock LLMAgentQA to return "yes" for first question and "unclear" for second
    mock_answer_yes = AssessmentAnswer(
        answer="yes",
        annotations=[
            Annotation(
                source="client_info",
                source_location="conversation",
                source_text_extract="I'm so happy to be here today",
            )
        ],
    )
    mock_answer_unclear = AssessmentAnswer(
        answer="unclear",
        annotations=[
            Annotation(
                source="client_info",
                source_location="conversation",
                source_text_extract="No information about superbowl",
            )
        ],
    )

    with patch("app.utils.assessment_runner.LLMAgentQA") as mock_llm_class:
        mock_llm_instance = AsyncMock()
        mock_llm_instance.call = AsyncMock(
            side_effect=[mock_answer_yes, mock_answer_unclear]
        )
        mock_llm_class.return_value = mock_llm_instance

        result = await runner.run_decision_tree()

    assert result.final_score == 1
    assert result.misses == 1
    assert result.steps[1].node_attached_question == "Is the person happy?"
    assert [step.node_key for step in result.steps] == ["A", "B", "B", "C", "C", "D"]
