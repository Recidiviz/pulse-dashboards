import os
from io import BytesIO
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.integration
@pytest.mark.asyncio
async def test_transcribe_audio_success(client: AsyncClient):
    """Test successful audio transcription using a real audio file"""
    audio_file_relative_path = "data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    assert os.path.exists(
        audio_file_abs_path
    ), "Test audio file test-audio-libopus-webm.webm doesn't exist"

    # Read the audio file
    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    # Upload the file to the transcribe endpoint
    files = {"file": ("test-audio.webm", BytesIO(audio_content), "audio/webm")}

    # Mock Deepgram API to avoid real API calls
    mock_response = {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {"transcript": "This is a successful test transcription"}
                    ]
                }
            ]
        }
    }

    with patch(
        "app.routes.plan_router.deepgram_transcription_diarization",
        new_callable=AsyncMock,
    ) as mock_transcribe:
        mock_transcribe.return_value = mock_response

        response = await client.post("/transcribe", files=files)

        assert response.status_code == 200
        result = response.json()
        assert "transcription" in result
        # The test audio file contains "testing" or similar
        assert isinstance(result["transcription"], str)
        assert len(result["transcription"]) > 0
        assert result["transcription"] == "This is a successful test transcription"
        # Verify the mock was called
        mock_transcribe.assert_called_once()


@pytest.mark.asyncio
async def test_transcribe_audio_no_file(client: AsyncClient):
    """Test transcription endpoint without providing a file"""
    response = await client.post("/transcribe")

    assert response.status_code == 422  # Unprocessable Entity
    assert "field required" in response.text.lower()


@pytest.mark.asyncio
async def test_transcribe_audio_empty_file(client: AsyncClient):
    """Test transcription with an empty audio file"""
    # Create empty file
    files = {"file": ("empty.webm", BytesIO(b""), "audio/webm")}

    with patch(
        "app.routes.plan_router.deepgram_transcription_diarization",
        new_callable=AsyncMock,
    ) as mock_transcribe:
        # Mock the deepgram API to return an error or empty result
        mock_transcribe.side_effect = Exception("Invalid audio content")

        response = await client.post("/transcribe", files=files)

        assert response.status_code == 500
        result = response.json()
        assert "detail" in result
        assert "Invalid audio content" in result["detail"]


@pytest.mark.asyncio
async def test_transcribe_audio_deepgram_error(client: AsyncClient):
    """Test transcription when Deepgram API fails"""
    audio_file_relative_path = "data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    files = {"file": ("test-audio.webm", BytesIO(audio_content), "audio/webm")}

    with patch(
        "app.routes.plan_router.deepgram_transcription_diarization",
        new_callable=AsyncMock,
    ) as mock_transcribe:
        mock_transcribe.side_effect = Exception("Deepgram API error")

        response = await client.post("/transcribe", files=files)

        assert response.status_code == 500
        result = response.json()
        assert "detail" in result
        assert "Deepgram API error" in result["detail"]


@pytest.mark.asyncio
async def test_transcribe_audio_mocked_success(client: AsyncClient):
    """Test transcription with mocked Deepgram response"""
    audio_file_relative_path = "data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    files = {"file": ("test-audio.webm", BytesIO(audio_content), "audio/webm")}

    # Mock Deepgram response
    mock_response = {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {"transcript": "This is a test transcription from Deepgram"}
                    ]
                }
            ]
        }
    }

    with patch(
        "app.routes.plan_router.deepgram_transcription_diarization",
        new_callable=AsyncMock,
    ) as mock_transcribe:
        mock_transcribe.return_value = mock_response

        response = await client.post("/transcribe", files=files)

        assert response.status_code == 200
        result = response.json()
        assert "transcription" in result
        assert result["transcription"] == "This is a test transcription from Deepgram"
        # Verify the mock was called with correct parameters
        mock_transcribe.assert_called_once()
        call_args = mock_transcribe.call_args
        assert call_args[1]["diarize"] is False


@pytest.mark.asyncio
async def test_transcribe_audio_missing_transcript_in_response(client: AsyncClient):
    """Test transcription when Deepgram response is missing transcript"""
    audio_file_relative_path = "data/audio/test-audio-libopus-webm.webm"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    files = {"file": ("test-audio.webm", BytesIO(audio_content), "audio/webm")}

    # Mock Deepgram response with missing transcript
    mock_response = {"results": {"channels": []}}

    with patch(
        "app.routes.plan_router.deepgram_transcription_diarization",
        new_callable=AsyncMock,
    ) as mock_transcribe:
        mock_transcribe.return_value = mock_response

        response = await client.post("/transcribe", files=files)

        assert response.status_code == 200
        result = response.json()
        assert "transcription" in result
        # Should return None or empty when transcript is missing
        assert result["transcription"] is None or result["transcription"] == ""


@pytest.mark.asyncio
async def test_transcribe_audio_different_file_type(client: AsyncClient):
    """Test transcription with a different audio file type"""
    audio_file_relative_path = "data/audio/conversion/sample-1.mp3"
    audio_file_abs_path = str(
        (Path(__file__).parent / audio_file_relative_path).resolve()
    )

    if not os.path.exists(audio_file_abs_path):
        pytest.skip(f"Test audio file {audio_file_abs_path} doesn't exist")

    with open(audio_file_abs_path, "rb") as audio_file:
        audio_content = audio_file.read()

    files = {"file": ("test-audio.mp3", BytesIO(audio_content), "audio/mp3")}

    # Mock Deepgram to handle different file type
    mock_response = {
        "results": {
            "channels": [
                {"alternatives": [{"transcript": "MP3 transcription successful"}]}
            ]
        }
    }

    with patch(
        "app.routes.plan_router.deepgram_transcription_diarization",
        new_callable=AsyncMock,
    ) as mock_transcribe:
        mock_transcribe.return_value = mock_response

        response = await client.post("/transcribe", files=files)

        assert response.status_code == 200
        result = response.json()
        assert "transcription" in result
        assert result["transcription"] == "MP3 transcription successful"
