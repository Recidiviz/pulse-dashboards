import logging
import time
import urllib.parse

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


async def deepgram_transcription_diarization(
    audio_file_path: str,
    session_id: str = "",
    diarize: bool = True,
) -> dict:
    """
    Transcribe audio using Deepgram API.

    Args:
        audio_file_path: Path to the audio file
        session_id: Optional session identifier for logging
        diarize: Whether to enable speaker diarization
    """
    url = "https://api.deepgram.com/v1/listen"

    # Base parameters
    params = {
        "model": "nova-3",
        "mip_opt_out": "true",
    }
    if diarize:
        params.update(
            {
                "diarize": "true",
                "punctuate": "true",
                "smart_format": "true",
            }
        )
    else:
        params.update(
            {
                "diarize": "false",
                "punctuate": "false",
                "smart_format": "true",
            }
        )

    headers = {
        "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
        "Content-Type": "audio/webm",
    }

    try:
        logger.info(f"{session_id}: Loading audio file for Deepgram transcription ")
        with open(audio_file_path, "rb") as audio_file:
            audio_data = audio_file.read()

        logger.info(
            f"{session_id}: Sending {len(audio_data)} bytes to Deepgram API "
            f"with {params['model']}"
        )

        full_url = url + "?" + urllib.parse.urlencode(params)
        logger.info(f"{session_id}: Full URL: {full_url}")

        start_time = time.time()
        response = requests.post(
            url,
            params=params,
            headers=headers,
            data=audio_data,
            timeout=30,  # Add timeout for faster failure detection
        )
        end_time = time.time()
        transcription_duration = end_time - start_time
        logger.info(
            f"{session_id}: Deepgram transcription API call took {transcription_duration:.2f} seconds."
        )

        if response.status_code == 200:
            logger.info(f"{session_id}: Deepgram transcription completed successfully")
            result = response.json()
            logger.debug(f"{session_id}: Deepgram API response: {result}")
            return result
        else:
            logger.error(
                f"{session_id}: Deepgram API error {response.status_code}: {response.text}"
            )
            raise Exception(
                f"Deepgram API error {response.status_code}: {response.text}"
            )

    except FileNotFoundError:
        logger.error(f"{session_id}: Audio file '{audio_file_path}' not found")
        raise
    except requests.exceptions.Timeout:
        logger.error(f"{session_id}: Deepgram API request timed out")
        raise Exception("Deepgram API request timed out")
    except Exception as e:
        logger.error(f"{session_id}: Deepgram transcription error: {str(e)}")
        raise
