import base64
import logging
import os
import shutil
import tempfile
from enum import Enum
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from google.cloud import speech_v1 as speech
from google.cloud import texttospeech
from pydantic import BaseModel, Field

from app.core.db import get_session
from app.services.google.stt_tts import MAX_TEXT_LENGTH, text_to_speech
from app.tasks.transcribe_audio_with_deepgram import deepgram_transcription_diarization
from app.utils.address_autocomplete import (
    AutocompleteAddressResponse,
    AutocompleteCityResponse,
)
from app.utils.address_autocomplete import (
    autocomplete_address as autocomplete_address_util,
)
from app.utils.address_autocomplete import (
    autocomplete_city as autocomplete_city_util,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# Google TTS/STT models and enums
class GoogleTTSAudioEncoding(str, Enum):
    MP3 = "MP3"
    OGG_OPUS = "OGG_OPUS"


class GoogleSTTAudioEncoding(str, Enum):
    OGG_OPUS = "OGG_OPUS"
    WEBM_OPUS = "WEBM_OPUS"
    MP3 = "MP3"


class TextToSpeechRequest(BaseModel):
    text: str = Field(
        ...,
        description="Text to convert to speech",
        min_length=1,
        max_length=MAX_TEXT_LENGTH,
    )
    language_code: str = Field(
        default="en-US", description="Language code (e.g., 'en-US')"
    )
    voice_name: str = Field(default="en-US-Standard-C", description="Voice name to use")
    encoding: GoogleTTSAudioEncoding = Field(
        default=GoogleTTSAudioEncoding.MP3, description="Audio encoding format"
    )


class TextToSpeechResponse(BaseModel):
    audio_content: str = Field(..., description="Base64-encoded audio content")
    encoding: GoogleTTSAudioEncoding = Field(
        ..., description="Audio encoding format used"
    )
    language_code: str = Field(
        ..., description="Language code used for speech generation"
    )
    voice_name: str = Field(..., description="Voice name used for speech generation")
    text: str = Field(..., description="Original text that was converted to speech")


class SpeechToTextRequest(BaseModel):
    audio_content: str = Field(..., description="Base64-encoded audio content")
    language_code: str = Field(
        default="en-US", description="Language code (e.g., 'en-US')"
    )
    encoding: GoogleSTTAudioEncoding = Field(..., description="Audio encoding format")
    sample_rate_hertz: int = Field(..., description="Sample rate in Hz")
    audio_channel_count: int = Field(..., description="Number of audio channels")


class SpeechToTextResponse(BaseModel):
    transcribed_text: str


TTS_ENCODING_MAP = {
    GoogleTTSAudioEncoding.MP3: texttospeech.AudioEncoding.MP3,
    GoogleTTSAudioEncoding.OGG_OPUS: texttospeech.AudioEncoding.OGG_OPUS,
}

STT_ENCODING_MAP = {
    GoogleSTTAudioEncoding.OGG_OPUS: speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
    GoogleSTTAudioEncoding.WEBM_OPUS: speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
    GoogleSTTAudioEncoding.MP3: speech.RecognitionConfig.AudioEncoding.MP3,
}

TTS_FILE_EXT_MAP = {
    GoogleTTSAudioEncoding.MP3: ".mp3",
    GoogleTTSAudioEncoding.OGG_OPUS: ".ogg",
}

STT_FILE_EXT_MAP = {
    GoogleSTTAudioEncoding.OGG_OPUS: ".ogg",
    GoogleSTTAudioEncoding.WEBM_OPUS: ".webm",
    GoogleSTTAudioEncoding.MP3: ".mp3",
}


@router.get(
    "/autocomplete-address",
    summary="Autocomplete address suggestions",
    description="Provides address autocomplete suggestions as user types, similar to Uber's address input",
    response_model=AutocompleteAddressResponse,
)
async def autocomplete_address(
    input: str = Query(..., min_length=2),
) -> AutocompleteAddressResponse:
    """
    Autocomplete address suggestions as user types
    Similar to Uber's address input
    """
    return await autocomplete_address_util(input)


@router.get(
    "/autocomplete-city",
    summary="Autocomplete city suggestions",
    description="Provides city autocomplete suggestions for US cities as user types, with optional state filtering",
    response_model=AutocompleteCityResponse,
)
async def autocomplete_city(
    input: str = Query(..., min_length=2),
    state: Optional[str] = Query(
        None,
        description="Optional US state name or abbreviation (e.g., 'California' or 'CA')",
    ),
    address_suggestion_selected: Optional[bool] = Query(
        None,
        description="Optional boolean indicating if an address suggestion was selected",
    ),
) -> AutocompleteCityResponse:
    """
    Autocomplete city suggestions as user types
    Filters for US cities only, with optional state filter
    """
    return await autocomplete_city_util(input, state, address_suggestion_selected)


@router.post(
    "/transcribe",
    summary="Transcribe audio file",
    description="Transcribes an uploaded audio file and returns the conversation",
    tags=["Intake assessment"],
)
async def transcribe_audio_route(
    file: UploadFile = File(...),
    session=Depends(get_session),
):
    # Create a temporary file to save the uploaded audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name
    transcription = ""
    try:
        response_dict = await deepgram_transcription_diarization(
            temp_file_path,
            "api-request",
            diarize=False,
        )
        channels = response_dict.get("results", {}).get("channels", [])
        if channels:
            transcription = channels[0].get("alternatives", [{}])[0].get("transcript")
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
    return {"transcription": transcription}


@router.post(
    "/text-to-speech",
    response_model=TextToSpeechResponse,
    summary="Convert text to speech using Google",
    description="Converts text to speech using Google Cloud Text-to-Speech API and returns base64-encoded audio",
)
async def convert_text_to_speech(request: TextToSpeechRequest):
    temp_path = None
    try:
        file_ext = TTS_FILE_EXT_MAP[request.encoding]

        with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as temp_file:
            temp_path = temp_file.name

        text_to_speech(
            text=request.text,
            abs_output_path=temp_path,
            language_code=request.language_code,
            voice_name=request.voice_name,
            encoding=TTS_ENCODING_MAP[request.encoding],
        )

        # Read the audio file and encode as base64
        with open(temp_path, "rb") as audio_file:
            audio_bytes = audio_file.read()
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        return TextToSpeechResponse(
            audio_content=audio_base64,
            encoding=request.encoding,
            language_code=request.language_code,
            voice_name=request.voice_name,
            text=request.text,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating speech: {str(e)}"
        )
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
