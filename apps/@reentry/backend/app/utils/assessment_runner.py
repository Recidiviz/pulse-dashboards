import json
from pathlib import Path
from typing import List, Literal
from uuid import UUID

import structlog
from pydantic import BaseModel, Field

from app.utils.llm_agent_qa import LLMAgentQA
from app.utils.mermaid import (
    MermaidGraph,
    MermaidGraphTraversalCount,
    MermaidGraphTraversalEnd,
    MermaidGraphTraversalQuestion,
)

logger = structlog.get_logger(__name__)
PROJECT_ROOT = Path(__file__).parent.parent.parent
# =============================================================================
# Decision tree selection
# =============================================================================


class Annotation(BaseModel):
    source: str = Field(description="The source of the annotation")
    source_location: str = Field(
        description="The location of the annotation in the source"
    )
    source_text_extract: str = Field(description="The text extract of the annotation")


# =============================================================================
# Decision tree execution
# =============================================================================


class AssessmentAnswer(BaseModel):
    answer: str = Field(description="The possible answer that is best suited")
    annotations: list[Annotation] = Field(description="The annotations of the answer")


DT_ASSESSMENT_SYSTEM_PROMPT = (
    "You are a AI designed to assist a social worker for evaluating incoming clients."
    "You will be provided with information about the person."
    "Based on this information, you are going to be asked multiple choice questions about the client's situation."
    "You will look back on this client's situation and answer the questions be quoting the documents we provided."
    "# Client information\n{formatted_client_info}\n\n"
)
EXECUTION_PROMPT = (
    "Based on the client's situation: \n{question}\n"
    "Then, to the best of your ability, choose one of these possible answer: {possible_answers}\n"
    "Give an extract/citation that corresponds to the client's situation to justify your answer in the annotations section of your answer.\n"
    'If you don\'t have enough information to answer a question, answer "unclear", do not make a note about it.\n'
    "Bad example:\n"
    "answer: stable, annotation: No information provided regarding relationship with parental figures..\n"
    "Good example:\n"
    "answer: unclear, annotation: None"
)

# set_debug(True)
# set_verbose(True)


# =============================================================================
# Result of a decision tree runner
# =============================================================================


class AssessmentRunnerStep(BaseModel):
    node_key: str = Field(description="Node traversed during the execution")
    node_value: str | None = Field(description="Value of the node, for reference")
    node_attached_question: str | None = None
    node_type: str = Field(description="Type of the node, for reference")
    annotations: list[Annotation] | None = Field(
        description="The annotations of the answer (for question only)",
        default=None,
    )
    score: int | None | Literal["miss"] = Field(
        description="The score modification, if any (for calculation steps only)",
        default=None,
    )


class AssessmentRunnerResult(BaseModel):
    steps: list[AssessmentRunnerStep] = Field(
        description="The steps of the decision tree runner",
        default=[],
    )
    final_score: int
    misses: int


class AssessmentRunner:
    def __init__(
        self,
        decision_tree: MermaidGraph,
        client_info: list[dict] | str,
        assessment_type: str | None = None,
        task_id=UUID | None,
    ):
        self.task_id = task_id
        self.assessment_tree: MermaidGraph = decision_tree
        self.formatted_client_info = client_info
        self.assessment_type = assessment_type

    async def run_decision_tree(self) -> AssessmentRunnerResult:
        """
        Execute the tree based on the client's situation.

        This method traverses the assessment graph, evaluating each node,
        and determining the flow based on client information and previous answers.

        At each step, it determines whether the step is a question, statement,
        answer, or the end of the traversal, and processes accordingly.
        """
        if not self.assessment_tree:
            raise ValueError("Assessment tree not loaded")

        if not self.formatted_client_info:
            raise ValueError("Client info not loaded")

        tree_gen = self.assessment_tree.traverse(self.assessment_type)
        step = next(tree_gen)

        node_key = None
        score = 0
        unclarities = 0

        result_steps: list[AssessmentRunnerStep] = []

        data = {
            "formatted_client_info": self.formatted_client_info,
        }
        system_prompt = DT_ASSESSMENT_SYSTEM_PROMPT.format(**data)
        self.agent = LLMAgentQA(
            system_prompt=system_prompt,
            thread_id=self.task_id,
        )

        while step is not None:
            # get informations
            node_type = step.__class__.__name__.replace(
                "MermaidGraphTraversal", ""
            ).lower()
            prev_node_key, node_key = node_key, step.node_key
            step_logger = logger.bind(
                node_key=node_key,
                node_type=node_type,
                prev_node_key=prev_node_key,
            )

            # prepare the result
            step_logger.info("Processing step", step=step)
            step_result = AssessmentRunnerStep(
                node_key=node_key, node_value=step.node_value, node_type=node_type
            )
            result_steps.append(step_result)

            if isinstance(step, MermaidGraphTraversalEnd):
                step_logger.info(
                    "End of assessment execution", steps=len(result_steps), score=score
                )
                break

            elif isinstance(step, MermaidGraphTraversalQuestion):
                step_logger.info("Question step", question=step.question)
                step_result.node_attached_question = step.question

                llm_result = await self.ask_decision_tree_question_llm(
                    step.question, step.answers, step_logger
                )

                step_result.annotations = llm_result.annotations
                step = tree_gen.send(llm_result.answer)

            elif isinstance(step, MermaidGraphTraversalCount):
                step_logger.info("Counting step")
                if step.score_modifier == "miss":
                    unclarities += 1
                else:
                    score += step.score_modifier
                step_result.score = step.score_modifier
                step = next(tree_gen)

            else:
                # for any other node, just go to the next step
                step = next(tree_gen)

        return AssessmentRunnerResult(
            steps=result_steps, final_score=score, misses=unclarities
        )

    async def ask_decision_tree_question_llm(
        self, question: str, possible_answers: list[str], step_logger
    ) -> AssessmentAnswer:
        """
        Asks a decision tree question using a language model with retry mechanism.
        If the LLM returns an invalid answer, retries up to 3 times before defaulting to 'unclear'.
        """
        data = {
            "question": question,
            "possible_answers": possible_answers,
        }

        max_retries = 3
        for attempt in range(max_retries):
            try:
                result = await self.agent.call(
                    EXECUTION_PROMPT.format(**data), result_class=AssessmentAnswer
                )

                # Validate that the answer is one of the possible answers (case-insensitive)
                if result.answer.casefold() in [
                    ans.casefold() for ans in possible_answers
                ]:
                    step_logger.info(
                        "Valid answer received",
                        answer=result.answer,
                        attempt=attempt + 1,
                    )
                    return result
                else:
                    step_logger.warning(
                        "Invalid answer received, retrying",
                        invalid_answer=result.answer,
                        expected_answers=possible_answers,
                        attempt=attempt + 1,
                        max_retries=max_retries,
                    )
                    if attempt < max_retries - 1:
                        continue

            except Exception as e:
                step_logger.error(
                    "Error calling LLM, retrying",
                    error=str(e),
                    attempt=attempt + 1,
                    max_retries=max_retries,
                )
                if attempt < max_retries - 1:
                    continue

        # If all retries failed, default to 'unclear' if it's a valid option, otherwise use first option
        default_answer = (
            "unclear"
            if "unclear" in [ans.casefold() for ans in possible_answers]
            else possible_answers[0]
        )
        step_logger.warning(
            "All retries exhausted, using default answer",
            default_answer=default_answer,
            possible_answers=possible_answers,
        )

        return AssessmentAnswer(
            answer=default_answer,
            annotations=[
                Annotation(
                    source="system",
                    source_location="assessment_runner.py",
                    source_text_extract="Default answer used due to LLM retry exhaustion",
                )
            ],
        )


def get_assessments_type(state_code: str) -> List:
    """
    Get all assessment types for a given state code from JSON configuration file.

    Args:
        state_code (str): State code (e.g., "US_ID", "US_AZ")

    Returns:
        List[AssessmentType]: List of assessment types for the state,
                             or [LSIR] as default if not found
    """
    from app.models.assessment import AssessmentType

    # Default assessment type if not found or error
    default_assessment_types = [AssessmentType.LSIR]

    try:
        with open(
            f"{PROJECT_ROOT}/app/core/config/config_by_state.json",
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        state_info = data.get(state_code)

        if state_info and isinstance(state_info, dict):
            assessment_types_list = state_info.get("assessment_types", [])

            if assessment_types_list and len(assessment_types_list) > 0:
                valid_assessments = []

                for assessment_str in assessment_types_list:
                    try:
                        valid_assessments.append(AssessmentType(assessment_str))

                    except ValueError:
                        logger.info(
                            f"Invalid assessment type '{assessment_str}' for state {state_code}"
                        )
                        continue

                # Return valid assessments if any found, otherwise return default
                return (
                    valid_assessments if valid_assessments else default_assessment_types
                )
            else:
                logger.info(f"No assessment_types found for state {state_code}")
                logger.info(
                    f"Returning default assessment types: {default_assessment_types}"
                )
                return default_assessment_types
        else:
            logger.info(f"State {state_code} not found in configuration file")
            logger.info(
                f"Returning default assessment types: {default_assessment_types}"
            )
            return default_assessment_types

    except FileNotFoundError:
        logger.info("Configuration file 'config_by_state.json' not found")
        logger.info(f"Returning default assessment types: {default_assessment_types}")
        return default_assessment_types
    except json.JSONDecodeError as e:
        logger.info(f"Error parsing JSON file: {e}")
        logger.info(f"Returning default assessment types: {default_assessment_types}")
        return default_assessment_types
    except Exception as e:
        logger.info(f"Unexpected error: {e}")
        logger.info(f"Returning default assessment types: {default_assessment_types}")
        return default_assessment_types
