import os
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.recording_service import (
    RecordingService,
    _concatenate_webm_files,
    extract_chunk_index,
    group_chunks_by_start,
)

TEST_AUDIO_DATA_ROOT = Path(__file__).parent.parent / "data" / "audio"
GCP_BUCKET = os.getenv("RECIDIVIZ_GCS_BUCKET_NAME", "test-bucket")


@pytest.fixture
def mock_storage():
    """Mock GCP Storage operations to prevent real API calls."""
    with patch("app.services.recording_service.Storage") as mock_storage_class:
        mock_storage_instance = MagicMock()

        # Mock async methods
        mock_storage_instance.list_objects = AsyncMock(return_value={"items": []})
        mock_storage_instance.upload = AsyncMock(return_value=None)
        mock_storage_instance.download = AsyncMock(return_value=b"test data")
        mock_storage_instance.delete = AsyncMock(return_value=None)
        mock_storage_instance.download_metadata = AsyncMock(return_value={})
        mock_storage_instance.get_bucket = MagicMock()

        mock_storage_class.return_value = mock_storage_instance
        yield mock_storage_instance


@pytest.fixture
def mock_token():
    """Mock GCP Token to prevent real authentication."""
    with patch("app.services.recording_service.Token") as mock_token_class:
        mock_token_instance = MagicMock()
        mock_token_instance.service_data = {
            "client_email": "test@test.iam.gserviceaccount.com",
            "project_id": "test-project",
            "type": "service_account",
        }
        mock_token_class.return_value = mock_token_instance
        yield mock_token_instance


async def upload_file_to_gcs(bucket_name: str, file_path: str, file_data: bytes):
    service = RecordingService(bucket_name)
    try:
        await service.ensure_bucket_exists()
        await service.storage.upload(
            bucket=bucket_name,
            object_name=file_path,
            file_data=file_data,
            content_type="text/plain",
        )
    finally:
        await service.close()


async def download_file_from_gcs(bucket_name: str, file_path: str) -> bytes:
    service = RecordingService(bucket_name)
    try:
        data = await service.storage.download(
            bucket=bucket_name,
            object_name=file_path,
        )
        return data
    finally:
        await service.close()


async def delete_file_from_gcs(bucket_name: str, file_path: str):
    service = RecordingService(bucket_name)
    try:
        await service.storage.delete(
            bucket=bucket_name,
            object_name=file_path,
        )
    finally:
        await service.close()


@pytest.mark.asyncio
async def test_upload_file(mock_storage, mock_token):
    bucket_name = GCP_BUCKET
    test_data = b"This is a test file content for GCS upload"
    file_name = f"test-files/{uuid.uuid4()}.txt"

    # Configure mock to return uploaded data when downloading
    mock_storage.download.return_value = test_data

    await upload_file_to_gcs(bucket_name, file_name, test_data)
    print(f"Uploaded file: {file_name}")

    # Verify upload was called
    mock_storage.upload.assert_called_once()
    upload_call = mock_storage.upload.call_args
    assert upload_call.kwargs["bucket"] == bucket_name
    assert upload_call.kwargs["object_name"] == file_name
    assert upload_call.kwargs["file_data"] == test_data

    downloaded_data = await download_file_from_gcs(bucket_name, file_name)
    assert downloaded_data == test_data
    print(f"Downloaded and verified file: {file_name}")

    await delete_file_from_gcs(bucket_name, file_name)
    print(f"Deleted file: {file_name}")

    # Verify delete was called
    assert mock_storage.delete.called


@pytest.mark.asyncio
async def test_generate_signed_url(mock_storage, mock_token):
    bucket_name = GCP_BUCKET
    test_data = b"This is a test file for signed URL"
    file_name = f"test-files/{uuid.uuid4()}.txt"

    # Configure mocks
    mock_storage.download.return_value = test_data
    mock_storage.download_metadata.return_value = {
        "name": file_name,
        "contentType": "text/plain",
    }

    # Mock the Blob's get_signed_url method
    mock_blob = MagicMock()
    mock_blob.get_signed_url = AsyncMock(
        return_value=f"https://storage.googleapis.com/{bucket_name}/{file_name}?signature=test"
    )

    mock_bucket = MagicMock()
    mock_storage.get_bucket.return_value = mock_bucket

    with patch("app.services.recording_service.Blob", return_value=mock_blob):
        service = RecordingService(bucket_name)

        try:
            await upload_file_to_gcs(bucket_name, file_name, test_data)
            print(f"Uploaded file: {file_name}")

            signed_url = await service.generate_signed_url(
                file_name, expiration_minutes=5
            )
            print(f"Generated signed URL: {signed_url}")
            assert signed_url.startswith("https://")

            # Verify the signed URL was generated
            mock_blob.get_signed_url.assert_called_once()

            await delete_file_from_gcs(bucket_name, file_name)
            print(f"Deleted file: {file_name}")

        finally:
            await service.close()


def test_extract_chunk_index():
    assert extract_chunk_index("recordings/session/chunks/chunk_0000_start.webm") == 0
    assert extract_chunk_index("recordings/session/chunks/chunk_0001_start.webm") == 1

    assert extract_chunk_index("recordings/session/chunks/chunk_0000.webm") == 0
    assert extract_chunk_index("recordings/session/chunks/chunk_0123.webm") == 123

    assert extract_chunk_index("invalid_path.webm") == -1
    assert extract_chunk_index("") == -1


def test_group_chunks_by_start():
    # Provide the filename out of order to handle more cases.
    files = [
        "recordings/session/chunks/chunk_0000_start.webm",
        "recordings/session/chunks/chunk_0004_start.webm",
        "recordings/session/chunks/chunk_0001.webm",
        "recordings/session/chunks/chunk_0003.webm",
        "recordings/session/chunks/chunk_0002.webm",
        "recordings/session/chunks/chunk_0009_start.webm",
        "recordings/session/chunks/chunk_0005.webm",
        "recordings/session/chunks/chunk_0006.webm",
        "recordings/session/chunks/chunk_0007.webm",
        "recordings/session/chunks/chunk_0008.webm",
        "recordings/session/chunks/chunk_0010.webm",
        "recordings/session/chunks/chunk_0011.webm",
    ]

    groups = group_chunks_by_start(files)

    print(f"The groups are {groups}")

    assert len(groups) == 3

    expected_group1 = [
        "recordings/session/chunks/chunk_0000_start.webm",
    ]
    assert groups[0] == expected_group1

    expected_group2 = [
        "recordings/session/chunks/chunk_0004_start.webm",
        "recordings/session/chunks/chunk_0001.webm",
        "recordings/session/chunks/chunk_0003.webm",
        "recordings/session/chunks/chunk_0002.webm",
    ]
    assert groups[1] == expected_group2

    expected_group3 = [
        "recordings/session/chunks/chunk_0009_start.webm",
        "recordings/session/chunks/chunk_0005.webm",
        "recordings/session/chunks/chunk_0006.webm",
        "recordings/session/chunks/chunk_0007.webm",
        "recordings/session/chunks/chunk_0008.webm",
        "recordings/session/chunks/chunk_0010.webm",
        "recordings/session/chunks/chunk_0011.webm",
    ]
    assert groups[2] == expected_group3

    # Test edge cases
    assert group_chunks_by_start([]) == []
    assert group_chunks_by_start(["single_file.webm"]) == []
    assert group_chunks_by_start(["chunk_0000_start.webm"]) == [
        ["chunk_0000_start.webm"]
    ]


@pytest.mark.asyncio
async def test_process_and_upload_groups(mock_storage, mock_token):
    bucket_name = GCP_BUCKET
    test_session_id = f"test-{uuid.uuid4()}"
    print(f"Using test session ID: {test_session_id}")

    # Path to sample files
    test_data_dir = os.path.join(TEST_AUDIO_DATA_ROOT, "chunked_webm_samples")

    sample_files = [f for f in os.listdir(test_data_dir) if f.endswith(".webm")]

    print(f"Found {len(sample_files)} sample files: {sample_files}")

    # Mock the list_chunk_files to return our sample files
    chunk_paths = [
        f"recordings/{test_session_id}/chunks/{filename}" for filename in sample_files
    ]

    # Store chunk data for mocking downloads
    chunk_data_map = {}
    for filename in sample_files:
        file_path = os.path.join(test_data_dir, filename)
        with open(file_path, "rb") as f:
            chunk_data = f.read()
        chunk_data_map[f"recordings/{test_session_id}/chunks/{filename}"] = chunk_data

    # Configure mock to return the actual chunk data when downloading
    async def mock_download(bucket, object_name):
        return chunk_data_map.get(object_name, b"")

    mock_storage.download.side_effect = mock_download

    # Mock list_objects to return chunk files
    mock_storage.list_objects.return_value = {
        "items": [{"name": path} for path in chunk_paths]
    }

    service = RecordingService(bucket_name)

    try:
        print("Uploading sample chunk files to GCS...")
        for filename in sample_files:
            chunk_path = f"recordings/{test_session_id}/chunks/{filename}"
            await upload_file_to_gcs(
                bucket_name, chunk_path, chunk_data_map[chunk_path]
            )
            print(f"Uploaded {filename} to {chunk_path}")

        print("Processing and uploading groups...")
        group_files = await service.process_and_upload_groups(test_session_id)

        print(f"Created {len(group_files)} group files:")
        for group_file in group_files:
            print(f"  - {group_file}")

        # Should have 2 groups based on the sample files (2 start files)
        expected_groups = len([f for f in sample_files if "_start" in f])
        assert len(group_files) == expected_groups

        print("Test completed successfully!")
        print(f"Files uploaded to session: {test_session_id}")

    finally:
        await service.close()


def test_concatenate_webm_files():
    import tempfile

    # Path to sample files
    test_data_dir = os.path.join(TEST_AUDIO_DATA_ROOT, "complete_webm_samples")

    sample_files = [f for f in os.listdir(test_data_dir) if f.endswith(".webm")]
    sample_files.sort()

    print(f"Found {len(sample_files)} sample files: {sample_files}")

    # Get full paths to sample files
    input_file_paths = [os.path.join(test_data_dir, f) for f in sample_files]

    for file_path in input_file_paths:
        assert os.path.exists(file_path), f"Sample file does not exist: {file_path}"
        print(f"Input file exists: {file_path}")

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_output:
        output_path = temp_output.name

    try:
        print(f"Concatenating {len(input_file_paths)} files...")
        print(f"Output path: {output_path}")

        result_path = _concatenate_webm_files(input_file_paths, output_path)

        assert result_path == output_path, f"Expected {output_path}, got {result_path}"

        assert os.path.exists(output_path), "Output file was not created"

        # Verify output file has content
        output_size = os.path.getsize(output_path)
        assert output_size > 0, "Output file is empty"

        print("Concatenation successful!")
        print(f"Output file size: {output_size} bytes")
        print(f"Concatenated file: {output_path}")

    finally:
        if os.path.exists(output_path):
            os.unlink(output_path)
            print(f"Cleaned up output file: {output_path}")


@pytest.mark.asyncio
async def test_process_chunks_to_final_audio(mock_storage, mock_token):
    """Upload sample audio chunks and test the creation of the final audio file."""
    bucket_name = GCP_BUCKET
    test_session_id = f"test-{uuid.uuid4()}"
    print(f"Using test session ID: {test_session_id}")

    test_data_dir = os.path.join(TEST_AUDIO_DATA_ROOT, "chunked_webm_samples")

    sample_files = [f for f in os.listdir(test_data_dir) if f.endswith(".webm")]

    print(f"Found {len(sample_files)} chunk files: {sample_files}")

    # Mock the list_chunk_files to return our sample files
    chunk_paths = [
        f"recordings/{test_session_id}/chunks/{filename}" for filename in sample_files
    ]

    # Store chunk data for mocking downloads
    chunk_data_map = {}
    for filename in sample_files:
        file_path = os.path.join(test_data_dir, filename)
        with open(file_path, "rb") as f:
            chunk_data = f.read()
        chunk_data_map[f"recordings/{test_session_id}/chunks/{filename}"] = chunk_data

    # Track uploaded group and final files
    uploaded_files = {}

    # Configure mock to return data when downloading
    async def mock_download(bucket, object_name, headers=None):
        # Return chunk data or uploaded group/final data
        return uploaded_files.get(
            object_name, chunk_data_map.get(object_name, b"test final audio data")
        )

    mock_storage.download.side_effect = mock_download

    # Mock upload to store data
    async def mock_upload(bucket, object_name, file_data, content_type):
        uploaded_files[object_name] = file_data

    mock_storage.upload.side_effect = mock_upload

    # Mock list_objects to return appropriate files based on prefix
    def mock_list_objects_sync(bucket, params=None):
        prefix = params.get("prefix", "") if params else ""

        if "/chunks/" in prefix:
            # Return chunk files
            return {"items": [{"name": path} for path in chunk_paths]}
        elif "/groups/" in prefix:
            # Return group files that were uploaded
            group_files = [k for k in uploaded_files.keys() if "/groups/" in k]
            return {"items": [{"name": path} for path in group_files]}
        else:
            # Return all files for the session
            all_files = list(chunk_paths) + list(uploaded_files.keys())
            return {"items": [{"name": path} for path in all_files]}

    mock_storage.list_objects.side_effect = (
        lambda bucket, params=None: mock_list_objects_sync(bucket, params)
    )

    service = RecordingService(bucket_name)

    try:
        print("Uploading sample chunk files to GCS...")
        for filename in sample_files:
            chunk_path = f"recordings/{test_session_id}/chunks/{filename}"
            await upload_file_to_gcs(
                bucket_name, chunk_path, chunk_data_map[chunk_path]
            )
            print(f"Uploaded {filename} to {chunk_path}")

        print("Processing chunks to final audio...")
        final_audio_path = await service.process_chunks_to_final_audio(test_session_id)

        assert final_audio_path, "Final audio path should not be empty"
        assert final_audio_path.startswith(
            f"recordings/{test_session_id}/final/"
        ), f"Unexpected final path: {final_audio_path}"
        assert final_audio_path.endswith(
            "final_audio.webm"
        ), f"Unexpected filename in path: {final_audio_path}"

        print(f"Final audio created successfully: {final_audio_path}")

        try:
            final_data = await service.download_single_chunk(final_audio_path)
            assert len(final_data) > 0, "Final audio file should not be empty"
            print(f"Final audio file size: {len(final_data)} bytes")
        except Exception as e:
            raise AssertionError(f"Failed to download final audio file: {e}")

        print("Test completed successfully!")
        print(f"Final audio uploaded to: {final_audio_path}")

    finally:
        await service.close()
