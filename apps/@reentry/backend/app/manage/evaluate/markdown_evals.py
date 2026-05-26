from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langsmith.schemas import Example, Run
from pydantic import BaseModel, Field

from app.core.config import settings
from app.utils.llm_retry_config import DEFAULT_MAX_RETRIES, ERRORS_TO_RETRY_ON

eval_llm = ChatOpenAI(
    api_key=settings.OPENAI_API_KEY,
    model="o4-mini",
    base_url=settings.OPENAI_BASE_URL,
)

grade_prompt = (
    "After providing your explanation, you must rate the response on a scale of 1 to 10"
)
binary_prompt = "After providing your explanation, give a binary score 1 or 0, where 1 means that plan conforms to the criteria and 0 means that it does not."

system_prompt = """
    Please act as an impartial judge and evaluate the quality of this Action Plan Document. For this evaluation, you should only consider the following criteria:
    {criteria}

    {type_of_prompt}
    """


# Todo: Add the following criteria to the evaluation:
# Ignore factors which may suggest race
# Quote source materials verbatim only in the annotations block for the case worker
# The steps from the decision trees are respected.
# The conditions for probation are correctly described


# Not to recommend local resources except as provided through the resource pipeline.
# The document is addressed to the client
async def addressed_to_client(run: Run, example: Example):
    prediction = run.outputs["markdown"]

    # Data model
    class AdressedToClientGrade(BaseModel):
        """Is the document addressed to the client ?"""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Plan is adressed to the client, 1 to 10"
        )

    # LLM with function call
    structured_llm_grader = eval_llm.with_structured_output(AdressedToClientGrade)

    # Prompt
    criterium = """adress_to_client: The document is addressed to the client, except in the notes and annotations. The client is always addressed in the second person.

    accepted examples: \"You should do this\", \"You need to do that\", \"You can contact me at this number\", \"Reach out to this organization\", "<notes>: The client has said that they are not comfortable with this organization, so we should look for another one</notes>\".

    rejected examples: \"The client is a 20 years old male\", \"The client should do this\", \"*client*: Reach out to the organization\".
    """

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "Action Plan: \n\n {prediction}"),
        ]
    )

    grader = prompt | structured_llm_grader
    score = await grader.with_retry(
        stop_after_attempt=DEFAULT_MAX_RETRIES,
        retry_if_exception_type=ERRORS_TO_RETRY_ON,
    ).ainvoke(
        {
            "prediction": prediction,
            "criteria": criterium,
            "type_of_prompt": grade_prompt,
        }
    )

    return {
        "key": "addressed_to_client",
        "score": int(score.one_to_ten_score),
        "comment": score.explanation,
    }

# Recommended steps should be actionable
async def actionable(run: Run, example: Example):
    prediction = run.outputs["markdown"]

    # Data model
    class GradeActionable(BaseModel):
        """One to ten score for the actionability of the plan"""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Plan is precise and actionable, from 1 to 10"
        )

    # LLM with function call
    structured_llm_grader = eval_llm.with_structured_output(GradeActionable)

    # Prompt
    criterium = """actionable: Each action item or goal in the plan should be a concrete suggestion that comes with clear next steps the client can take. Vague goals without any defined steps should score low.

    accepted examples: "Register for the 3-month outpatient treatment program at the community health center", "Apply to 5 jobs this week starting with the positions discussed in your intake"
    rejected examples: "Find stable housing", "Work on your employment situation", "Build a support network"

    Rate 0–10. If every item includes a clear next step for the client, assign 10; if none do, assign 0."""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "Action Plan: \n\n {prediction}"),
        ]
    )

    grader = prompt | structured_llm_grader
    score = await grader.with_retry(
        stop_after_attempt=DEFAULT_MAX_RETRIES,
        retry_if_exception_type=ERRORS_TO_RETRY_ON,
    ).ainvoke(
        {
            "prediction": prediction,
            "criteria": criterium,
            "type_of_prompt": grade_prompt,
        }
    )

    return {
        "key": "actionable",
        "score": int(score.one_to_ten_score),
        "comment": score.explanation,
    }

# The report has the expected tone: kind, supportive, down-to-earth (not false friendly), but objective tone.
async def tone(run: Run, example: Example):
    prediction = run.outputs["markdown"]

    # Data model
    class GradeTone(BaseModel):
        """One to ten score for the tone of the plan"""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Plan has the expected tone, from 1 to 10"
        )

    # LLM with function call
    structured_llm_grader = eval_llm.with_structured_output(GradeTone)

    # Prompt
    criterium = "Except in the notes and annotations, The report has the expected tone: kind, supportive, down-to-earth (not false friendly), but objective tone."

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "Action Plan: \n\n {prediction}"),
        ]
    )

    grader = prompt | structured_llm_grader
    score = await grader.with_retry(
        stop_after_attempt=DEFAULT_MAX_RETRIES,
        retry_if_exception_type=ERRORS_TO_RETRY_ON,
    ).ainvoke(
        {
            "prediction": prediction,
            "criteria": criterium,
            "type_of_prompt": grade_prompt,
        }
    )

    return {
        "key": "tone",
        "score": int(score.one_to_ten_score),
        "comment": score.explanation,
    }

# Helper function to extract all annotations from structured plan
def _extract_all_annotations(structured_plan):
    """Extract all annotations from the structured action plan"""
    all_annotations = []

    # Get annotations from immediate needs
    if structured_plan.immediate_needs and structured_plan.immediate_needs.annotations:
        all_annotations.extend(structured_plan.immediate_needs.annotations)

    # Get annotations from all sections
    for section in structured_plan.sections:
        if section.annotations:
            all_annotations.extend(section.annotations)

    return all_annotations


# Verify that citation text extracts actually appear in the transcript
async def citations_text_verified(run: Run, example: Example):
    structured_plan = run.outputs.get("structured_plan")
    messages = example.inputs.get("messages", [])

    if not structured_plan:
        return {"key": "citations_text_verified", "score": 0}

    all_annotations = _extract_all_annotations(structured_plan)

    if not all_annotations:
        return {"key": "citations_text_verified", "score": 1}

    corpus = " ".join(
        m.get("content", "") for m in messages if m.get("content")
    ).lower()

    failed = []
    for i, ann in enumerate(all_annotations, 1):
        if ann.source_text_extract.lower() not in corpus:
            failed.append(f'Citation {i}: "{ann.source_text_extract}"')

    score = 0 if failed else 1
    comment = (
        "All citation text extracts found in transcript."
        if not failed
        else f"Citations not found in transcript: {'; '.join(failed)}"
    )
    return {"key": "citations_text_verified", "score": score, "comment": comment}


async def grounded(run: Run, example: Example):
    prediction = run.outputs["markdown"]
    messages = example.inputs.get("messages", [])

    context = (
        "# Intake conversation\n"
        + "\n".join(
            f"{m.get('role', 'unknown')}: {m.get('content', '')}"
            for m in messages
            if m.get("content")
        )
    ) if messages else "(no conversation provided)"

    class GradeGrounded(BaseModel):
        """Score for how factually grounded the action plan is in the intake conversation."""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(description="Grounded score from 0 to 10")

    structured_llm_grader = eval_llm.with_structured_output(GradeGrounded)

    criterium = """grounded: Every claim, recommendation, and detail in the action plan should be traceable to the client's actual intake conversation. The plan should not invent facts, assume circumstances not mentioned, or make generic recommendations unrelated to what this specific client shared.

Score 10 if every element of the plan is clearly grounded in the provided conversation.
Score 0 if the plan reads as a generic template with little connection to the client's specific situation.
Deduct points for each invented fact or recommendation that has no basis in the conversation."""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "Client input:\n\n{context}\n\nAction Plan:\n\n{prediction}"),
        ]
    )

    grader = prompt | structured_llm_grader
    score = await grader.with_retry(
        stop_after_attempt=DEFAULT_MAX_RETRIES,
        retry_if_exception_type=ERRORS_TO_RETRY_ON,
    ).ainvoke(
        {
            "context": context,
            "prediction": prediction,
            "criteria": criterium,
            "type_of_prompt": grade_prompt,
        }
    )

    return {
        "key": "grounded",
        "score": int(score.one_to_ten_score),
        "comment": score.explanation,
    }
