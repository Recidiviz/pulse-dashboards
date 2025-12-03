import logging
import time

import httpx
from deepgram import DeepgramClient

from app.core.config import settings

logger = logging.getLogger(__name__)


async def deepgram_transcription_diarization(
    audio_file_path: str | None = None,
    session_id: str = "",
    audio_url: str | None = None,
    diarize: bool = True,
) -> dict:
    """
    Transcribe audio using Deepgram API (SDK v5.0.0+).

    Args:
        audio_file_path: Path to the audio file (optional if audio_url is provided)
        session_id: Optional session identifier for logging
        audio_url: URL to audio file for URL-based transcription (optional)
        diarize: Whether to enable speaker diarization

    Returns:
        dict: A JSON-serializable dictionary containing the transcription results
    """
    # Create httpx client with longer timeout (1200 seconds = 20 minutes for 2-hour audio)
    httpx_client = httpx.Client(timeout=1200.0)

    # Initialize Deepgram client with custom httpx client
    client = DeepgramClient(
        api_key=settings.DEEPGRAM_API_KEY, httpx_client=httpx_client
    )

    def convert_to_dict(response):
        """Convert Pydantic model to dict for JSON serialization"""
        if hasattr(response, "model_dump"):
            # Pydantic v2 - use mode='json' to serialize datetimes
            return response.model_dump(mode="json")
        elif hasattr(response, "dict"):
            # Pydantic v1
            return response.dict()
        elif hasattr(response, "to_dict"):
            return response.to_dict()
        elif hasattr(response, "__dict__"):
            return response.__dict__
        else:
            return response

    # Use URL-based transcription if audio_url is provided, otherwise use file upload
    if audio_url:
        try:
            logger.info(f"{session_id}: Using signed URL for Deepgram transcription")

            start_time = time.time()

            # For v5.0.0+, use client.listen.v1.media.transcribe_url()
            response = client.listen.v1.media.transcribe_url(
                url=audio_url,
                model="nova-3",
                diarize=diarize,
                punctuate=diarize,
                smart_format=True,
            )

            end_time = time.time()
            transcription_duration = end_time - start_time
            logger.info(
                f"{session_id}: Deepgram transcription API call took {transcription_duration:.2f} seconds."
            )

            logger.info(f"{session_id}: Deepgram transcription completed successfully")

            # Convert to dict for JSON serialization
            result = convert_to_dict(response)

            logger.debug(f"{session_id}: Deepgram API response type: {type(result)}")

            httpx_client.close()

            return result

        except Exception as e:
            logger.error(f"{session_id}: Deepgram transcription error: {str(e)}")
            httpx_client.close()
            raise
    else:
        # File upload logic
        if not audio_file_path:
            raise ValueError("Either audio_file_path or audio_url must be provided")

        try:
            logger.info(f"{session_id}: Loading audio file for Deepgram transcription")
            with open(audio_file_path, "rb") as audio_file:
                buffer_data = audio_file.read()

            logger.info(
                f"{session_id}: Sending {len(buffer_data)} bytes to Deepgram API "
                f"with nova-3 model"
            )

            start_time = time.time()

            # For v5.0.0+, use client.listen.v1.media.transcribe_file() with request parameter
            response = client.listen.v1.media.transcribe_file(
                request=buffer_data,
                model="nova-3",
                diarize=diarize,
                punctuate=diarize,
                smart_format=True,
            )

            end_time = time.time()
            transcription_duration = end_time - start_time
            logger.info(
                f"{session_id}: Deepgram transcription API call took {transcription_duration:.2f} seconds."
            )

            logger.info(f"{session_id}: Deepgram transcription completed successfully")

            # Convert to dict for JSON serialization
            result = convert_to_dict(response)

            logger.debug(f"{session_id}: Deepgram API response type: {type(result)}")

            httpx_client.close()

            return result

        except FileNotFoundError:
            logger.error(f"{session_id}: Audio file '{audio_file_path}' not found")
            httpx_client.close()
            raise
        except Exception as e:
            logger.error(f"{session_id}: Deepgram transcription error: {str(e)}")
            httpx_client.close()
            raise
