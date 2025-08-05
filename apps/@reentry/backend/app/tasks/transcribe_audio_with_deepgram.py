import logging
import urllib.parse

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


async def deepgram_transcription_diarization(
    audio_file_path: str, session_id: str = ""
) -> dict:
    url = "https://api.deepgram.com/v1/listen"

    params = {
        "diarize": "true",
        "mip_opt_out": "true",
        "model": "nova-3",
        "punctuate": "true",
        "smart_format": "true",
    }

    headers = {
        "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
        "Content-Type": "audio/webm",
    }

    try:
        logger.info(f"{session_id}: Loading audio file for Deepgram transcription")
        with open(audio_file_path, "rb") as audio_file:
            audio_data = audio_file.read()

        logger.info(f"{session_id}: Sending {len(audio_data)} bytes to Deepgram API")

        full_url = url + "?" + urllib.parse.urlencode(params)
        logger.info(f"{session_id}: Full URL: {full_url}")

        response = requests.post(url, params=params, headers=headers, data=audio_data)

        if response.status_code == 200:
            logger.info(f"{session_id}: Deepgram transcription completed successfully")
            result = response.json()
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
    except Exception as e:
        logger.error(f"{session_id}: Deepgram transcription error: {str(e)}")
        raise
