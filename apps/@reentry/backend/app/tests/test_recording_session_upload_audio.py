"""
Tests for the upload-audio endpoint in recording_session_router.
"""

import io
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.core.config import settings
from app.core.db import AsyncSession
from app.models.base import IntakeType
from app.models.execution import Execution, ExecutionStatus
from app.models.intake import IntakeStatus
from app.models.recording import RecordingSession, RecordingStatus
from app.utils import permission_utils


@pytest.mark.asyncio
async def test_upload_audio_success(
    async_session: AsyncSession,
    client,
    mock_clientdata_service,
    mock_intake,
    monkeypatch,
):
    """Test successful upload of an audio file."""

    # Mock check_access to allow access
    def mock_check_access(
        client_pseudo_id, pseudonymized_staff_id, cpa_client_locations=None
    ):
        return mock_clientdata_service["clients_by_pseudo_id"].get(
            client_pseudo_id, mock_clientdata_service["clients"][0]
        )

    monkeypatch.setattr(permission_utils, "check_access", mock_check_access)

    # Setup: Create a transcription intake with a recording session
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.intake_type = IntakeType.TRANSCRIPTION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create a recording session
    recording_session = RecordingSession(
        client_pseudo_id=client_pseudo_id,
        intake_id=mock_intake.id,
        status=RecordingStatus.CREATED,
        gcs_bucket_name="test-bucket",
        gcs_chunks_folder=f"recordings/{uuid4()}/chunks",
    )
    async_session.add(recording_session)
    await async_session.commit()
    await async_session.refresh(recording_session)

    # Mock RecordingService and schedule_task
    mock_execution_id = uuid4()
    mock_gcs_path = f"recordings/{recording_session.id}/final/uploaded_audio.webm"

    # Create a real Execution object in the database for the foreign key constraint
    mock_execution = Execution(
        id=mock_execution_id,
        status=ExecutionStatus.PENDING,
        table_name="recording_session",
        table_entity_id=recording_session.id,
    )
    async_session.add(mock_execution)
    await async_session.commit()

    with (
        patch(
            "app.routes.recording_session_router.RecordingService"
        ) as mock_recording_service_class,
        patch(
            "app.routes.recording_session_router.schedule_task"
        ) as mock_schedule_task,
    ):
        # Mock the RecordingService context manager
        mock_service_instance = AsyncMock()
        mock_service_instance.upload_full_audio_file = AsyncMock(
            return_value=mock_gcs_path
        )
        mock_recording_service_class.return_value.__aenter__ = AsyncMock(
            return_value=mock_service_instance
        )
        mock_recording_service_class.return_value.__aexit__ = AsyncMock(
            return_value=None
        )

        # Mock schedule_task to return the execution we created
        mock_schedule_task.return_value = mock_execution

        # Create a test audio file
        audio_content = b"fake audio content for testing"
        audio_file = io.BytesIO(audio_content)
        files = {
            "file": ("test_audio.webm", audio_file, "audio/webm"),
        }

        # Make the request
        response = await client.post(
            f"/recordings/sessions/{recording_session.id}/upload-audio",
            files=files,
        )

        # Assert response
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["gcs_file_path"] == mock_gcs_path
        assert data["execution_id"] == str(mock_execution_id)
        assert (
            data["message"] == "Audio file uploaded successfully and processing started"
        )

        # Verify RecordingService was called correctly
        mock_service_instance.upload_full_audio_file.assert_called_once()
        call_args = mock_service_instance.upload_full_audio_file.call_args
        assert call_args[0][0] == str(recording_session.id)
        assert call_args[0][1] == audio_content
        assert call_args[0][2] == "test_audio.webm"
        assert call_args[0][3] == "audio/webm"

        # Verify schedule_task was called
        mock_schedule_task.assert_called_once()

    # Verify database was updated
    await async_session.refresh(recording_session)
    assert recording_session.gcs_final_file_path == mock_gcs_path
    assert (
        recording_session.audio_file_url
        == f"gs://{settings.GCS_BUCKET_NAME}/{mock_gcs_path}"
    )
    assert recording_session.needs_audio_merge is False
    assert recording_session.status == RecordingStatus.PROCESSING
    assert recording_session.execution_id == mock_execution_id


@pytest.mark.asyncio
async def test_upload_audio_recording_session_not_found(
    async_session: AsyncSession,
    client,
):
    """Test upload-audio with a non-existent recording session."""
    fake_session_id = uuid4()

    # Create a test audio file
    audio_file = io.BytesIO(b"fake audio content")
    files = {
        "file": ("test_audio.webm", audio_file, "audio/webm"),
    }

    response = await client.post(
        f"/recordings/sessions/{fake_session_id}/upload-audio",
        files=files,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Recording session not found"


@pytest.mark.asyncio
async def test_upload_audio_invalid_file_type(
    async_session: AsyncSession,
    client,
    mock_clientdata_service,
    mock_intake,
    monkeypatch,
):
    """Test upload-audio with a non-audio file type."""

    # Mock check_access to allow access
    def mock_check_access(
        client_pseudo_id, pseudonymized_staff_id, cpa_client_locations=None
    ):
        return mock_clientdata_service["clients_by_pseudo_id"].get(
            client_pseudo_id, mock_clientdata_service["clients"][0]
        )

    monkeypatch.setattr(permission_utils, "check_access", mock_check_access)

    # Setup: Create a transcription intake with a recording session
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.intake_type = IntakeType.TRANSCRIPTION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    await async_session.commit()
    await async_session.refresh(mock_intake)

    recording_session = RecordingSession(
        client_pseudo_id=client_pseudo_id,
        intake_id=mock_intake.id,
        status=RecordingStatus.CREATED,
    )
    async_session.add(recording_session)
    await async_session.commit()
    await async_session.refresh(recording_session)

    # Create a test file with wrong content type
    text_file = io.BytesIO(b"not an audio file")
    files = {
        "file": ("test.txt", text_file, "text/plain"),
    }

    response = await client.post(
        f"/recordings/sessions/{recording_session.id}/upload-audio",
        files=files,
    )

    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_audio_no_content_type(
    async_session: AsyncSession,
    client,
    mock_clientdata_service,
    mock_intake,
    monkeypatch,
):
    """Test upload-audio with no content type."""

    # Mock check_access to allow access
    def mock_check_access(
        client_pseudo_id, pseudonymized_staff_id, cpa_client_locations=None
    ):
        return mock_clientdata_service["clients_by_pseudo_id"].get(
            client_pseudo_id, mock_clientdata_service["clients"][0]
        )

    monkeypatch.setattr(permission_utils, "check_access", mock_check_access)

    # Setup: Create a transcription intake with a recording session
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.intake_type = IntakeType.TRANSCRIPTION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    await async_session.commit()
    await async_session.refresh(mock_intake)

    recording_session = RecordingSession(
        client_pseudo_id=client_pseudo_id,
        intake_id=mock_intake.id,
        status=RecordingStatus.CREATED,
    )
    async_session.add(recording_session)
    await async_session.commit()
    await async_session.refresh(recording_session)

    # Create a test file with no content type
    file_content = io.BytesIO(b"fake audio content")
    files = {
        "file": ("test_audio.webm", file_content, None),
    }

    response = await client.post(
        f"/recordings/sessions/{recording_session.id}/upload-audio",
        files=files,
    )

    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_audio_service_error(
    async_session: AsyncSession,
    client,
    mock_clientdata_service,
    mock_intake,
    monkeypatch,
):
    """Test upload-audio when RecordingService raises an error."""

    # Mock check_access to allow access
    def mock_check_access(
        client_pseudo_id, pseudonymized_staff_id, cpa_client_locations=None
    ):
        return mock_clientdata_service["clients_by_pseudo_id"].get(
            client_pseudo_id, mock_clientdata_service["clients"][0]
        )

    monkeypatch.setattr(permission_utils, "check_access", mock_check_access)

    # Setup: Create a transcription intake with a recording session
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.intake_type = IntakeType.TRANSCRIPTION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    await async_session.commit()
    await async_session.refresh(mock_intake)

    recording_session = RecordingSession(
        client_pseudo_id=client_pseudo_id,
        intake_id=mock_intake.id,
        status=RecordingStatus.CREATED,
    )
    async_session.add(recording_session)
    await async_session.commit()
    await async_session.refresh(recording_session)

    # Mock RecordingService to raise an error
    with patch(
        "app.routes.recording_session_router.RecordingService"
    ) as mock_recording_service_class:
        mock_service_instance = AsyncMock()
        mock_service_instance.upload_full_audio_file = AsyncMock(
            side_effect=Exception("GCS upload failed")
        )
        mock_recording_service_class.return_value.__aenter__ = AsyncMock(
            return_value=mock_service_instance
        )
        mock_recording_service_class.return_value.__aexit__ = AsyncMock(
            return_value=None
        )

        # Create a test audio file
        audio_file = io.BytesIO(b"fake audio content")
        files = {
            "file": ("test_audio.webm", audio_file, "audio/webm"),
        }

        response = await client.post(
            f"/recordings/sessions/{recording_session.id}/upload-audio",
            files=files,
        )

        assert response.status_code == 500
        assert "Failed to upload audio file" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_audio_different_file_formats(
    async_session: AsyncSession,
    client,
    mock_clientdata_service,
    mock_intake,
    monkeypatch,
):
    """Test upload-audio with different audio file formats."""

    # Mock check_access to allow access
    def mock_check_access(
        client_pseudo_id, pseudonymized_staff_id, cpa_client_locations=None
    ):
        return mock_clientdata_service["clients_by_pseudo_id"].get(
            client_pseudo_id, mock_clientdata_service["clients"][0]
        )

    monkeypatch.setattr(permission_utils, "check_access", mock_check_access)

    # Setup: Create a transcription intake with a recording session
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    mock_intake.intake_type = IntakeType.TRANSCRIPTION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Test different audio formats
    test_formats = [
        ("test.mp3", "audio/mpeg"),
        ("test.wav", "audio/wav"),
        ("test.m4a", "audio/mp4"),
        ("test.ogg", "audio/ogg"),
    ]

    for filename, content_type in test_formats:
        # Create a new recording session for each test
        recording_session = RecordingSession(
            client_pseudo_id=client_pseudo_id,
            intake_id=mock_intake.id,
            status=RecordingStatus.CREATED,
        )
        async_session.add(recording_session)
        await async_session.commit()
        await async_session.refresh(recording_session)

        mock_execution_id = uuid4()
        mock_gcs_path = f"recordings/{recording_session.id}/final/{filename}"

        # Create a real Execution object in the database for the foreign key constraint
        mock_execution = Execution(
            id=mock_execution_id,
            status=ExecutionStatus.PENDING,
            table_name="recording_session",
            table_entity_id=recording_session.id,
        )
        async_session.add(mock_execution)
        await async_session.commit()

        with (
            patch(
                "app.routes.recording_session_router.RecordingService"
            ) as mock_recording_service_class,
            patch(
                "app.routes.recording_session_router.schedule_task"
            ) as mock_schedule_task,
        ):
            # Mock the RecordingService
            mock_service_instance = AsyncMock()
            mock_service_instance.upload_full_audio_file = AsyncMock(
                return_value=mock_gcs_path
            )
            mock_recording_service_class.return_value.__aenter__ = AsyncMock(
                return_value=mock_service_instance
            )
            mock_recording_service_class.return_value.__aexit__ = AsyncMock(
                return_value=None
            )

            # Mock schedule_task to return the execution we created
            mock_schedule_task.return_value = mock_execution

            # Create a test audio file
            audio_file = io.BytesIO(b"fake audio content")
            files = {
                "file": (filename, audio_file, content_type),
            }

            response = await client.post(
                f"/recordings/sessions/{recording_session.id}/upload-audio",
                files=files,
            )

            assert response.status_code == 200, f"Failed for {content_type}"
            data = response.json()
            assert data["success"] is True
            assert data["gcs_file_path"] == mock_gcs_path
