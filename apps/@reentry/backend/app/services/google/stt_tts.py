from pathlib import Path

import google.api_core.exceptions
import structlog
from google.cloud import speech_v1 as speech
from google.cloud import texttospeech

from app.services.google.auth import get_credentials

logger = structlog.get_logger(__name__)

MAX_TEXT_LENGTH = 5000


class GoogleSpeechClients:
    def __init__(self):
        try:
            credentials = get_credentials()
            self.tts_client = texttospeech.TextToSpeechClient(credentials=credentials)
            self.stt_client = speech.SpeechClient(credentials=credentials)
            logger.info("Google Speech clients initialized successfully")

        except google.auth.exceptions.DefaultCredentialsError as e:
            logger.error(
                f"Failed to initialize Google Speech clients - no credentials found: {e}"
            )
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Google Speech clients: {e}")
            raise


# Create single instance at module level
_clients = GoogleSpeechClients()


def text_to_speech(
    text: str,
    abs_output_path: str,
    language_code: str = "en-US",
    voice_name: str = "en-US-Standard-C",  # https://cloud.google.com/text-to-speech/docs/voices
    encoding: texttospeech.AudioEncoding = texttospeech.AudioEncoding.MP3,
) -> None:
    # Input validation
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    if len(text) > MAX_TEXT_LENGTH:
        raise ValueError(
            f"Text exceeds {MAX_TEXT_LENGTH} character limit (got {len(text)} characters)"
        )

    # Google API operations
    try:
        client = _clients.tts_client

        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code, name=voice_name
        )
        audio_config = texttospeech.AudioConfig(audio_encoding=encoding)

        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

    except google.api_core.exceptions.GoogleAPIError as e:
        logger.error(f"Google API error during text-to-speech: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during text-to-speech API call: {e}")
        raise

    # File operations
    try:
        output_path_obj = Path(abs_output_path).resolve()
        output_path_obj.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path_obj, "wb") as out:
            out.write(response.audio_content)

        logger.info(f"Generated speech for text: '{text[:5]}...' -> {output_path_obj}")

    except OSError as e:
        logger.error(f"File system error writing audio file: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error writing audio file: {e}")
        raise
