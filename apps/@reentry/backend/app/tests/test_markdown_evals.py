"""Unit tests for citations_text_verified in markdown_evals.py."""

from unittest.mock import MagicMock

import pytest

from app.manage.evaluate.markdown_evals import citations_text_verified
from app.utils.action_plan_types import (
    ActionPlan,
    ActionPlanImmediateNeed,
    ActionPlanSection,
    Annotation,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_run(structured_plan):
    run = MagicMock()
    run.outputs = {"structured_plan": structured_plan}
    return run


def _make_example(messages):
    example = MagicMock()
    example.inputs = {"messages": messages}
    return example


def _make_plan(extracts: list[str]) -> ActionPlan:
    """Minimal ActionPlan with all annotations placed on immediate_needs."""
    annotations = [
        Annotation(
            source="Client intake messages",
            source_location="conversation",
            source_text_extract=extract,
        )
        for extract in extracts
    ]
    return ActionPlan(
        immediate_needs=ActionPlanImmediateNeed(
            annotations=annotations,
            title="Immediate Need",
            markdown_content="Act now.",
        ),
        quick_summary_circumstances="Summary.",
        overview="Overview.",
        sections_order=[],
        sections=[],
        milestones=[],
        timeline=[],
    )


def _make_plan_with_section_annotations(section_extracts: list[str]) -> ActionPlan:
    """Minimal ActionPlan with annotations on a section (not immediate_needs)."""
    annotations = [
        Annotation(
            source="Client intake messages",
            source_location="conversation",
            source_text_extract=extract,
        )
        for extract in section_extracts
    ]
    section = ActionPlanSection(
        annotations=annotations,
        title="Housing",
        markdown_content="Find housing.",
    )
    return ActionPlan(
        immediate_needs=ActionPlanImmediateNeed(
            annotations=[],
            title="Immediate Need",
            markdown_content="Act now.",
        ),
        quick_summary_circumstances="Summary.",
        overview="Overview.",
        sections_order=["Housing"],
        sections=[section],
        milestones=[],
        timeline=[],
    )


# ---------------------------------------------------------------------------
# Sample messages from frosty-writer-83.csv (Marcus example)
# ---------------------------------------------------------------------------

MESSAGES = [
    {
        "role": "assistant",
        "content": (
            "Hi Marcus, I'm here to help you through the reentry process. "
            "Can you start by telling me a bit about your current living situation?"
        ),
    },
    {
        "role": "user",
        "content": (
            "Hey. I'm staying at my mom's place right now, been there for two weeks "
            "since I got out. It's a small apartment, just one bedroom, so I'm on the "
            "couch. She's been great but it's cramped with her and my little sister there too."
        ),
    },
    {
        "role": "assistant",
        "content": (
            "I appreciate you sharing that. It sounds like you have family support, "
            "which is valuable. How long do you think you can stay there, and are you "
            "looking for your own place?"
        ),
    },
    {
        "role": "user",
        "content": (
            "Yeah, I need my own place soon. My mom says I can stay a few months but "
            "I don't want to burden her. Problem is I don't have income right now and "
            "most places won't rent to me with my record."
        ),
    },
    {
        "role": "user",
        "content": (
            "I'm healthy, no major issues. Sometimes I get anxious about finding work "
            "and getting my life together, but nothing I can't handle."
        ),
    },
]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_citation_found_as_plain_substring():
    """A verbatim substring of a message content passes."""
    plan = _make_plan(
        ["Sometimes I get anxious about finding work and getting my life together"]
    )
    result = await citations_text_verified(_make_run(plan), _make_example(MESSAGES))
    assert result["score"] == 1


@pytest.mark.asyncio
async def test_full_client_message_as_citation():
    """The entire content of a single client message passes."""
    full_quote = (
        "Hey. I'm staying at my mom's place right now, been there for two weeks "
        "since I got out. It's a small apartment, just one bedroom, so I'm on the "
        "couch. She's been great but it's cramped with her and my little sister there too."
    )
    plan = _make_plan([full_quote])
    result = await citations_text_verified(_make_run(plan), _make_example(MESSAGES))
    assert result["score"] == 1


@pytest.mark.asyncio
async def test_citation_spanning_message_boundary_with_role_prefix_passes():
    """Citation that reproduces the role label at a message boundary passes.

    The LLM sometimes generates a citation that ends one speaker's turn and
    includes the next speaker's role label, e.g.
      "Have you ever served in the military? client: Yes"
    This crosses the boundary between two messages in the corpus.
    """
    boundary_messages = [
        {"role": "assistant", "content": "Have you ever served in the military?"},
        {"role": "client", "content": "Yes"},
    ]
    plan = _make_plan(["Have you ever served in the military? client: Yes"])
    result = await citations_text_verified(
        _make_run(plan), _make_example(boundary_messages)
    )
    assert result["score"] == 1


@pytest.mark.asyncio
async def test_citation_with_smart_apostrophes_passes():
    """Curly/smart apostrophes from the LLM match straight apostrophes in stored messages."""
    # The LLM often outputs ‘/’ ('' '') and “/” ("" "")
    # while messages stored as JSON use plain ASCII ' and "
    smart_quote_extract = "I’m staying at my mom’s place right now"
    plan = _make_plan([smart_quote_extract])
    result = await citations_text_verified(_make_run(plan), _make_example(MESSAGES))
    assert result["score"] == 1


@pytest.mark.asyncio
async def test_citation_not_in_any_message_fails():
    """A citation that does not appear in any message returns score 0."""
    plan = _make_plan(["I have never experienced any anxiety in my entire life"])
    result = await citations_text_verified(_make_run(plan), _make_example(MESSAGES))
    assert result["score"] == 0
    assert "not found" in result["comment"].lower()


@pytest.mark.asyncio
async def test_mixed_citations_partial_failure():
    """When one citation passes and one fails, the overall score is 0."""
    plan = _make_plan(
        [
            "Sometimes I get anxious about finding work and getting my life together",
            "I have never experienced any anxiety in my entire life",
        ]
    )
    result = await citations_text_verified(_make_run(plan), _make_example(MESSAGES))
    assert result["score"] == 0


@pytest.mark.asyncio
async def test_no_annotations_returns_score_one():
    """A plan with no annotations returns score 1 — nothing to falsify."""
    plan = _make_plan([])
    result = await citations_text_verified(_make_run(plan), _make_example(MESSAGES))
    assert result["score"] == 1


@pytest.mark.asyncio
async def test_section_annotations_are_checked():
    """Annotations on a section (not just immediate_needs) are also verified."""
    plan = _make_plan_with_section_annotations(
        ["Sometimes I get anxious about finding work and getting my life together"]
    )
    result = await citations_text_verified(_make_run(plan), _make_example(MESSAGES))
    assert result["score"] == 1


@pytest.mark.asyncio
async def test_no_structured_plan_returns_score_zero():
    """Missing structured_plan in run outputs returns score 0."""
    run = MagicMock()
    run.outputs = {}
    result = await citations_text_verified(run, _make_example(MESSAGES))
    assert result["score"] == 0
