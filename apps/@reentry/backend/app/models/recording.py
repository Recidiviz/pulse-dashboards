"""
Database models for recording sessions.
"""

import json
from enum import StrEnum
from typing import TYPE_CHECKING, Dict, Optional
from uuid import UUID

from sqlalchemy import BigInteger, Column, UniqueConstraint, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship

from .base import BaseModel
from .execution import Execution
from .intake import Intake

if TYPE_CHECKING:
    from app.utils.transcription.post_processing import TranscriptionOutput


class RecordingStatus(StrEnum):
    CREATED = "created"
    RECORDING = "recording"
    PAUSED = "paused"
    PROCESSING = "processing"
    ERROR = "error"
    COMPLETED = "completed"


class RecordingSession(BaseModel, table=True):
    __tablename__ = "recording_session"

    client_pseudo_id: Optional[str]
    client_id: Optional[str] = None
    intake_id: UUID = Field(
        foreign_key="intake.id",
        nullable=False,
        description="Reference to the related intake",
        ondelete="CASCADE",
    )
    audio_chunks_url: Optional[str] = Field(
        default=None, nullable=True, description="URL to audio chunks storage"
    )
    audio_file_url: Optional[str] = Field(
        default=None, nullable=True, description="URL to final audio file"
    )
    needs_audio_merge: bool = Field(
        default=True,
        description="Flag indicating if audio needs to be merged",
    )
    status: RecordingStatus = Field(
        default=RecordingStatus.CREATED.value,
        sa_column=Column(
            SAEnum(
                RecordingStatus,
                name="recording_status_enum",
                native_enum=True,
                values_callable=lambda obj: [e.value for e in obj],
            ),
            nullable=False,
            default=RecordingStatus.CREATED.value,
        ),
        description="Current status of the recording session",
    )

    gcs_bucket_name: Optional[str] = Field(default=None, nullable=True)
    gcs_chunks_folder: Optional[str] = Field(default=None, nullable=True)
    gcs_final_file_path: Optional[str] = Field(default=None, nullable=True)
    chunk_count: int = Field(default=0)
    last_chunk_timestamp: int = Field(
        ...,
        sa_column=Column(BigInteger, nullable=True),
        description="Unix timestamp in milliseconds of the last received chunk",
    )
    duration: int = Field(
        nullable=True,
        default=0,
        description="Total duration of the recording in milliseconds",
    )

    transcription_approved: bool = Field(
        default=False,
        nullable=False,
        description="Flag indicating if transcription has been approved",
    )

    # Transcription validation fields
    validation_word_count: bool = Field(
        default=True,
        nullable=False,
        sa_column_kwargs={"server_default": text("true")},
        description="Validation result: True if transcript has at least 200 words",
    )
    validation_no_prompt_injection: bool = Field(
        default=True,
        nullable=False,
        sa_column_kwargs={"server_default": text("true")},
        description="Validation result: True if transcript doesn't contain injection patterns",
    )
    validation_diarization: bool = Field(
        default=True,
        nullable=False,
        sa_column_kwargs={"server_default": text("true")},
        description="Validation result: True if at least two speakers are present",
    )
    validation_minimum_duration: bool = Field(
        default=True,
        nullable=False,
        sa_column_kwargs={"server_default": text("true")},
        description="Validation result: True if audio duration is at least 10 minutes",
    )

    deepgram_request_id: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Deepgram async transcription request ID for callback tracking",
    )

    # Relationship back to Intake
    intake: Mapped[Intake] = Relationship(
        back_populates="recording_session",
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    #
    # Execution status and output
    #
    execution_id: UUID | None = Field(
        foreign_key="execution.id",
        nullable=True,
        default=None,
    )
    execution: Mapped[Optional[Execution]] = Relationship(
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "RecordingSession.execution_id",
        }
    )

    def is_valid(self):
        return (
            self.client_pseudo_id
            and self.intake_id
            and self.validation_diarization
            and self.validation_minimum_duration
            and self.validation_no_prompt_injection
            and self.validation_word_count
            and self.audio_file_url
        )

    def validate_recording_session(self) -> tuple[bool, list[str]]:
        """
        Validate recording session transcription quality fields.

        Returns:
            Tuple of (is_valid, error_messages):
            - is_valid: True if all validations pass, False otherwise
            - error_messages: List of validation error messages (empty if valid)
        """
        validation_errors = []

        if not self.validation_word_count:
            validation_errors.append(
                "Transcript does not meet minimum word count requirement (200 words)"
            )

        if not self.validation_no_prompt_injection:
            validation_errors.append(
                "Transcript contains potential prompt injection patterns"
            )

        if not self.validation_diarization:
            validation_errors.append("Transcript does not have at least two speakers")

        if not self.validation_minimum_duration:
            validation_errors.append(
                "Recording does not meet minimum duration requirement (10 minutes)"
            )

        is_valid = len(validation_errors) == 0
        return is_valid, validation_errors

    def validate_transcription(
        self, transcription_output: "TranscriptionOutput"
    ) -> dict[str, bool]:
        """
        Validate transcription output against quality and security criteria.
        Updates the validation fields on the model directly.

        Note: This method modifies the model instance but does not commit changes to the database.
        The caller is responsible for adding the instance to the session and committing.

        Args:
            transcription_output: The processed transcription output

        Returns:
            Dict with four boolean fields:
            - word_count: True if transcript has at least 200 words
            - no_prompt_injection: True if transcript doesn't contain injection patterns
            - diarization: True if at least two speakers are present
            - minimum_duration: True if audio duration is at least 10 minutes
        """
        from app.core.config import settings
        from app.utils.transcription.validation import INJECTION_PATTERNS

        if not settings.DEEPGRAM_CALLBACK:
            validation_results = {
                "word_count": True,
                "no_prompt_injection": True,
                "diarization": True,
                "minimum_duration": True,
            }
        else:
            # 1. Word count validation - minimum 200 words
            total_words = sum(
                turn.wordCount for turn in transcription_output.conversation
            )
            word_count_valid = total_words >= 200

            # 2. Prompt injection detection
            full_transcript = " ".join(
                turn.content for turn in transcription_output.conversation
            )
            has_injection = any(
                pattern.search(full_transcript) for pattern in INJECTION_PATTERNS
            )
            no_prompt_injection = not has_injection

            # 3. Diarization validation - at least two speakers
            unique_speakers = len(transcription_output.metadata.speakers)
            diarization_valid = unique_speakers >= 2

            # 4. Minimum duration validation - at least 10 minutes (600000 milliseconds)
            minimum_duration_ms = 10 * 60 * 1000  # 10 minutes in milliseconds
            duration_valid = (
                self.duration is not None and self.duration >= minimum_duration_ms
            )

            validation_results = {
                "word_count": word_count_valid,
                "no_prompt_injection": no_prompt_injection,
                "diarization": diarization_valid,
                "minimum_duration": duration_valid,
            }

        # Update the validation fields on the model
        self.validation_word_count = validation_results["word_count"]
        self.validation_no_prompt_injection = validation_results["no_prompt_injection"]
        self.validation_diarization = validation_results["diarization"]
        self.validation_minimum_duration = validation_results["minimum_duration"]

        return validation_results

    async def save_transcription_to_gcs(
        self, transcription_data: Dict, is_processed: bool = True
    ) -> None:
        """
        Save transcription data to Google Cloud Storage.
        Saves both valid and invalid transcriptions (validation is handled separately).

        Note: This method saves to GCS but does not commit the model to the database.

        Args:
            transcription_data: Dictionary containing the transcription data to save
            is_processed: If True, saves as processed transcription; if False, saves as raw

        Raises:
            ValueError: If GCS bucket not configured
        """
        if not self.gcs_bucket_name:
            raise ValueError("Cannot save transcription: GCS bucket name not set")

        from app.services.recording_service import RecordingService

        suffix = "_processed" if is_processed else ""
        object_name = f"transcriptions/{self.id}{suffix}.json"

        service = RecordingService(self.gcs_bucket_name)
        try:
            await service.ensure_bucket_exists()
            await service.storage.upload(
                bucket=self.gcs_bucket_name,
                object_name=object_name,
                file_data=json.dumps(transcription_data, indent=2, ensure_ascii=False),
                content_type="application/json",
            )
        finally:
            await service.close()

    async def get_transcription_from_gcs(self, is_processed: bool = True) -> Dict:
        """
        Retrieve transcription data from Google Cloud Storage.
        Retrieves both valid and invalid transcriptions.

        Args:
            is_processed: If True, retrieves processed transcription; if False, retrieves raw

        Returns:
            Dictionary containing the transcription data

        Raises:
            ValueError: If GCS bucket not configured
            FileNotFoundError: If the transcription file doesn't exist in GCS
        """
        if not self.gcs_bucket_name:
            raise ValueError("Cannot retrieve transcription: GCS bucket name not set")

        from app.services.recording_service import RecordingService

        suffix = "_processed" if is_processed else ""
        object_name = f"transcriptions/{self.id}{suffix}.json"

        service = RecordingService(self.gcs_bucket_name)
        try:
            data = await service.storage.download(
                bucket=self.gcs_bucket_name,
                object_name=object_name,
            )
            return json.loads(data)
        except Exception as e:
            if "404" in str(e):
                raise FileNotFoundError(
                    f"Transcription not found in GCS: {object_name}"
                ) from e
            raise
        finally:
            await service.close()


class RecordingChunk(BaseModel, table=True):
    __tablename__ = "recording_chunk"
    __table_args__ = (
        UniqueConstraint("session_id", "timestamp", name="uq_session_timestamp"),
    )

    session_id: UUID = Field(
        ..., foreign_key="recording_session.id", nullable=False, ondelete="CASCADE"
    )
    chunk_index: int = Field(
        ..., nullable=False, description="Index of the audio chunk"
    )
    timestamp: int = Field(
        ...,
        sa_column=Column(BigInteger, nullable=True),
        description="Unix timestamp in milliseconds",
    )
