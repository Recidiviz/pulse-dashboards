from pathlib import Path
from typing import Literal

import structlog
from pydantic import BaseModel, Field

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
