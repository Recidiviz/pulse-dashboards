"""
Utility functions for Deepgram transcription processing.
"""

import json

import structlog
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.db import AsyncSession
from app.models.intake import Intake
from app.models.recording import RecordingSession
from app.services.recording_service import RecordingService
from app.utils.config_loader import ConfigLoader
from app.utils.transcription.post_processing import (
    DeepgramTranscriptionInput,
    TranscriptionProcessor,
)


async def save_to_gcs(bucket_name: str, object_name: str, data: dict) -> None:
    """Helper function to save data to Google Cloud Storage."""
    service = RecordingService(bucket_name)
    try:
        await service.ensure_bucket_exists()
        await service.storage.upload(
            bucket=bucket_name,
            object_name=object_name,
            file_data=json.dumps(data, indent=2, ensure_ascii=False),
            content_type="application/json",
        )
    finally:
        await service.close()


async def process_deepgram_transcription(
    recording_session: RecordingSession,
    transcription_result: dict,
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
) -> dict:
    """
    Process Deepgram transcription results and save to GCS.

    This function handles the common processing logic for both synchronous
    and asynchronous (callback-based) Deepgram transcriptions.

    Args:
        recording_session: The recording session being processed
        transcription_result: The raw transcription result from Deepgram
        session: Database session
        task_logger: Logger instance

    Returns:
        dict: The processed transcription result

    Raises:
        ValueError: If transcription results are invalid or config is missing
    """
    task_logger.info("Processing Deepgram transcription result")

    # Validate transcription results
    channels = transcription_result.get("results", {}).get("channels", [])
    if not channels:
        raise ValueError("No transcription results found")

    # Save raw transcription in GCS bucket
    task_logger.info("Saving raw Deepgram response to GCS")
    await save_to_gcs(
        recording_session.gcs_bucket_name,
        f"transcriptions/{recording_session.id}_deepgram_raw.json",
        transcription_result,
    )
    task_logger.info("Raw Deepgram response saved to GCS")

    # Load assessment config
    try:
        statement = (
            select(Intake)
            .where(Intake.id == recording_session.intake_id)
            .options(selectinload(Intake.address))
        )
        result = await session.exec(statement)
        intake = result.first()
        print(intake, "intake")
        if not intake:
            raise ValueError(
                f"Intake not found for recording session {recording_session.id}"
            )

        if not intake.assessment_config:
            raise ValueError(f"Assessment config not found for intake {intake.id}")

        assessment_config = await ConfigLoader.load_assessment_config(
            intake.assessment_config_id, session
        )
    except Exception as e:
        task_logger.error("Failed to load intake or assessment config", error=str(e))
        raise

    # Post-process transcription
    task_logger.info("Starting post-processing of transcription")
    transcription_input = DeepgramTranscriptionInput(**transcription_result)
    processor = TranscriptionProcessor(
        transcription=transcription_input,
        diarization_service="deepgram",
        model_config=assessment_config.intake.transcription_post_processing_model,
    )
    transcription_result_processed = (
        await processor.convert_transcript_to_conversation()
    )

    # Save processed transcription
    task_logger.info("Saving processed transcription to GCS")
    await save_to_gcs(
        recording_session.gcs_bucket_name,
        f"transcriptions/{recording_session.id}_processed.json",
        transcription_result_processed.dict(),
    )
    task_logger.info("Processed transcription saved to GCS")

    task_logger.info("Deepgram transcription processing completed successfully")

    return transcription_result_processed.dict()
