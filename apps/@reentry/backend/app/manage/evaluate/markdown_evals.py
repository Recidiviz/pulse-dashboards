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

    return {"key": "addressed_to_client", "score": int(score.one_to_ten_score)}


# The action plan should clearly delineate which steps need to be taken, and when, by the client, and which should be taken by the caseworker
async def clarity(run: Run, example: Example):
    prediction = run.outputs["markdown"]

    # Data model
    class GradeClarity(BaseModel):
        """One to ten score for the clarity of the plan"""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Plan is clear and actionable, from 1 to 10"
        )

    # LLM with function call
    structured_llm_grader = eval_llm.with_structured_output(GradeClarity)

    # Prompt
    criterium = "clarity: The action plan should clearly delineate which steps need to be taken, and when, by the client, and which should be taken by the case manager. No step in the plan is without a time and an assignee."

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

    return {"key": "clarity", "score": int(score.one_to_ten_score)}


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
    criterium = """actionable: In this plan, all steps should be precise and actionable: the docuemnt should include the name and contact information of the place to contact. The step should be precise and measurable

    rejected examples: "Get treatment", "Establish a support network", "Find a job"

    accepted examples: "Register with XYZ  treatment center's 3-month outpatient treatment program", "Attend a support group meeting at the ABC community center every Tuesday at 7pm", "Apply to 5 jobs this week"

    Rate this on a scale of 0-10. If all steps conform to this criteria, assign a 10, if none of them do assign a 0."""

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

    return {"key": "actionable", "score": int(score.one_to_ten_score)}


# The action plan has the expected structure. We might need o rework this in case we split the action plan generation into multiple passes.
async def structure(run: Run, example: Example):
    prediction = run.outputs["markdown"]

    # Data model
    class GradeTone(BaseModel):
        """One to ten score for the structure of the plan"""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Plan is conform to the expected structure, from 1 to 10"
        )

    # LLM with function call
    structured_llm_grader = eval_llm.with_structured_output(GradeTone)

    # Prompt
    criterium = """structure: The plan should have the following structure:
    - Background: Describes briefly the history of the person’s situation and what this action plan is intended to do.
    - Immediate needs: Which issues should be addressed urgently to create the stability necessary for success
    - [Plans by section]: Each section should be specific to an area of needs or risks (e.g., housing, employment, etc.)
    - Milestones: Milestones the case manager and client can check in on together to know whether it’s working / they’re on the right track
    - Timeline: An enumeration week-by-week, then month-by-month after 2mo, of each of the steps the individual and their case manager should take along the path of the action plan
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

    return {"key": "structure", "score": int(score.one_to_ten_score)}


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

    return {"key": "tone", "score": int(score.one_to_ten_score)}


# The timeline is properly formed (no repetitions, all steps noted down, dates are in the right order…)
async def timeline(run: Run, example: Example):
    prediction = run.outputs["markdown"]

    # Data model
    class GradeTimeline(BaseModel):
        """One to ten score for the timeline of the plan"""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Timeline is properly formed, from 1 to 10"
        )

    # LLM with function call
    structured_llm_grader = eval_llm.with_structured_output(GradeTimeline)

    # Prompt
    criterium = "The timeline is properly formed (no repetitions, all steps noted down, dates are in the right order… It should contain a week-by-week enumeration of the steps to take, then a month-by-month enumeration after 2 months. It should include all the steps outlined in the rest of the plan"

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

    return {"key": "timeline", "score": int(score.one_to_ten_score)}


# Not mention judgments or subjective statement
async def no_judgments(run: Run, example: Example):
    prediction = run.outputs["markdown"]

    # Data model
    class GradeJudgments(BaseModel):
        """One to ten score for the absence of judgments in the plan"""

        explanation: str = Field(description="Explanation of the score")
        one_to_ten_score: int = Field(
            description="Except in the notes and annotations, the plan has no subjective statements, from 1 to 10"
        )

    # LLM with function call
    structured_llm_grader = eval_llm.with_structured_output(GradeJudgments)

    # Prompt
    criterium = "judgment: The plan should not mention judgments or subjective statement, except in the comments"

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

    return {"key": "no_judgments", "score": int(score.one_to_ten_score)}


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


# Check that citation sources reference the transcript/conversation
async def citations_source_is_transcript(run: Run, example: Example):
    structured_plan = run.outputs.get("structured_plan")

    if not structured_plan:
        # Fallback if structured plan is not available
        return {"key": "citations_source_is_transcript", "score": 0}

    # Extract all annotations
    all_annotations = _extract_all_annotations(structured_plan)

    # If no annotations, return perfect score (nothing to validate)
    if not all_annotations:
        return {"key": "citations_source_is_transcript", "score": 1}

    # Check if all sources reference transcript or conversation
    valid_sources = {"transcript", "conversation", "intake"}
    invalid_annotations = []

    for i, ann in enumerate(all_annotations):
        source_lower = ann.source.lower()
        if not any(valid_src in source_lower for valid_src in valid_sources):
            invalid_annotations.append(
                f"Citation {i+1}: Source='{ann.source}' (should reference transcript/conversation)"
            )

    # Calculate score: 1 if all valid, 0 if any invalid
    score = 1 if len(invalid_annotations) == 0 else 0

    return {"key": "citations_source_is_transcript", "score": score}


# Verify that citation text extracts actually appear in the transcript
async def citations_text_verified(run: Run, example: Example):
    structured_plan = run.outputs.get("structured_plan")
    messages = example.inputs.get("messages", [])

    if not structured_plan:
        # Fallback if structured plan is not available
        return {"key": "citations_text_verified", "score": 0}

    # Extract all annotations
    all_annotations = _extract_all_annotations(structured_plan)

    # If no annotations, return perfect score (nothing to validate)
    if not all_annotations:
        return {"key": "citations_text_verified", "score": 1}

    # Format annotations for LLM evaluation
    annotations_text = "\n\n".join(
        [
            f'Citation {i+1}:\n- Source: {ann.source}\n- Location: {ann.source_location}\n- Text Extract: "{ann.source_text_extract}"'
            for i, ann in enumerate(all_annotations)
        ]
    )

    # Data model
    class GradeCitationVerification(BaseModel):
        """Binary score for whether citation text extracts are accurate"""

        explanation: str = Field(description="Explanation of the score")
        binary_score: int = Field(
            description="1 if all citation text extracts are accurate, 0 otherwise"
        )

    # LLM with function call
    structured_llm_grader = eval_llm.with_structured_output(GradeCitationVerification)

    # Prompt
    criterium = """citations_text_verified: All citation text extracts must accurately reflect what appears in the transcript. Each "Text Extract" should either directly quote or accurately paraphrase content from the transcript messages. Partial citations are accepted, only factually incorrect ones should be reported.

    For each citation listed, verify that the "Text Extract" can be traced to the transcript. The extract doesn't need to be a verbatim quote, but it should accurately represent what was said. If ALL citation text extracts are accurate and traceable to the transcript, assign a score of 1. If ANY citation text extract is fabricated, misquoted, or cannot be found in the transcript, assign a score of 0.
    """

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            (
                "human",
                "Transcript Messages: \n\n {transcript}\n\nCitations to Verify: \n\n {citations}",
            ),
        ]
    )

    grader = prompt | structured_llm_grader
    score = await grader.with_retry(
        stop_after_attempt=DEFAULT_MAX_RETRIES,
        retry_if_exception_type=ERRORS_TO_RETRY_ON,
    ).ainvoke(
        {
            "transcript": str(messages),
            "citations": annotations_text,
            "criteria": criterium,
            "type_of_prompt": binary_prompt,
        }
    )

    return {"key": "citations_text_verified", "score": int(score.binary_score)}
