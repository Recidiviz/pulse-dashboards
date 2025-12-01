import os
import tempfile
from pathlib import Path

import pytest
from google.cloud import speech_v1 as speech
from google.cloud import texttospeech

from app.services.google.stt_tts import MAX_TEXT_LENGTH, speech_to_text, text_to_speech


@pytest.mark.integration
def test_text_to_speech_to_text():
    original_text = "testing"

    # Create temporary file for audio output
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
        temp_audio_path = temp_audio.name

    try:
        text_to_speech(
            text=original_text,
            abs_output_path=temp_audio_path,
            voice_name="en-US-Standard-C",
            encoding=texttospeech.AudioEncoding.MP3,
        )

        # Verify the audio file was created
        assert os.path.exists(temp_audio_path), "Audio file was not created"
        assert os.path.getsize(temp_audio_path) > 0, "Audio file is empty"

        transcribed_text = speech_to_text(
            audio_file_abs_path=temp_audio_path,
            sample_rate_hertz=48000,
            audio_channel_count=2,
            encoding=speech.RecognitionConfig.AudioEncoding.MP3,
        )

        assert (
            transcribed_text.strip().lower() == original_text.lower()
        ), f"Transcribed text '{transcribed_text}' does not match original '{original_text}'"

    finally:
        if os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)


def test_text_to_speech_invalid_input():
    """Test that invalid text input raises ValueError"""
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
        temp_audio_path = temp_audio.name

    try:
        # Empty text
        with pytest.raises(ValueError, match="Text cannot be empty"):
            text_to_speech(text="", abs_output_path=temp_audio_path)

        # Whitespace only
        with pytest.raises(ValueError, match="Text cannot be empty"):
            text_to_speech(text="   ", abs_output_path=temp_audio_path)

        # Text too long
        long_text = "a" * (MAX_TEXT_LENGTH + 1)
        with pytest.raises(
            ValueError, match=f"Text exceeds {MAX_TEXT_LENGTH} character limit"
        ):
            text_to_speech(text=long_text, abs_output_path=temp_audio_path)
    finally:
        if os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)


def test_invalid_paths():
    """Test that invalid file paths raise appropriate errors"""
    invalid_path = "/invalid/nonexistent/path/output.mp3"

    # TTS with invalid output path
    with pytest.raises(OSError):
        text_to_speech(text="testing", abs_output_path=invalid_path)

    # STT with invalid input path
    with pytest.raises(FileNotFoundError, match="Audio file not found"):
        speech_to_text(
            audio_file_abs_path=invalid_path,
            sample_rate_hertz=24000,
            audio_channel_count=1,
            encoding=speech.RecognitionConfig.AudioEncoding.MP3,
        )

    # STT with empty path
    with pytest.raises(ValueError, match="Audio file path cannot be empty"):
        speech_to_text(
            audio_file_abs_path="",
            sample_rate_hertz=24000,
            audio_channel_count=1,
            encoding=speech.RecognitionConfig.AudioEncoding.MP3,
        )

    with pytest.raises(ValueError, match="Audio file path cannot be empty"):
        speech_to_text(
            audio_file_abs_path="   ",
            sample_rate_hertz=24000,
            audio_channel_count=1,
            encoding=speech.RecognitionConfig.AudioEncoding.MP3,
        )


@pytest.mark.integration
def test_speech_to_text_invalid_audio_content():
    """Test that invalid audio content raises ValueError for no transcription results"""
    # Create a file with invalid audio content (just text, not actual audio)
    with tempfile.NamedTemporaryFile(
        suffix=".mp3", delete=False, mode="wb"
    ) as temp_audio:
        temp_audio.write(b"This is not valid audio content")
        temp_audio_path = temp_audio.name

    try:
        with pytest.raises(ValueError, match="No transcription results found"):
            speech_to_text(
                audio_file_abs_path=temp_audio_path,
                sample_rate_hertz=24000,
                audio_channel_count=1,
                encoding=speech.RecognitionConfig.AudioEncoding.MP3,
            )
    finally:
        if os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)


def test_speech_to_text_libopus_webm():
    expected_text = "Testing"
    audio_file_relative_path = "../../tests/data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    assert os.path.exists(
        audio_file_abs_path
    ), "Test audio file with libopus-webm doesn't exist"

    transcribed_text = speech_to_text(
        audio_file_abs_path=audio_file_abs_path,
        language_code="en-US",
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sample_rate_hertz=48000,
        audio_channel_count=1,
    )

    assert (
        transcribed_text.strip().lower() == expected_text.lower()
    ), f"Transcribed text '{transcribed_text}' does not match original '{expected_text}'"
