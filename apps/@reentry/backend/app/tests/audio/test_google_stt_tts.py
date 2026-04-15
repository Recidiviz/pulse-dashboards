import os
import tempfile

import pytest

from app.services.google.stt_tts import MAX_TEXT_LENGTH, text_to_speech


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
