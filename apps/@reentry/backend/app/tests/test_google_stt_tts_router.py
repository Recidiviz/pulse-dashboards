import base64
from pathlib import Path

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_text_to_speech_invalid_encoding(client: AsyncClient):
    response = await client.post(
        "/google/text-to-speech",
        json={
            "text": "Hello world",
            "encoding": "INVALID_FORMAT",
        },
    )

    assert response.status_code == 422
    assert "input should be" in response.text.lower()


@pytest.mark.asyncio
async def test_speech_to_text_invalid_encoding(client: AsyncClient):
    fake_audio_content = b"fake audio content"
    audio_base64 = base64.b64encode(fake_audio_content).decode("utf-8")

    response = await client.post(
        "/google/speech-to-text",
        json={
            "audio_content": audio_base64,
            "language_code": "en-US",
            "encoding": "INVALID_ENCONDING_TYPE",
            "sample_rate_hertz": 24000,
            "audio_channel_count": 1,
        },
    )

    assert response.status_code == 422
    assert "input should be" in response.text.lower()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_speech_to_text_webm_opus(client: AsyncClient):
    expected_text = "testing"
    audio_file_relative_path = "data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    # Read audio file and encode as base64
    with open(audio_file_abs_path, "rb") as audio_file:
        audio_bytes = audio_file.read()
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

    response = await client.post(
        "/google/speech-to-text",
        json={
            "audio_content": audio_base64,
            "language_code": "en-US",
            "encoding": "WEBM_OPUS",
            "sample_rate_hertz": 48000,
            "audio_channel_count": 1,
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert "transcribed_text" in result
    assert result["transcribed_text"].strip().lower() == expected_text


@pytest.mark.integration
@pytest.mark.asyncio
async def test_text_to_speech_to_text_routers(client: AsyncClient):
    reference_text = "This is an expression"
    sample_rate_for_mp3 = 24000
    audio_channel_count = 1

    # Step 1: Convert text to speech
    tts_response = await client.post(
        "/google/text-to-speech",
        json={
            "text": reference_text,
            "language_code": "en-US",
            "voice_name": "en-US-Standard-C",
            "encoding": "MP3",
        },
    )

    assert tts_response.status_code == 200
    tts_result = tts_response.json()
    assert "audio_content" in tts_result
    assert "encoding" in tts_result
    assert tts_result["encoding"] == "MP3"
    audio_base64 = tts_result["audio_content"]

    # Step 2: Convert speech back to text
    stt_response = await client.post(
        "/google/speech-to-text",
        json={
            "audio_content": audio_base64,
            "language_code": "en-US",
            "encoding": "MP3",
            "sample_rate_hertz": sample_rate_for_mp3,
            "audio_channel_count": audio_channel_count,
        },
    )

    assert stt_response.status_code == 200
    stt_result = stt_response.json()
    assert "transcribed_text" in stt_result

    transcribed_text = stt_result["transcribed_text"].strip().lower()
    assert transcribed_text == reference_text.lower()
