import os
import uuid
from pathlib import Path

import aiohttp
import pytest

from app.services.recording_service import (
    RecordingService,
    _concatenate_webm_files,
    extract_chunk_index,
    group_chunks_by_start,
)

TEST_AUDIO_DATA_ROOT = Path(__file__).parent.parent / "data" / "audio"
GCP_BUCKET = os.getenv("RECIDIVIZ_GCS_BUCKET_NAME")


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
@pytest.mark.integration
async def test_upload_file(bucket_name: str = GCP_BUCKET):
    test_data = b"This is a test file content for GCS upload"
    file_name = f"test-files/{uuid.uuid4()}.txt"
    file_uploaded = False

    try:
        await upload_file_to_gcs(bucket_name, file_name, test_data)
        file_uploaded = True
        print(f"Uploaded file: {file_name}")

        downloaded_data = await download_file_from_gcs(bucket_name, file_name)
        assert downloaded_data == test_data
        print(f"Downloaded and verified file: {file_name}")

    finally:
        if file_uploaded:
            try:
                await delete_file_from_gcs(bucket_name, file_name)
                print(f"Deleted file: {file_name}")
            except Exception as cleanup_error:
                print(f"Warning: Failed to delete file {file_name}: {cleanup_error}")


@pytest.mark.asyncio
@pytest.mark.integration
async def test_generate_signed_url(bucket_name: str = GCP_BUCKET):
    test_data = b"This is a test file for signed URL"
    file_name = f"test-files/{uuid.uuid4()}.txt"

    service = RecordingService(bucket_name)
    file_uploaded = False

    try:
        await upload_file_to_gcs(bucket_name, file_name, test_data)
        file_uploaded = True
        print(f"Uploaded file: {file_name}")

        signed_url = await service.generate_signed_url(file_name, expiration_hours=1)
        print(f"Generated signed URL: {signed_url}")
        assert signed_url.startswith("https://")

        async with aiohttp.ClientSession() as session:
            async with session.get(signed_url) as response:
                downloaded_data = await response.read()
                assert downloaded_data == test_data
                print("Successfully downloaded file via signed URL")

    finally:
        if file_uploaded:
            try:
                await delete_file_from_gcs(bucket_name, file_name)
                print(f"Deleted file: {file_name}")
            except Exception as cleanup_error:
                print(f"Warning: Failed to delete file {file_name}: {cleanup_error}")

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
        "recordings/session/chunks/chunk_0001.webm",
        "recordings/session/chunks/chunk_0002.webm",
        "recordings/session/chunks/chunk_0003.webm",
    ]
    assert groups[0] == expected_group1

    expected_group2 = [
        "recordings/session/chunks/chunk_0004_start.webm",
        "recordings/session/chunks/chunk_0005.webm",
        "recordings/session/chunks/chunk_0006.webm",
        "recordings/session/chunks/chunk_0007.webm",
        "recordings/session/chunks/chunk_0008.webm",
    ]
    assert groups[1] == expected_group2

    expected_group3 = [
        "recordings/session/chunks/chunk_0009_start.webm",
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
@pytest.mark.integration
async def test_process_and_upload_groups(bucket_name: str = GCP_BUCKET):
    test_session_id = f"test-{uuid.uuid4()}"
    print(f"Using test session ID: {test_session_id}")

    # Path to sample files
    test_data_dir = os.path.join(TEST_AUDIO_DATA_ROOT, "chunked_webm_samples")

    sample_files = [f for f in os.listdir(test_data_dir) if f.endswith(".webm")]

    print(f"Found {len(sample_files)} sample files: {sample_files}")

    service = RecordingService(bucket_name)

    try:
        print("Uploading sample chunk files to GCS...")
        for filename in sample_files:
            file_path = os.path.join(test_data_dir, filename)

            with open(file_path, "rb") as f:
                chunk_data = f.read()

            chunk_path = f"recordings/{test_session_id}/chunks/{filename}"
            await upload_file_to_gcs(bucket_name, chunk_path, chunk_data)
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

        print("Cleaning up uploaded files...")

        # Delete chunk files
        for filename in sample_files:
            chunk_path = f"recordings/{test_session_id}/chunks/{filename}"
            try:
                await service.storage.delete(
                    bucket=bucket_name,
                    object_name=chunk_path,
                )
                print(f"Deleted chunk: {chunk_path}")
            except Exception as e:
                print(f"Failed to delete chunk {chunk_path}: {e}")

        # Delete group files
        for group_file in group_files:
            try:
                await service.storage.delete(
                    bucket=bucket_name,
                    object_name=group_file,
                )
                print(f"Deleted group: {group_file}")
            except Exception as e:
                print(f"Failed to delete group {group_file}: {e}")

        print("Files cleaned up successfully!")

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
@pytest.mark.integration
async def test_process_chunks_to_final_audio(bucket_name: str = GCP_BUCKET):
    """Upload sample audio chunks and test the creation of the final audio file.."""
    test_session_id = f"test-{uuid.uuid4()}"
    print(f"Using test session ID: {test_session_id}")

    test_data_dir = os.path.join(TEST_AUDIO_DATA_ROOT, "chunked_webm_samples")

    sample_files = [f for f in os.listdir(test_data_dir) if f.endswith(".webm")]

    print(f"Found {len(sample_files)} chunk files: {sample_files}")

    service = RecordingService(bucket_name)

    try:
        print("Uploading sample chunk files to GCS...")
        for filename in sample_files:
            file_path = os.path.join(test_data_dir, filename)

            with open(file_path, "rb") as f:
                chunk_data = f.read()

            chunk_path = f"recordings/{test_session_id}/chunks/{filename}"
            await upload_file_to_gcs(bucket_name, chunk_path, chunk_data)
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

        print("Cleaning up all files in session directory...")

        # List all files in the session directory
        session_prefix = f"recordings/{test_session_id}/"
        try:
            objects = await service.storage.list_objects(
                bucket=bucket_name, params={"prefix": session_prefix}
            )

            files_to_delete = []
            for obj in objects.get("items", []):
                files_to_delete.append(obj["name"])

            print(f"Found {len(files_to_delete)} files to delete in session directory")

            for file_path in files_to_delete:
                try:
                    await service.storage.delete(
                        bucket=bucket_name,
                        object_name=file_path,
                    )
                    print(f"Deleted: {file_path}")
                except Exception as e:
                    print(f"Failed to delete {file_path}: {e}")

            print("Files cleaned up successfully!")

        except Exception as e:
            print(f"Failed to list or delete session files: {e}")

    finally:
        await service.close()
