import base64
import tempfile
from enum import Enum
from pathlib import Path

from fastapi import APIRouter, HTTPException
from google.cloud import speech_v1 as speech
from google.cloud import texttospeech
from pydantic import BaseModel, Field

from app.services.google.stt_tts import MAX_TEXT_LENGTH, speech_to_text, text_to_speech

router = APIRouter()


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


@router.post(
    "/speech-to-text",
    response_model=SpeechToTextResponse,
    summary="Convert speech to text using Google",
    description="Transcribes base64-encoded audio using Google Cloud Speech-to-Text API",
)
async def convert_speech_to_text(request: SpeechToTextRequest):
    temp_path = None
    try:
        try:
            audio_bytes = base64.b64decode(request.audio_content)
        except Exception as e:
            raise ValueError(f"Invalid base64 audio content: {str(e)}")

        # Get file extension for the encoding
        file_ext = STT_FILE_EXT_MAP[request.encoding]

        # Write to temp file for speech_to_text function
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name

        transcribed_text = speech_to_text(
            audio_file_abs_path=temp_path,
            language_code=request.language_code,
            encoding=STT_ENCODING_MAP[request.encoding],
            sample_rate_hertz=request.sample_rate_hertz,
            audio_channel_count=request.audio_channel_count,
        )

        return SpeechToTextResponse(transcribed_text=transcribed_text)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error transcribing audio: {str(e)}"
        )
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
