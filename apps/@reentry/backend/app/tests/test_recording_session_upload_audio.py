"""
Tests for the audio upload endpoints in recording_session_router:
- /sessions/{session_id}/get-upload-url (new direct upload flow)
- /sessions/{session_id}/confirm-upload (new direct upload flow)
- /sessions/{session_id}/upload-audio (legacy endpoint)
"""

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

# ============================================================================
# Tests for new direct upload flow: get-upload-url and confirm-upload
# ============================================================================


@pytest.mark.asyncio
async def test_get_upload_url_success(
    async_session: AsyncSession,
    client,
    mock_clientdata_service,
    mock_intake,
    monkeypatch,
):
    """Test successful generation of signed upload URL."""

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

    # Mock RecordingService to return a signed URL
    mock_signed_url = (
        "https://storage.googleapis.com/test-bucket/recordings/"
        f"{recording_session.id}/final/test_audio.webm?X-Goog-Signature=..."
    )

    with patch(
        "app.routes.recording_session_router.RecordingService"
    ) as mock_recording_service_class:
        mock_service_instance = AsyncMock()
        mock_service_instance.generate_upload_signed_url = AsyncMock(
            return_value=mock_signed_url
        )
        mock_recording_service_class.return_value.__aenter__ = AsyncMock(
            return_value=mock_service_instance
        )
        mock_recording_service_class.return_value.__aexit__ = AsyncMock(
            return_value=None
        )

        # Make the request
        response = await client.post(
            f"/recordings/sessions/{recording_session.id}/get-upload-url",
            json={
                "file_name": "test_audio.webm",
                "content_type": "audio/webm",
            },
        )

        # Assert response
        assert response.status_code == 200
        data = response.json()
        assert data["upload_url"] == mock_signed_url
        assert (
            data["file_path"]
            == f"recordings/{recording_session.id}/final/test_audio.webm"
        )
        assert data["expires_in_seconds"] == 30 * 60  # 30 minutes

        # Verify RecordingService was called correctly
        mock_service_instance.generate_upload_signed_url.assert_called_once()
        call_args = mock_service_instance.generate_upload_signed_url.call_args
        assert (
            call_args[1]["file_path"]
            == f"recordings/{recording_session.id}/final/test_audio.webm"
        )
        assert call_args[1]["content_type"] == "audio/webm"
        assert call_args[1]["expiration_minutes"] == 15


@pytest.mark.asyncio
async def test_get_upload_url_invalid_content_type(
    async_session: AsyncSession,
    client,
    mock_clientdata_service,
    mock_intake,
    monkeypatch,
):
    """Test get-upload-url with invalid content type."""

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

    # Request with non-audio content type
    response = await client.post(
        f"/recordings/sessions/{recording_session.id}/get-upload-url",
        json={
            "file_name": "test.txt",
            "content_type": "text/plain",
        },
    )

    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_upload_url_session_not_found(
    async_session: AsyncSession,
    client,
):
    """Test get-upload-url with non-existent recording session."""
    fake_session_id = uuid4()

    response = await client.post(
        f"/recordings/sessions/{fake_session_id}/get-upload-url",
        json={
            "file_name": "test_audio.webm",
            "content_type": "audio/webm",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Recording session not found"


@pytest.mark.asyncio
async def test_confirm_upload_success(
    async_session: AsyncSession,
    client,
    mock_clientdata_service,
    mock_intake,
    monkeypatch,
):
    """Test successful confirmation of upload."""

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

    # Mock schedule_task
    mock_execution_id = uuid4()
    mock_gcs_path = f"recordings/{recording_session.id}/final/test_audio.webm"

    # Create a real Execution object in the database for the foreign key constraint
    mock_execution = Execution(
        id=mock_execution_id,
        status=ExecutionStatus.PENDING,
        table_name="recording_session",
        table_entity_id=recording_session.id,
    )
    async_session.add(mock_execution)
    await async_session.commit()

    with patch(
        "app.routes.recording_session_router.schedule_task"
    ) as mock_schedule_task:
        # Mock schedule_task to return the execution we created
        mock_schedule_task.return_value = mock_execution

        # Make the request
        response = await client.post(
            f"/recordings/sessions/{recording_session.id}/confirm-upload",
            json={
                "file_path": mock_gcs_path,
                "file_name": "test_audio.webm",
                "content_type": "audio/webm",
                "duration_ms": 60000,  # 1 minute
            },
        )

        # Assert response
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["gcs_file_path"] == mock_gcs_path
        assert data["execution_id"] == str(mock_execution_id)
        assert data["message"] == "Upload confirmed and processing started"

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
async def test_confirm_upload_session_not_found(
    async_session: AsyncSession,
    client,
):
    """Test confirm-upload with non-existent recording session."""
    fake_session_id = uuid4()

    response = await client.post(
        f"/recordings/sessions/{fake_session_id}/confirm-upload",
        json={
            "file_path": f"recordings/{fake_session_id}/final/test.webm",
            "file_name": "test.webm",
            "content_type": "audio/webm",
            "duration_ms": 60000,  # 1 minute
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Recording session not found"


@pytest.mark.asyncio
async def test_direct_upload_complete_flow(
    async_session: AsyncSession,
    client,
    mock_clientdata_service,
    mock_intake,
    monkeypatch,
):
    """Test the complete direct upload flow: get URL → confirm upload."""

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

    # Step 1: Get upload URL
    mock_signed_url = (
        "https://storage.googleapis.com/test-bucket/recordings/"
        f"{recording_session.id}/final/test_audio.webm?X-Goog-Signature=..."
    )

    with patch(
        "app.routes.recording_session_router.RecordingService"
    ) as mock_recording_service_class:
        mock_service_instance = AsyncMock()
        mock_service_instance.generate_upload_signed_url = AsyncMock(
            return_value=mock_signed_url
        )
        mock_recording_service_class.return_value.__aenter__ = AsyncMock(
            return_value=mock_service_instance
        )
        mock_recording_service_class.return_value.__aexit__ = AsyncMock(
            return_value=None
        )

        get_url_response = await client.post(
            f"/recordings/sessions/{recording_session.id}/get-upload-url",
            json={
                "file_name": "test_audio.webm",
                "content_type": "audio/webm",
            },
        )

        assert get_url_response.status_code == 200
        upload_data = get_url_response.json()
        assert "upload_url" in upload_data
        assert "file_path" in upload_data
        file_path = upload_data["file_path"]

    # Step 2: (In real scenario, frontend would upload to GCS here)
    # We skip the actual GCS upload in the test

    # Step 3: Confirm upload
    mock_execution_id = uuid4()
    mock_execution = Execution(
        id=mock_execution_id,
        status=ExecutionStatus.PENDING,
        table_name="recording_session",
        table_entity_id=recording_session.id,
    )
    async_session.add(mock_execution)
    await async_session.commit()

    with patch(
        "app.routes.recording_session_router.schedule_task"
    ) as mock_schedule_task:
        mock_schedule_task.return_value = mock_execution

        confirm_response = await client.post(
            f"/recordings/sessions/{recording_session.id}/confirm-upload",
            json={
                "file_path": file_path,
                "file_name": "test_audio.webm",
                "content_type": "audio/webm",
                "duration_ms": 60000,  # 1 minute
            },
        )

        assert confirm_response.status_code == 200
        confirm_data = confirm_response.json()
        assert confirm_data["success"] is True
        assert confirm_data["gcs_file_path"] == file_path

    # Verify final state
    await async_session.refresh(recording_session)
    assert recording_session.gcs_final_file_path == file_path
    assert recording_session.status == RecordingStatus.PROCESSING
    assert recording_session.execution_id == mock_execution_id
