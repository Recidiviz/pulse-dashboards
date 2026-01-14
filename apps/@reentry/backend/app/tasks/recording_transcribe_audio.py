import asyncio
import json
import queue
import time
from functools import partial

import structlog
from google.cloud import speech_v1 as speech

from app.core.config import settings
from app.core.db import AsyncSession
from app.models.recording import RecordingSession
from app.services.recording_service import RecordingService
from app.tasks.scheduler import Execution
from app.tasks.transcribe_audio_with_deepgram import deepgram_transcription_diarization
from app.utils.config_loader import ConfigLoader
from app.utils.transcription.deepgram_utils import process_deepgram_transcription
from app.utils.transcription.post_processing import (
    GCPTranscriptionInput,
    TranscriptionProcessor,
)


def _blocking_transcribe_with_gcp_progress(
    progress_queue: queue.Queue,
    gcs_uri: str,
    gcs_bucket_name: str,
    gcs_final_file_path: str,
) -> speech.LongRunningRecognizeResponse:
    client = speech.SpeechClient()
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        language_code="en-US",
        use_enhanced=True,
        audio_channel_count=2,
        enable_automatic_punctuation=True,
        enable_word_time_offsets=True,
        diarization_config=speech.SpeakerDiarizationConfig(
            enable_speaker_diarization=True,
            min_speaker_count=2,
            max_speaker_count=3,
        ),
    )
    audio = speech.RecognitionAudio(uri=f"gs://{gcs_bucket_name}/{gcs_final_file_path}")

    operation = client.long_running_recognize(config=config, audio=audio)
    last_progress = 0

    while not operation.done():
        try:
            if hasattr(operation, "metadata") and operation.metadata:
                metadata = operation.metadata
                if hasattr(metadata, "progress_percent"):
                    current_progress = metadata.progress_percent
                    if current_progress > 0 and current_progress != last_progress:
                        progress_queue.put_nowait(current_progress)
                        last_progress = current_progress
        except Exception:
            # Ignore if progress can't be retrieved
            pass
        time.sleep(5)

    progress_queue.put_nowait("DONE")
    return operation.result()


async def transcribe_audio(
    execution: Execution,
    recording_session: RecordingSession,
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
) -> None:
    """
    Transcribes the audio from a recording session.
    For Deepgram in production: initiates async transcription and returns immediately.
    For Deepgram locally or GCP: waits for full transcription result and processes it.
    """

    await execution.log_progress(
        session, 40, "Starting audio transcription.", logger=task_logger
    )
    config = await ConfigLoader.load_assessment_config(
        recording_session.intake.assessment_config_id, session
    )

    try:
        TRANSCRIPTION_SERVICES = {
            "deepgram": _transcribe_audio_with_deepgram,
            "gcp": _transcribe_audio_with_gcp,
        }

        transcribe_func = TRANSCRIPTION_SERVICES[settings.DIARIZATION_SERVICE]

        if settings.DIARIZATION_SERVICE == "deepgram":
            result = await transcribe_func(
                execution, session, recording_session, task_logger
            )

            # Check if result is a request_id (async mode) or full transcription (sync mode)
            if isinstance(result, str):
                # Async mode - request_id returned, webhook will handle processing
                task_logger.info(
                    "Deepgram transcription initiated, will complete via webhook",
                    request_id=result,
                )
                return
            else:
                # Sync mode - full transcription result returned, process it now
                task_logger.info("Processing Deepgram transcription result")
                await process_deepgram_transcription(
                    recording_session=recording_session,
                    transcription_result=result,
                    session=session,
                    task_logger=task_logger,
                )
                await execution.log_progress(
                    session, 90, "Post-processing completed", logger=task_logger
                )
                task_logger.info(
                    "Transcription completed successfully",
                    session_id=recording_session.id,
                )
                return

        # GCP - synchronous mode
        response = await transcribe_func(execution, session, recording_session)

        if not response.results:
            raise ValueError("No transcription results found")

        await execution.log_progress(
            session, 70, "Transcription completed", logger=task_logger
        )

        # Save raw transcription in gcp bucket
        response_dict = json.loads(response.__class__.to_json(response))
        await _save_to_gcs(
            recording_session.gcs_bucket_name,
            f"transcriptions/{recording_session.id}.json",
            response_dict,
        )

        # Post-process transcription
        transcription_input = GCPTranscriptionInput(**response_dict)

        processor = TranscriptionProcessor(
            transcription=transcription_input,
            diarization_service=settings.DIARIZATION_SERVICE,
            model_config=config.intake.transcription_post_processing_model,
        )
        transcription_result = await processor.convert_transcript_to_conversation()
        await execution.log_progress(
            session, 90, "Post-processing completed", logger=task_logger
        )

        # Save processed transcription
        await _save_to_gcs(
            recording_session.gcs_bucket_name,
            f"transcriptions/{recording_session.id}_processed.json",
            transcription_result.dict(),
        )

        task_logger.info(
            "Transcription completed successfully", session_id=recording_session.id
        )

    except Exception as e:
        task_logger.error("Transcription failed", error=e)
        raise


async def _transcribe_audio_with_gcp(
    execution: Execution,
    session: AsyncSession,
    recording_session: RecordingSession,
) -> speech.LongRunningRecognizeResponse:
    """
    Transcribe audio using Google Speech-to-Text API with progress reporting.
    """
    progress_queue = queue.Queue()
    loop = asyncio.get_event_loop()

    blocking_task = partial(
        _blocking_transcribe_with_gcp_progress,
        progress_queue,
        gcs_uri=f"gs://{recording_session.gcs_bucket_name}/{recording_session.gcs_final_file_path}",
        gcs_bucket_name=recording_session.gcs_bucket_name,
        gcs_final_file_path=recording_session.gcs_final_file_path,
    )

    task = loop.run_in_executor(None, blocking_task)

    while not task.done():
        try:
            progress = progress_queue.get_nowait()
            if progress == "DONE":
                break
            # Scale progress to be between 40 and 70
            scaled_progress = 40 + (int(progress) * (70 - 40) / 100)
            await execution.log_progress(
                session, int(scaled_progress), f"Transcription is {progress}% complete."
            )
        except queue.Empty:
            pass
        await asyncio.sleep(0.1)

    return await task


async def _transcribe_audio_with_deepgram(
    execution: Execution,
    session: AsyncSession,
    recording_session: RecordingSession,
    task_logger: structlog.BoundLogger,
) -> str | dict:
    """
    Transcribe audio with Deepgram.

    In production (non-local): Initiates async transcription with callback and returns request_id.
    In local environment: Performs synchronous transcription and returns full result.

    Returns:
        str: Deepgram request_id for async transcription (production)
        dict: Full transcription result for sync transcription (local)
    """

    session_id = str(recording_session.id)
    needs_callback_url = settings.DEEPGRAM_CALLBACK

    if needs_callback_url:
        task_logger.info("Initiating async Deepgram transcription (production mode)")
    else:
        task_logger.info("Starting synchronous Deepgram transcription (local mode)")

    await execution.log_progress(
        session,
        45,
        "Starting Deepgram transcription",
    )

    if not settings.DEEPGRAM_API_KEY:
        task_logger.error("DEEPGRAM_API_KEY not configured")
        raise ValueError("DEEPGRAM_API_KEY not configured")

    try:
        task_logger.info("Generating signed URL for audio file in GCS")

        async with RecordingService(settings.GCS_BUCKET_NAME) as recording_service:
            # Generate signed URL with appropriate expiration time
            expiration_minutes = 12 if not needs_callback_url else 60
            signed_url = await recording_service.generate_signed_url(
                file_path=recording_session.gcs_final_file_path,
                expiration_minutes=expiration_minutes,
            )

        task_logger.info("Signed URL generated for Deepgram")

        await execution.log_progress(
            session,
            50,
            "Signed URL generated, sending to Deepgram",
        )

        # Determine whether to use callback URL (async) or not (sync)
        callback_url = None
        if needs_callback_url:
            callback_url = f"{settings.BASE_URL}/webhooks/deepgram/transcription"
            task_logger.info(
                "Using callback URL for async processing", callback_url=callback_url
            )

        task_logger.info("Calling Deepgram transcription service")
        deepgram_result = await deepgram_transcription_diarization(
            session_id=session_id,
            audio_url=signed_url,
            callback_url=callback_url,
        )

        if needs_callback_url:
            # Async mode - we got a request_id
            request_id = deepgram_result
            task_logger.info(
                "Deepgram async transcription initiated", request_id=request_id
            )

            # Store the request_id in the recording session
            recording_session.deepgram_request_id = request_id
            session.add(recording_session)
            await session.commit()

            await execution.log_progress(
                session,
                55,
                "Deepgram transcription initiated, waiting for callback",
            )

            task_logger.info(
                "Request ID stored, transcription will be processed via webhook",
                request_id=request_id,
            )

            return request_id
        else:
            # Synchronous mode - we got the full transcription result
            task_logger.info("Deepgram transcription completed")

            await execution.log_progress(
                session,
                65,
                "Deepgram transcription completed",
            )

            task_logger.info("Deepgram response processed successfully")
            return deepgram_result

    except Exception as e:
        task_logger.error("Deepgram transcription failed", error=str(e))
        raise


async def _save_to_gcs(bucket_name: str, object_name: str, data: dict) -> None:
    """Wrapper for the GCS save utility function."""
    from app.utils.transcription.deepgram_utils import save_to_gcs

    await save_to_gcs(bucket_name, object_name, data)
