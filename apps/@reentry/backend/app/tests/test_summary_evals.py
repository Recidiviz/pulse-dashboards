"""
Unit tests for LLM-as-judge summary evaluators.

These tests mock the LLM to avoid real API calls. See app/tests/data/ for
test data files used with the CLI tool (which makes real LLM calls).
"""

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from langsmith.schemas import Example, Run

from app.manage.evaluate.summary_evals import (
    coverage_check,
    grounding_check,
    has_section_headers,
    no_judgments,
    not_toxic,
    section_length,
    tone,
)

# ─── Constants ────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent / "data"

EMPTY_INTAKE_MESSAGES = (
    'assistant: "Hi, I\'m here to help gather some information from you. Can you tell me about your background?"\n'
    'user: "I don\'t want to talk about it."\n'
    'assistant: "I understand. Is there anything else you\'d like to share?"\n'
    'user: "No."'
)

GOOD_SUMMARY = (
    "The client declined to provide information during the intake conversation."
)

HALLUCINATED_SUMMARY = (
    "The client is a 35-year-old male with a history of substance abuse. "
    "He has three children and needs assistance with housing and employment. "
    "He has been sober for 6 months and is motivated to reconnect with his family."
)

DETAILED_INTAKE_MESSAGES = (
    'assistant: "Can you tell me about your background?"\n'
    'user: "I finished high school and worked at a factory for 5 years before my conviction."\n'
    'assistant: "Tell me about your housing and family situation."\n'
    'user: "I\'m staying with my mom. My wife and I are separated, and I have two kids."\n'
    'assistant: "Any substance use history?"\n'
    'user: "I used to drink heavily. Been sober 6 months."'
)

DETAILED_GOOD_SUMMARY = (
    "The client is a high school graduate with five years of factory experience prior to conviction. "
    "Currently living with his mother. Separated from wife, has two children he wants to reconnect with. "
    "History of heavy alcohol use; reports six months of sobriety."
)

INCOMPLETE_SUMMARY = "The client has a high school education."

TOXIC_SUMMARY = (
    "The client is a dangerous individual who has repeatedly shown poor judgment "
    "and cannot be trusted to make good decisions."
)


# ─── Helpers ─────────────────────────────────────────────────────────────────


def make_run(summary: str) -> Run:
    import datetime

    return Run(
        id=uuid4(),
        name="test_run",
        start_time=datetime.datetime.now(),
        run_type="chain",
        outputs={"summary": summary},
    )


def make_example(intake_messages: str) -> Example:
    import datetime

    return Example(
        id=uuid4(),
        created_at=datetime.datetime.now(),
        inputs={"intake_messages": intake_messages},
        outputs={},
    )


def make_categorized_fact(
    fact: str, explanation: str = "Test explanation."
) -> MagicMock:
    """Create a mock CategorizedFact with .fact, .explanation, and .model_dump()."""
    item = MagicMock()
    item.fact = fact
    item.explanation = explanation
    item.model_dump.return_value = {"fact": fact, "explanation": explanation}
    return item


def make_grounding_grade(
    binary_score,
    correct_facts,
    interpretive_additions,
    hallucinated_facts,
    explanation="Test explanation.",
):
    """
    Args:
        correct_facts: list of (fact, explanation) tuples
        interpretive_additions: list of (fact, explanation) tuples
        hallucinated_facts: list of (fact, explanation) tuples
    """
    grade = MagicMock()
    grade.binary_score = binary_score
    grade.explanation = explanation
    grade.correct_facts = [make_categorized_fact(*f) for f in correct_facts]
    grade.interpretive_additions = [
        make_categorized_fact(*f) for f in interpretive_additions
    ]
    grade.hallucinated_facts = [make_categorized_fact(*f) for f in hallucinated_facts]
    return grade


def make_coverage_grade(score, missing_details, explanation="Test explanation."):
    grade = MagicMock()
    grade.one_to_ten_score = score
    grade.explanation = explanation
    grade.missing_details = missing_details
    return grade


# ─── Grounding Check Tests ────────────────────────────────────────────────────


class TestGroundingCheck:
    @pytest.mark.asyncio
    async def test_good_summary_passes(self):
        """A summary that only states what the client said should pass."""
        mock_grade = make_grounding_grade(
            binary_score=1,
            correct_facts=[
                (
                    "The client declined to provide information",
                    "Client stated 'I don't want to talk about it'.",
                )
            ],
            interpretive_additions=[],
            hallucinated_facts=[],
            explanation="Summary accurately reflects that client declined to share.",
        )

        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create_model:
            mock_chain = AsyncMock(return_value=mock_grade)
            mock_chain.ainvoke = AsyncMock(return_value=mock_grade)
            mock_create_model.return_value.with_structured_output.return_value.__ror__ = MagicMock(
                return_value=mock_chain
            )

            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_prompt_cls:
                mock_prompt = MagicMock()
                mock_prompt.__or__ = MagicMock(return_value=mock_chain)
                mock_prompt_cls.from_messages.return_value = mock_prompt

                result = await grounding_check(
                    make_run(GOOD_SUMMARY),
                    make_example(EMPTY_INTAKE_MESSAGES),
                )

        assert result["key"] == "grounding"
        assert result["score"] == 1
        assert result["correct_facts"] == [
            {
                "fact": "The client declined to provide information",
                "explanation": "Client stated 'I don't want to talk about it'.",
            }
        ]
        assert result["interpretive_additions"] == []
        assert result["hallucinated_facts"] == []

    @pytest.mark.asyncio
    async def test_hallucinated_summary_fails(self):
        """A summary with fabricated details should fail."""
        fabricated = [
            ("35-year-old", "Age was never mentioned in the intake."),
            ("male", "Gender was never mentioned in the intake."),
            ("history of substance abuse", "Client did not mention substance use."),
            ("three children", "Client did not mention any children."),
            ("sober for 6 months", "Sobriety was never mentioned in the intake."),
            (
                "motivated to reconnect with family",
                "Family reconnection was not mentioned.",
            ),
        ]
        mock_grade = make_grounding_grade(
            binary_score=0,
            correct_facts=[],
            interpretive_additions=[],
            hallucinated_facts=fabricated,
            explanation="Summary contains many fabricated details not present in intake.",
        )

        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create_model:
            mock_chain = AsyncMock(return_value=mock_grade)
            mock_chain.ainvoke = AsyncMock(return_value=mock_grade)
            mock_create_model.return_value.with_structured_output.return_value.__ror__ = MagicMock(
                return_value=mock_chain
            )

            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_prompt_cls:
                mock_prompt = MagicMock()
                mock_prompt.__or__ = MagicMock(return_value=mock_chain)
                mock_prompt_cls.from_messages.return_value = mock_prompt

                result = await grounding_check(
                    make_run(HALLUCINATED_SUMMARY),
                    make_example(EMPTY_INTAKE_MESSAGES),
                )

        assert result["key"] == "grounding"
        assert result["score"] == 0
        assert len(result["hallucinated_facts"]) == len(fabricated)
        assert all(
            "fact" in item and "explanation" in item
            for item in result["hallucinated_facts"]
        )

    @pytest.mark.asyncio
    async def test_result_has_all_keys(self):
        """Result dict should have all required keys."""
        mock_grade = make_grounding_grade(
            binary_score=1,
            correct_facts=[("fact 1", "It was stated directly.")],
            interpretive_additions=[
                ("inference 1", "It is a professional assessment.")
            ],
            hallucinated_facts=[],
        )

        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create_model:
            mock_chain = AsyncMock(return_value=mock_grade)
            mock_chain.ainvoke = AsyncMock(return_value=mock_grade)
            mock_create_model.return_value.with_structured_output.return_value.__ror__ = MagicMock(
                return_value=mock_chain
            )

            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_prompt_cls:
                mock_prompt = MagicMock()
                mock_prompt.__or__ = MagicMock(return_value=mock_chain)
                mock_prompt_cls.from_messages.return_value = mock_prompt

                result = await grounding_check(
                    make_run(GOOD_SUMMARY),
                    make_example(EMPTY_INTAKE_MESSAGES),
                )

        assert set(result.keys()) == {
            "key",
            "score",
            "explanation",
            "correct_facts",
            "interpretive_additions",
            "hallucinated_facts",
        }
        assert result["key"] == "grounding"
        assert result["score"] in (0, 1)
        assert all(
            "fact" in item and "explanation" in item for item in result["correct_facts"]
        )

    @pytest.mark.asyncio
    async def test_interpretive_additions_do_not_cause_failure(self):
        """Interpretive additions should not cause grounding check to fail."""
        mock_grade = make_grounding_grade(
            binary_score=1,
            correct_facts=[
                ("high school graduate", "Client stated 'I finished high school'."),
                (
                    "factory worker for 5 years",
                    "Client stated 'worked at a factory for 5 years'.",
                ),
            ],
            interpretive_additions=[
                (
                    "likely needs employment assistance",
                    "Client has been out of the workforce since conviction.",
                ),
                (
                    "at risk of relapse without support",
                    "Client has history of heavy drinking with only 6 months sobriety.",
                ),
            ],
            hallucinated_facts=[],
            explanation="No hallucinations. Interpretive additions are acceptable.",
        )

        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create_model:
            mock_chain = AsyncMock(return_value=mock_grade)
            mock_chain.ainvoke = AsyncMock(return_value=mock_grade)
            mock_create_model.return_value.with_structured_output.return_value.__ror__ = MagicMock(
                return_value=mock_chain
            )

            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_prompt_cls:
                mock_prompt = MagicMock()
                mock_prompt.__or__ = MagicMock(return_value=mock_chain)
                mock_prompt_cls.from_messages.return_value = mock_prompt

                result = await grounding_check(
                    make_run(DETAILED_GOOD_SUMMARY),
                    make_example(DETAILED_INTAKE_MESSAGES),
                )

        assert result["score"] == 1
        assert len(result["interpretive_additions"]) == 2
        assert len(result["hallucinated_facts"]) == 0


# ─── Coverage Check Tests ─────────────────────────────────────────────────────


class TestCoverageCheck:
    @pytest.mark.asyncio
    async def test_complete_summary_scores_high(self):
        """A summary covering all intake details should score >= 7."""
        mock_grade = make_coverage_grade(
            score=9,
            missing_details=[],
            explanation="All key details captured.",
        )

        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create_model:
            mock_chain = AsyncMock(return_value=mock_grade)
            mock_chain.ainvoke = AsyncMock(return_value=mock_grade)
            mock_create_model.return_value.with_structured_output.return_value.__ror__ = MagicMock(
                return_value=mock_chain
            )

            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_prompt_cls:
                mock_prompt = MagicMock()
                mock_prompt.__or__ = MagicMock(return_value=mock_chain)
                mock_prompt_cls.from_messages.return_value = mock_prompt

                result = await coverage_check(
                    make_run(DETAILED_GOOD_SUMMARY),
                    make_example(DETAILED_INTAKE_MESSAGES),
                )

        assert result["key"] == "coverage"
        assert result["score"] == 9
        assert result["missing_details"] == []

    @pytest.mark.asyncio
    async def test_incomplete_summary_scores_low(self):
        """A summary missing most intake details should score < 7."""
        missing = [
            "factory work history (5 years)",
            "housing situation (living with mother)",
            "marital status and two children",
            "substance use history and 6 months sobriety",
        ]
        mock_grade = make_coverage_grade(
            score=2,
            missing_details=missing,
            explanation="Summary is missing most important details.",
        )

        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create_model:
            mock_chain = AsyncMock(return_value=mock_grade)
            mock_chain.ainvoke = AsyncMock(return_value=mock_grade)
            mock_create_model.return_value.with_structured_output.return_value.__ror__ = MagicMock(
                return_value=mock_chain
            )

            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_prompt_cls:
                mock_prompt = MagicMock()
                mock_prompt.__or__ = MagicMock(return_value=mock_chain)
                mock_prompt_cls.from_messages.return_value = mock_prompt

                result = await coverage_check(
                    make_run(INCOMPLETE_SUMMARY),
                    make_example(DETAILED_INTAKE_MESSAGES),
                )

        assert result["key"] == "coverage"
        assert result["score"] == 2
        assert len(result["missing_details"]) == 4

    @pytest.mark.asyncio
    async def test_result_has_all_keys(self):
        """Result dict should have all required keys."""
        mock_grade = make_coverage_grade(score=8, missing_details=["minor detail"])

        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create_model:
            mock_chain = AsyncMock(return_value=mock_grade)
            mock_chain.ainvoke = AsyncMock(return_value=mock_grade)
            mock_create_model.return_value.with_structured_output.return_value.__ror__ = MagicMock(
                return_value=mock_chain
            )

            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_prompt_cls:
                mock_prompt = MagicMock()
                mock_prompt.__or__ = MagicMock(return_value=mock_chain)
                mock_prompt_cls.from_messages.return_value = mock_prompt

                result = await coverage_check(
                    make_run(DETAILED_GOOD_SUMMARY),
                    make_example(DETAILED_INTAKE_MESSAGES),
                )

        assert set(result.keys()) == {"key", "score", "explanation", "missing_details"}
        assert result["key"] == "coverage"
        assert 1 <= result["score"] <= 10

    @pytest.mark.asyncio
    async def test_score_is_integer(self):
        """Score should be an integer."""
        mock_grade = make_coverage_grade(score=7, missing_details=[])

        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create_model:
            mock_chain = AsyncMock(return_value=mock_grade)
            mock_chain.ainvoke = AsyncMock(return_value=mock_grade)
            mock_create_model.return_value.with_structured_output.return_value.__ror__ = MagicMock(
                return_value=mock_chain
            )

            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_prompt_cls:
                mock_prompt = MagicMock()
                mock_prompt.__or__ = MagicMock(return_value=mock_chain)
                mock_prompt_cls.from_messages.return_value = mock_prompt

                result = await coverage_check(
                    make_run(DETAILED_GOOD_SUMMARY),
                    make_example(DETAILED_INTAKE_MESSAGES),
                )

        assert isinstance(result["score"], int)


# ─── Test Data File Tests ─────────────────────────────────────────────────────


class TestTestDataFiles:
    """Validate that the test data JSON files have the expected structure."""

    def test_good_summary_file_exists_and_is_valid(self):
        path = DATA_DIR / "empty_intake_good_summary.json"
        assert path.exists(), f"Test data file not found: {path}"
        data = json.loads(path.read_text())
        assert "conversation" in data
        assert "expected_summary" in data
        assert isinstance(data["conversation"], list)
        assert len(data["conversation"]) > 0
        assert isinstance(data["expected_summary"], str)

    def test_hallucinated_summary_file_exists_and_is_valid(self):
        path = DATA_DIR / "empty_intake_hallucinated_summary.json"
        assert path.exists(), f"Test data file not found: {path}"
        data = json.loads(path.read_text())
        assert "conversation" in data
        assert "expected_summary" in data
        assert isinstance(data["conversation"], list)

    def test_conversation_messages_have_role_and_content(self):
        path = DATA_DIR / "empty_intake_good_summary.json"
        data = json.loads(path.read_text())
        for msg in data["conversation"]:
            assert "role" in msg, f"Message missing 'role': {msg}"
            assert "content" in msg, f"Message missing 'content': {msg}"
            assert msg["role"] in (
                "assistant",
                "user",
            ), f"Unexpected role: {msg['role']}"

    def test_same_conversation_but_different_summaries(self):
        """Good and hallucinated files share the same intake but different summaries."""
        good = json.loads((DATA_DIR / "empty_intake_good_summary.json").read_text())
        bad = json.loads(
            (DATA_DIR / "empty_intake_hallucinated_summary.json").read_text()
        )
        assert good["conversation"] == bad["conversation"]
        assert good["expected_summary"] != bad["expected_summary"]

    def test_good_summary_does_not_contain_hallucinated_details(self):
        """Good summary should not contain fabricated details."""
        path = DATA_DIR / "empty_intake_good_summary.json"
        data = json.loads(path.read_text())
        summary = data["expected_summary"].lower()
        # These are all invented details that shouldn't appear in a good summary
        # for an empty intake
        for fabricated in ["35-year-old", "substance abuse", "three children", "sober"]:
            assert (
                fabricated not in summary
            ), f"Good summary contains hallucinated detail: '{fabricated}'"


# ─── Has Section Headers Tests ────────────────────────────────────────────────

SUMMARY_NO_HEADERS = "This is a summary with no headers at all."

SUMMARY_ONE_HEADER = "# Background\nThe client has a high school education."

SUMMARY_TWO_HEADERS = (
    "# Background\nHigh school graduate.\n\n"
    "# Employment\nWorked at a factory for 5 years."
)

SUMMARY_THREE_HEADERS = (
    "# Background\nHigh school graduate.\n\n"
    "# Employment\nFactory work.\n\n"
    "# Housing\nLiving with mother."
)

SUMMARY_FOUR_HEADERS = (
    "# Background\nHigh school graduate.\n\n"
    "# Employment\nFactory work.\n\n"
    "# Housing\nLiving with mother.\n\n"
    "# Goals\nWants to reconnect with children."
)


class TestHasSectionHeaders:
    def test_no_headers_scores_1(self):
        result = has_section_headers(make_run(SUMMARY_NO_HEADERS), make_example(""))
        assert result["key"] == "has_section_headers"
        assert result["score"] == 1
        assert result["header_count"] == 0

    def test_one_header_scores_5(self):
        result = has_section_headers(make_run(SUMMARY_ONE_HEADER), make_example(""))
        assert result["score"] == 5
        assert result["header_count"] == 1

    def test_two_headers_scores_5(self):
        result = has_section_headers(make_run(SUMMARY_TWO_HEADERS), make_example(""))
        assert result["score"] == 5
        assert result["header_count"] == 2

    def test_three_headers_scores_7(self):
        result = has_section_headers(make_run(SUMMARY_THREE_HEADERS), make_example(""))
        assert result["score"] == 7
        assert result["header_count"] == 3

    def test_four_headers_scores_10(self):
        result = has_section_headers(make_run(SUMMARY_FOUR_HEADERS), make_example(""))
        assert result["score"] == 10
        assert result["header_count"] == 4

    def test_result_has_all_keys(self):
        result = has_section_headers(make_run(SUMMARY_THREE_HEADERS), make_example(""))
        assert set(result.keys()) == {"key", "score", "header_count", "explanation"}

    def test_empty_summary_scores_1(self):
        result = has_section_headers(make_run(""), make_example(""))
        assert result["score"] == 1
        assert result["header_count"] == 0


# ─── Section Length Tests ─────────────────────────────────────────────────────

SHORT_SECTION = "# Intro\nShort."  # well under 30 words

NORMAL_SECTIONS = (
    "# Background\n"
    + " ".join(["word"] * 50)
    + "\n\n# Employment\n"
    + " ".join(["word"] * 60)
)

LONG_SECTION = "# Background\n" + " ".join(["word"] * 350)

TWO_FLAGGED = (
    "# Intro\nShort.\n\n"
    "# Middle\n" + " ".join(["word"] * 50) + "\n\n"
    "# End\n" + " ".join(["word"] * 350)
)


class TestSectionLength:
    def test_normal_sections_score_10(self):
        result = section_length(make_run(NORMAL_SECTIONS), make_example(""))
        assert result["key"] == "section_length"
        assert result["score"] == 10
        assert result["flagged_sections"] == []

    def test_short_section_reduces_score(self):
        result = section_length(make_run(SHORT_SECTION), make_example(""))
        assert result["score"] == 8
        assert len(result["flagged_sections"]) == 1
        assert result["flagged_sections"][0]["reason"] == "too short"

    def test_long_section_reduces_score(self):
        result = section_length(make_run(LONG_SECTION), make_example(""))
        assert result["score"] == 8
        assert len(result["flagged_sections"]) == 1
        assert result["flagged_sections"][0]["reason"] == "too long"

    def test_two_flagged_sections_score_6(self):
        result = section_length(make_run(TWO_FLAGGED), make_example(""))
        assert result["score"] == 6
        assert len(result["flagged_sections"]) == 2

    def test_score_minimum_is_1(self):
        many_short = "\n\n".join([f"# Section{i}\nShort." for i in range(10)])
        result = section_length(make_run(many_short), make_example(""))
        assert result["score"] == 1

    def test_flagged_sections_have_required_keys(self):
        result = section_length(make_run(SHORT_SECTION), make_example(""))
        for entry in result["flagged_sections"]:
            assert "header" in entry
            assert "word_count" in entry
            assert "reason" in entry

    def test_result_has_all_keys(self):
        result = section_length(make_run(NORMAL_SECTIONS), make_example(""))
        assert set(result.keys()) == {
            "key",
            "score",
            "flagged_sections",
            "explanation",
        }

    def test_empty_summary_returns_score_8(self):
        # Empty string produces one zero-word phantom section, flagged as too short.
        result = section_length(make_run(""), make_example(""))
        assert result["score"] == 8
        assert len(result["flagged_sections"]) == 1


# ─── Helpers for LLM evaluator mocking ───────────────────────────────────────


def make_binary_grade(binary_score, explanation="Test explanation."):
    grade = MagicMock()
    grade.binary_score = binary_score
    grade.explanation = explanation
    return grade


def make_score_grade(score, explanation="Test explanation."):
    grade = MagicMock()
    grade.one_to_ten_score = score
    grade.explanation = explanation
    return grade


# ─── not_toxic Tests ─────────────────────────────────────────────────────────


class TestNotToxic:
    @pytest.mark.asyncio
    async def test_clean_summary_scores_1(self):
        grade = make_binary_grade(
            binary_score=1, explanation="No toxic language found."
        )
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await not_toxic(make_run(GOOD_SUMMARY), make_example(""))
        assert result["key"] == "not_toxic"
        assert result["score"] == 1
        assert "explanation" in result

    @pytest.mark.asyncio
    async def test_toxic_summary_scores_0(self):
        grade = make_binary_grade(
            binary_score=0, explanation="Derogatory language found."
        )
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await not_toxic(make_run(TOXIC_SUMMARY), make_example(""))
        assert result["score"] == 0

    @pytest.mark.asyncio
    async def test_result_has_all_keys(self):
        grade = make_binary_grade(binary_score=1)
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await not_toxic(make_run(GOOD_SUMMARY), make_example(""))
        assert set(result.keys()) == {"key", "score", "explanation"}
        assert result["score"] in (0, 1)

    @pytest.mark.asyncio
    async def test_empty_summary_returns_valid_dict(self):
        grade = make_binary_grade(binary_score=1)
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await not_toxic(make_run(""), make_example(""))
        assert set(result.keys()) == {"key", "score", "explanation"}


# ─── tone Tests ───────────────────────────────────────────────────────────────


class TestTone:
    @pytest.mark.asyncio
    async def test_good_tone_scores_high(self):
        grade = make_score_grade(score=9, explanation="Kind and objective.")
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await tone(make_run(GOOD_SUMMARY), make_example(""))
        assert result["key"] == "tone"
        assert result["score"] == 9

    @pytest.mark.asyncio
    async def test_result_has_all_keys(self):
        grade = make_score_grade(score=7)
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await tone(make_run(GOOD_SUMMARY), make_example(""))
        assert set(result.keys()) == {"key", "score", "explanation"}
        assert 1 <= result["score"] <= 10

    @pytest.mark.asyncio
    async def test_empty_summary_returns_valid_dict(self):
        grade = make_score_grade(score=5)
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await tone(make_run(""), make_example(""))
        assert set(result.keys()) == {"key", "score", "explanation"}


# ─── no_judgments Tests ───────────────────────────────────────────────────────


class TestNoJudgments:
    @pytest.mark.asyncio
    async def test_objective_summary_scores_high(self):
        grade = make_score_grade(score=10, explanation="No moral judgments found.")
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await no_judgments(make_run(GOOD_SUMMARY), make_example(""))
        assert result["key"] == "no_judgments"
        assert result["score"] == 10

    @pytest.mark.asyncio
    async def test_judgmental_summary_scores_low(self):
        grade = make_score_grade(score=2, explanation="Contains subjective statements.")
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await no_judgments(make_run(GOOD_SUMMARY), make_example(""))
        assert result["score"] == 2

    @pytest.mark.asyncio
    async def test_result_has_all_keys(self):
        grade = make_score_grade(score=8)
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await no_judgments(make_run(GOOD_SUMMARY), make_example(""))
        assert set(result.keys()) == {"key", "score", "explanation"}
        assert 1 <= result["score"] <= 10

    @pytest.mark.asyncio
    async def test_empty_summary_returns_valid_dict(self):
        grade = make_score_grade(score=5)
        mock_chain = AsyncMock()
        mock_chain.ainvoke = AsyncMock(return_value=grade)
        with patch(
            "app.manage.evaluate.summary_evals.create_model_from_config"
        ) as mock_create:
            mock_create.return_value.with_structured_output.return_value.__ror__ = (
                MagicMock(return_value=mock_chain)
            )
            with patch(
                "app.manage.evaluate.summary_evals.ChatPromptTemplate"
            ) as mock_pt:
                mock_pt.from_messages.return_value.__or__ = MagicMock(
                    return_value=mock_chain
                )
                result = await no_judgments(make_run(""), make_example(""))
        assert set(result.keys()) == {"key", "score", "explanation"}
