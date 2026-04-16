"""LLM-as-judge evaluators for intake summaries."""

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
