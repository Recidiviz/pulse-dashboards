"""LLM-as-judge evaluators for intake summaries."""

import re

from langchain_core.prompts import ChatPromptTemplate
from langsmith.schemas import Example, Run
from pydantic import BaseModel, Field

from app.core.config import create_model_from_config, settings

# A coverage score of this or higher (out of 10) is considered passing.
COVERAGE_PASS_THRESHOLD = 7


async def grounding_check(run: Run, example: Example) -> dict:
    """
    Evaluate whether the summary is grounded in the intake conversation.

    Returns a binary score (1 = grounded, 0 = hallucination detected) and categorizes
    each fact as correct, interpretive, or hallucinated.
    """
    summary = run.outputs.get("summary", "")
    intake_messages = example.inputs.get("intake_messages", "")
    system_prompt = example.inputs.get("system_prompt", "")

    eval_llm = create_model_from_config(
        settings.EVAL_MODEL_PROVIDER,
        settings.EVAL_MODEL_NAME,
        settings.EVAL_MODEL_VERSION,
    )

    class CategorizedFact(BaseModel):
        fact: str = Field(description="The fact as it appears in the summary")
        explanation: str = Field(
            description="Why this fact was placed in this category"
        )

    class GroundingGrade(BaseModel):
        """Grounding evaluation: does the summary contain only information from the intake?"""

        explanation: str = Field(description="Overall explanation of the evaluation")
        binary_score: int = Field(
            description="1 if no hallucinations detected, 0 if hallucinations present"
        )
        correct_facts: list[CategorizedFact] = Field(
            description=(
                "Facts from the intake OR accurate observations about what was/wasn't said. "
                "Includes: (1) Direct quotes or paraphrases, (2) Accurate absence observations "
                "(e.g., 'no college education mentioned'), (3) True meta-statements about the conversation. "
                "For each fact, provide the fact text and an explanation of why it is correct."
            )
        )
        interpretive_additions: list[CategorizedFact] = Field(
            description=(
                "Professional inferences, assessments, or recommendations not explicitly stated "
                "in intake. Includes: (1) Needs assessments (e.g., 'likely needs employment "
                "assistance'), (2) Risk assessments (e.g., 'at risk of relapse'), (3) Priority "
                "recommendations (e.g., 'should secure housing'), (4) Professional judgments about services. "
                "For each addition, provide the fact text and an explanation of why it is interpretive rather than stated."
            )
        )
        hallucinated_facts: list[CategorizedFact] = Field(
            description=(
                "Fabricated facts that contradict or add information not present in intake. "
                "Do NOT include interpretive additions here. "
                "For each hallucination, provide the fact text and an explanation of why it is fabricated."
            )
        )

    # LLM with structured output
    structured_llm_grader = eval_llm.with_structured_output(GroundingGrade)

    # Prompt
    criterium = """grounding: Categorize each fact in the summary into one of three categories:

    1. CORRECT FACTS: Information from the intake conversation OR accurate observations about what was/wasn't said
       - Direct quotes or accurate paraphrases of what the client said
       - Accurate observations about absence of information (e.g., "no college education mentioned", "did not disclose employment history")
       - True meta-statements about the conversation itself
       - Examples:
         * Intake: "I finished high school" → Summary: "high school graduate" ✓ CORRECT
         * Intake: "I finished high school" [no mention of college] → Summary: "no post-secondary credentials reported" ✓ CORRECT
         * Intake: "I don't want to talk about it" → Summary: "client declined to provide information" ✓ CORRECT

    2. INTERPRETIVE ADDITIONS: Professional inferences, assessments, or recommendations based on the intake
       - Needs assessments (e.g., "likely needs employment assistance")
       - Risk assessments (e.g., "at risk of relapse without support")
       - Priority recommendations (e.g., "should secure stable housing")
       - Professional judgments about what services would help
       - Inferences about unstated needs based on stated facts
       - These are NOT hallucinations - they are reasonable professional interpretations

    3. HALLUCINATED FACTS: Fabricated information that contradicts or invents facts not present in the intake
       - Specific details not mentioned (e.g., "has 3 children" when only "I have kids" was said)
       - Contradictory information (e.g., "employed" when client said "unemployed")
       - Invented biographical details (e.g., "35-year-old male" when age/gender never mentioned)
       - Made-up histories or circumstances

    IMPORTANT DISTINCTIONS:
    - "No post-secondary education" [when not mentioned] = CORRECT (accurate absence observation)
    - "Likely needs employment assistance" = INTERPRETIVE (professional needs inference)
    - "At risk of relapse without support" = INTERPRETIVE (professional risk assessment)
    - "Should pursue vocational training" = INTERPRETIVE (recommendation)
    - "Has 3 children" [when only "kids" mentioned] = HALLUCINATION (specific number fabricated)
    - "35-year-old male" [when not mentioned] = HALLUCINATION (fabricated demographics)

    Score 1 if NO hallucinations detected (interpretive additions are allowed).
    Score 0 if ANY hallucinated facts are present."""

    system_context_section = (
        "System context provided to the summary LLM (facts from this context are "
        "CORRECT, not hallucinations):\n\n{system_prompt}\n\n"
        if system_prompt
        else ""
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Please act as an impartial judge and evaluate the quality of this Intake Summary. "
                    "For this evaluation, you should only consider the following criteria:\n\n"
                    "{criterium}\n\n"
                    "After providing your explanation, give a binary score 1 or 0, where 1 means that "
                    "the summary meets the criteria and 0 means that it does not."
                ),
            ),
            (
                "human",
                system_context_section
                + "Intake Conversation:\n\n{intake_messages}\n\nSummary:\n\n{summary}",
            ),
        ]
    )

    chain = prompt | structured_llm_grader
    score = await chain.ainvoke(
        {
            "criterium": criterium,
            "intake_messages": intake_messages,
            "summary": summary,
            "system_prompt": system_prompt,
        }
    )

    return {
        "key": "grounding",
        "score": int(score.binary_score),
        "explanation": score.explanation,
        "correct_facts": [f.model_dump() for f in score.correct_facts],
        "interpretive_additions": [
            f.model_dump() for f in score.interpretive_additions
        ],
        "hallucinated_facts": [f.model_dump() for f in score.hallucinated_facts],
    }


async def coverage_check(run: Run, example: Example) -> dict:
    """
    Evaluate whether the summary covers all important details from the intake.

    Returns a 1-10 score for completeness and lists missing details.
    """
    summary = run.outputs.get("summary", "")
    intake_messages = example.inputs.get("intake_messages", "")

    eval_llm = create_model_from_config(
        settings.EVAL_MODEL_PROVIDER,
        settings.EVAL_MODEL_NAME,
        settings.EVAL_MODEL_VERSION,
    )

    class CoverageGrade(BaseModel):
        """Coverage evaluation: does the summary include all important details?"""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Coverage score from 1 (many missing) to 10 (complete)"
        )
        missing_details: list[str] = Field(
            description="List of important details missing from the summary"
        )

    # LLM with structured output
    structured_llm_grader = eval_llm.with_structured_output(CoverageGrade)

    # Prompt
    criterium = """coverage: The summary includes all important details from the intake conversation that are relevant for creating an action plan. This includes:

    - Personal background and history (criminal record, family situation, etc.)
    - Current situation and living circumstances
    - Identified needs (housing, employment, education, healthcare, etc.)
    - Goals and aspirations
    - Challenges and barriers (substance abuse, mental health, transportation, etc.)
    - Available resources and support systems
    - Risk factors or urgent concerns

    The summary should not include every single detail, but it must include all information that is important for understanding the client's situation and planning next steps.

    Rate this on a scale of 1-10:
    - 10: All important details are included
    - 7-9: Most important details included, minor gaps
    - 4-6: Some important details missing
    - 1-3: Many important details missing

    List any important details that are missing from the summary."""

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Please act as an impartial judge and evaluate the quality of this Intake Summary. "
                    "For this evaluation, you should only consider the following criteria:\n\n"
                    "{criterium}\n\n"
                    "After providing your explanation, you must rate the summary on a scale of 1 to 10"
                ),
            ),
            (
                "human",
                "Intake Conversation:\n\n{intake_messages}\n\nSummary:\n\n{summary}",
            ),
        ]
    )

    chain = prompt | structured_llm_grader
    score = await chain.ainvoke(
        {"criterium": criterium, "intake_messages": intake_messages, "summary": summary}
    )

    return {
        "key": "coverage",
        "score": int(score.one_to_ten_score),
        "explanation": score.explanation,
        "missing_details": score.missing_details,
    }


async def not_toxic(run: Run, example: Example) -> dict:
    """Binary check: summary contains no harmful, derogatory, or stigmatizing language."""
    summary = run.outputs.get("summary", "")

    eval_llm = create_model_from_config(
        settings.EVAL_MODEL_PROVIDER,
        settings.EVAL_MODEL_NAME,
        settings.EVAL_MODEL_VERSION,
    )

    class ToxicityGrade(BaseModel):
        """Toxicity evaluation: does the summary use harmful or stigmatizing language?"""

        explanation: str = Field(description="Explanation of the evaluation")
        binary_score: int = Field(
            description="1 if no toxic content detected, 0 if toxic content present"
        )

    structured_llm_grader = eval_llm.with_structured_output(ToxicityGrade)

    criterium = (
        "not_toxic: The summary contains no harmful, derogatory, or stigmatizing language "
        "about the client. This includes slurs, overtly negative characterizations, and any "
        "language that demeans or dehumanizes the client.\n\n"
        "Score 1 if no such language is present. Score 0 if any is detected."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Please act as an impartial judge and evaluate the quality of this Intake Summary. "
                    "For this evaluation, you should only consider the following criteria:\n\n"
                    "{criterium}\n\n"
                    "After providing your explanation, give a binary score 1 or 0, where 1 means that "
                    "the summary meets the criteria and 0 means that it does not."
                ),
            ),
            ("human", "Summary:\n\n{summary}"),
        ]
    )

    chain = prompt | structured_llm_grader
    score = await chain.ainvoke({"criterium": criterium, "summary": summary})

    return {
        "key": "not_toxic",
        "score": int(score.binary_score),
        "explanation": score.explanation,
    }


async def tone(run: Run, example: Example) -> dict:
    """Evaluate whether the summary has a kind, supportive, and objective tone (1–10)."""
    summary = run.outputs.get("summary", "")

    eval_llm = create_model_from_config(
        settings.EVAL_MODEL_PROVIDER,
        settings.EVAL_MODEL_NAME,
        settings.EVAL_MODEL_VERSION,
    )

    class ToneGrade(BaseModel):
        """Tone evaluation: 1–10 score for appropriate tone in the summary."""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Tone score from 1 (poor) to 10 (excellent)"
        )

    structured_llm_grader = eval_llm.with_structured_output(ToneGrade)

    criterium = (
        "tone: The summary has a kind, supportive, down-to-earth (not falsely friendly), "
        "and objective tone throughout. It should treat the client with dignity and avoid "
        "both harsh clinical detachment and saccharine positivity.\n\n"
        "Rate from 1 (inappropriate tone throughout) to 10 (excellent tone throughout)."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Please act as an impartial judge and evaluate the quality of this Intake Summary. "
                    "For this evaluation, you should only consider the following criteria:\n\n"
                    "{criterium}\n\n"
                    "After providing your explanation, rate the summary on a scale of 1 to 10."
                ),
            ),
            ("human", "Summary:\n\n{summary}"),
        ]
    )

    chain = prompt | structured_llm_grader
    score = await chain.ainvoke({"criterium": criterium, "summary": summary})

    return {
        "key": "tone",
        "score": int(score.one_to_ten_score),
        "explanation": score.explanation,
    }


async def no_judgments(run: Run, example: Example) -> dict:
    """Evaluate whether the summary avoids moral judgments or subjective statements (1–10)."""
    summary = run.outputs.get("summary", "")

    eval_llm = create_model_from_config(
        settings.EVAL_MODEL_PROVIDER,
        settings.EVAL_MODEL_NAME,
        settings.EVAL_MODEL_VERSION,
    )

    class JudgmentsGrade(BaseModel):
        """Judgment evaluation: 1–10 score for absence of moral judgments."""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Score from 1 (many judgments) to 10 (no judgments)"
        )

    structured_llm_grader = eval_llm.with_structured_output(JudgmentsGrade)

    criterium = (
        "no_judgments: The summary does not contain moral judgments or subjective statements "
        "about the client's character, choices, or worth. It presents facts and observations "
        "objectively without labeling the client as good/bad, worthy/unworthy, or making "
        "character assessments beyond what was directly expressed.\n\n"
        "Rate from 1 (many judgments throughout) to 10 (completely objective)."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Please act as an impartial judge and evaluate the quality of this Intake Summary. "
                    "For this evaluation, you should only consider the following criteria:\n\n"
                    "{criterium}\n\n"
                    "After providing your explanation, rate the summary on a scale of 1 to 10."
                ),
            ),
            ("human", "Summary:\n\n{summary}"),
        ]
    )

    chain = prompt | structured_llm_grader
    score = await chain.ainvoke({"criterium": criterium, "summary": summary})

    return {
        "key": "no_judgments",
        "score": int(score.one_to_ten_score),
        "explanation": score.explanation,
    }


def has_section_headers(run: Run, example: Example) -> dict:
    """Count markdown headers (any level) and score based on expected structure."""
    summary = run.outputs.get("summary", "")
    headers = re.findall(r"^#{1,6} ", summary, re.MULTILINE)
    count = len(headers)
    if count == 0:
        score = 1
    elif count <= 2:
        score = 5
    elif count == 3:
        score = 7
    else:
        score = 10
    return {
        "key": "has_section_headers",
        "score": score,
        "header_count": count,
        "explanation": f"Found {count} header(s).",
    }


def section_length(run: Run, example: Example) -> dict:
    """Flag sections that are too short (<30 words) or too long (>300 words)."""
    summary = run.outputs.get("summary", "")
    raw_sections = summary.lstrip("\n").split("\n# ")
    flagged = []
    for section in raw_sections:
        lines = section.split("\n", 1)
        header = lines[0].lstrip("# ").strip()
        # word_count includes the header line text; the conservative thresholds absorb the few extra words
        word_count = len(section.split())
        if word_count < 30:
            flagged.append(
                {"header": header, "word_count": word_count, "reason": "too short"}
            )
        elif word_count > 300:
            flagged.append(
                {"header": header, "word_count": word_count, "reason": "too long"}
            )
    score = max(1, 10 - 2 * len(flagged))
    return {
        "key": "section_length",
        "score": score,
        "flagged_sections": flagged,
        "explanation": f"{len(flagged)} section(s) flagged for length.",
    }
