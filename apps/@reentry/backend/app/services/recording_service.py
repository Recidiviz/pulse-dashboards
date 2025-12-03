"""Recording service for audio chunks.

The storage pattern on Google cloud is like this:
The chunks belonging to a single audio recording stream have a _start label
and form a group until the next _start.

The combined chunks in a single group are put in the groups folder

The combined group_x files is put into the final.
.
├── chunks/
│   ├── chunk_1726847234567_0000_start.webm
│   ├── chunk_1726847234568_0001.webm
│   ├── chunk_1726847234569_0002_start.webm
│   ├── chunk_1726847234570_0003.webm
│   └── chunk_1726847234571_0004.webm
├── groups/
│   ├── group_0.webm
│   └── group_1.webm
└── final/
    └── final_audio.webm
"""

import asyncio
import logging
import os
import re
import tempfile
from concurrent.futures import ThreadPoolExecutor
from typing import List

import aiohttp
from gcloud.aio.auth import Token
from gcloud.aio.storage import Blob, Storage

from app.core.config import settings
from app.services.audio_converter import (
    DEFAULT_BITRATE,
    DEFAULT_CHANNELS,
    DEFAULT_SAMPLE_RATE,
    call_ffmpeg,
)

logger = logging.getLogger(__name__)

# Matroska/WebM signatures
# EBML_MAGIC (0x1A45DFA3) is the EBML Header element ID which typically appears at the
# beginning of Matroska/WebM streams. Used to detect a full EBML header.
# Reference: Matroska Element IDs (EBML Header) — matroska.org; EBML spec RFC 8794
EBML_MAGIC = b"\x1a\x45\xdf\xa3"

# CLUSTER_MAGIC (0x1F43B675) is the Matroska Cluster element ID which delimits clusters of blocks
# (timestamped frames). Used here to locate the start of the first Cluster when a non-start chunk
# mistakenly contains an EBML header so we can strip everything before the first Cluster.
# Reference: Matroska Element IDs (Cluster) — matroska.org
CLUSTER_MAGIC = b"\x1f\x43\xb6\x75"


def _concatenate_webm_files(file_paths: List[str], output_path: str) -> str:
    if not file_paths:
        raise ValueError("No file paths provided for concatenation")

    logger.info(f"Concatenating {len(file_paths)} WebM files using ffmpeg")

    # Filter out non-existent files
    valid_files = []
    for i, file_path in enumerate(file_paths):
        if not os.path.exists(file_path):
            logger.warning(f"File does not exist, skipping: {file_path}")
            continue
        logger.debug(f"Adding file {i+1}/{len(file_paths)}: {file_path}")
        valid_files.append(file_path)

    if not valid_files:
        raise ValueError("No valid audio files found for concatenation")

    # Create a temporary concat list file for ffmpeg
    concat_list_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", delete=False
        ) as concat_file:
            concat_list_path = concat_file.name
            for file_path in valid_files:
                # Escape single quotes in file paths for ffmpeg concat demuxer
                escaped_path = file_path.replace("'", "'\\''")
                concat_file.write(f"file '{escaped_path}'\n")

        logger.info("Concatenating audio files with ffmpeg...")

        # Use ffmpeg concat demuxer to concatenate files
        ffmpeg_args = [
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            concat_list_path,
            "-c:a",
            "libopus",
            "-b:a",
            DEFAULT_BITRATE,
            "-ar",
            "48000",
            "-vn",
            output_path,
        ]

        call_ffmpeg(ffmpeg_args)

        logger.info(
            f"Successfully concatenated {len(valid_files)} audio files to {output_path}"
        )
        return output_path

    except Exception as e:
        logger.error(f"Failed to concatenate WebM files: {e}")
        raise
    finally:
        # Clean up the temporary concat list file
        if concat_list_path and os.path.exists(concat_list_path):
            try:
                os.unlink(concat_list_path)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup concat list file: {cleanup_error}")


def extract_chunk_index(file_path: str) -> int:
    """Extract chunk index from file path for sorting."""
    try:
        filename = file_path.split("/")[
            -1
        ]  # Get just the filename in the full filepath

        # New format: chunk_TIMESTAMP_XXXX[_start].webm
        new_format_match = re.search(r"chunk_\d{13}_(\d{4})(?:_start)?\.webm", filename)
        if new_format_match:
            return int(new_format_match.group(1))

        # Legacy format: chunk_XXXX[_start].webm
        legacy_match = re.search(r"chunk_(\d+)", filename)
        if legacy_match:
            return int(legacy_match.group(1))
        return -1  # Return -1 for no match
    except Exception:
        return -1


def extract_timestamp_from_filename(file_path: str) -> int:
    """
    Extract timestamp from filename:
    - New format: chunk_1726847234567_0001.webm or chunk_1726847234567_0001_start.webm
    - Legacy format: chunk_0001.webm or chunk_0001_start.webm
    """
    try:
        filename = file_path.split("/")[-1]  # Get just the filename

        # Format: chunk_TIMESTAMP_XXXX[_start].webm
        format_match = re.search(r"chunk_(\d{13})_(\d{4})(?:_start)?\.webm", filename)
        if format_match:
            timestamp = int(format_match.group(1))
            chunk_index = int(format_match.group(2))
            logger.debug(
                f"Parsed new format - timestamp: {timestamp}, chunk_index: {chunk_index}"
            )
            return timestamp

        # if not match, return 0 it will process the last one
        logger.warning(f"Could not parse timestamp from filename: {filename}")
        return 0
    except Exception as e:
        logger.error(f"Error extracting timestamp from {file_path}: {e}")
        return 0


def group_chunks_by_start(file_paths: List[str]) -> List[List[str]]:
    if not file_paths:
        return []

    # Sort files by chunk index first
    sorted_files = sorted(file_paths, key=extract_timestamp_from_filename)

    groups = []
    current_group = []

    for file_path in sorted_files:
        filename = file_path.split("/")[-1]  # Get just the filename

        if "_start" in filename:
            if current_group:
                groups.append(current_group)
            current_group = [file_path]
        else:
            if current_group:
                current_group.append(file_path)

    if current_group:
        groups.append(current_group)

    return groups


def group_chunks_by_start_timestamp(file_paths: List[str]) -> List[List[str]]:
    """Group chunks by _start markers, ordered by timestamp."""
    if not file_paths:
        return []

    sorted_files = sorted(file_paths, key=extract_timestamp_from_filename)

    groups = []
    current_group = []

    for file_path in sorted_files:
        filename = file_path.split("/")[-1]

        if "_start" in filename:
            if current_group:
                groups.append(current_group)
            current_group = [file_path]
        else:
            if current_group:
                current_group.append(file_path)

    if current_group:
        groups.append(current_group)

    return groups


class RecordingService:
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self._audio_executor = ThreadPoolExecutor(max_workers=1)
        key_path = os.path.join(
            os.path.dirname(__file__), "../../.secrets/gcp-service-account.json"
        )
        self.session = aiohttp.ClientSession()
        if os.path.exists(key_path):
            self.token = Token(
                service_file=key_path,
                session=self.session,
                scopes=["https://www.googleapis.com/auth/devstorage.read_write"],
            )
            logger.info("Using service account key for GCS authentication")
        else:
            self.token = Token(
                session=self.session,
                scopes=["https://www.googleapis.com/auth/devstorage.read_write"],
            )
            logger.info("Using default credentials for GCS authentication")

        self.storage = Storage(token=self.token, session=self.session)
        self._service_account_email = None
        self._log_authenticated_user()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):  # noqa: ARG002
        await self.close()

    def _log_authenticated_user(self):
        try:
            if hasattr(self.token, "service_data") and self.token.service_data:
                client_email = self.token.service_data.get("client_email")
                project_id = self.token.service_data.get("project_id")
                token_type = self.token.service_data.get("type")

                if client_email:
                    logger.info(
                        f"GCS authenticated as service account: {client_email} (project: {project_id}, type: {token_type})"
                    )
                else:
                    logger.info(
                        f"GCS authenticated with service account (project: {project_id}, type: {token_type})"
                    )
            else:
                token_type = getattr(self.token, "token_type", "unknown")
                logger.info(
                    f"GCS authenticated. no service_data attr. (token_type: {token_type})"
                )
        except Exception as e:
            logger.warning(f"Could not retrieve authenticated user info: {e}")

    async def _initialize_service_account_email(self) -> str | None:
        if settings.GCS_SERVICE_ACCOUNT_EMAIL != "":
            logger.info(
                f"Got GCS service account email from settings: {settings.GCS_SERVICE_ACCOUNT_EMAIL}"
            )
            return settings.GCS_SERVICE_ACCOUNT_EMAIL

        if hasattr(self.token, "service_data") and self.token.service_data:
            client_email = self.token.service_data.get("client_email")
            if client_email:
                logger.info(
                    f"Got GCS service account email from the token: {client_email}"
                )
                return client_email

        try:
            async with self.session.get(
                "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email",
                headers={"Metadata-Flavor": "Google"},
            ) as resp:
                if resp.status == 200:
                    service_account_email = await resp.text()
                    logger.info(
                        f"Got the service account email from the metadata server: {service_account_email}"
                    )
                    return service_account_email
                else:
                    logger.warning(
                        "Could not retrieve service account email from metadata server."
                    )
                    return None
        except Exception as metadata_error:
            logger.warning(
                f"Error in getting service account from metadata: {metadata_error}"
            )
            return None

    async def get_client_email(self) -> str | None:
        if self._service_account_email is None:
            self._service_account_email = await self._initialize_service_account_email()
        return self._service_account_email

    async def close(self):
        """Close the session and shutdown executor. For backwards compatibility."""
        if self.session:
            await self.session.close()
        self._audio_executor.shutdown(wait=True)

    async def ensure_bucket_exists(self):
        try:
            # Try to list objects to check if bucket exists
            # This is a simple way to verify bucket access
            await self.storage.list_objects(
                bucket=self.bucket_name, params={"maxResults": 1}
            )
            logger.info(f"Using existing GCS bucket: {self.bucket_name}")
        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg or "not found" in error_msg.lower():
                logger.error(f"Bucket doesn't exist {self.bucket_name}")
                raise
            else:
                # Bucket exists but might have other issues (permissions, etc)
                logger.warning(f"Bucket check returned error but continuing: {e}")

    async def upload_chunk(
        self,
        session_id: str,
        chunk_index: int,
        chunk_data: bytes,
        has_header: bool,
        timestamp: int,
    ) -> str:
        filename_tag = "_start" if has_header else ""
        chunk_path = f"recordings/{session_id}/chunks/chunk_{timestamp}_{chunk_index:04d}{filename_tag}.webm"

        await self.storage.upload(
            bucket=self.bucket_name,
            object_name=chunk_path,
            file_data=chunk_data,
            content_type="audio/webm",
        )

        return chunk_path

    async def list_chunk_files(self, session_id: str) -> List[str]:
        prefix = f"recordings/{session_id}/chunks/"

        chunk_files = []
        page_token = None

        # Handle pagination to get all chunks (API returns max 1000 per request)
        while True:
            params = {
                "prefix": prefix,
                "maxResults": 1000,  # Explicitly set max results per page
            }
            if page_token:
                params["pageToken"] = page_token

            objects = await self.storage.list_objects(
                bucket=self.bucket_name, params=params
            )

            # Check if we got any items
            items = objects.get("items", [])
            if not items:
                logger.warning(f"No items returned for session {session_id}")
                break

            for obj in items:
                name = obj["name"]
                if (
                    name.startswith(prefix)
                    and name.endswith(".webm")
                    and "chunk_" in name
                ):
                    chunk_files.append(name)

            # Check if there are more pages
            page_token = objects.get("nextPageToken")
            if not page_token:
                break

            logger.debug(
                f"Fetching next page, found {len(chunk_files)} chunks so far..."
            )

        chunk_files.sort(key=extract_timestamp_from_filename)
        logger.info(
            f"Found {len(chunk_files)} total chunk files for session {session_id}"
        )
        return chunk_files

    async def download_single_chunk(self, file_path: str) -> bytes:
        return await self.storage.download(
            bucket=self.bucket_name,
            object_name=file_path,
        )

    async def download_chunks(self, session_id: str, total_chunks: int) -> List[bytes]:
        chunks = []
        # Sequential downloads to avoid rate limits
        for i in range(total_chunks):
            chunk_path = f"recordings/{session_id}/chunks/chunk_{i:04d}.webm"
            chunk_data = await self.storage.download(
                bucket=self.bucket_name,
                object_name=chunk_path,
            )
            chunks.append(chunk_data)

        return chunks

    def _encode_audio_data(self, input_filename: str, output_filename: str) -> None:
        ffmpeg_args = [
            "-y",
            "-fflags",
            "+genpts",
            "-i",
            input_filename,
            "-vn",
            "-ac",
            DEFAULT_CHANNELS,
            "-ar",
            DEFAULT_SAMPLE_RATE,
            "-c:a",
            "libopus",
            "-b:a",
            DEFAULT_BITRATE,
            "-application",
            "audio",
            "-vbr",
            "on",
            "-f",
            "webm",
            "-avoid_negative_ts",
            "make_zero",
            output_filename,
        ]
        try:
            call_ffmpeg(ffmpeg_args)
        except Exception:
            if os.path.exists(output_filename):
                os.unlink(output_filename)
            raise

    async def process_and_upload_groups(self, session_id: str) -> List[str]:
        chunk_files = await self.list_chunk_files(session_id)
        if not chunk_files:
            logger.warning(f"No chunk files found for session {session_id}")
            return []

        logger.info(f"Found {len(chunk_files)} chunk files for session {session_id}")

        groups = group_chunks_by_start_timestamp(chunk_files)
        logger.info(f"Found {len(groups)} groups for session {session_id}")

        uploaded_groups = []

        processed_group_idx = 0
        for group_index, group_chunks in enumerate(groups):
            try:
                logger.info(
                    f"Processing group {group_index} with {len(group_chunks)} chunks"
                )
                logger.debug(
                    f"Group {group_index} chunk objects: {group_chunks} (session {session_id})"
                )

                # Process chunks in streaming fashion to avoid loading all into memory
                loop = asyncio.get_event_loop()
                temp_concat_path = None
                temp_reencode_path = None
                temp_file = None
                chunk_count_in_subgroup = 0

                try:
                    # Create initial temp files for first subgroup
                    with tempfile.NamedTemporaryFile(
                        suffix=".webm", delete=False
                    ) as temp_concat:
                        temp_concat_path = temp_concat.name

                    with tempfile.NamedTemporaryFile(
                        suffix=".webm", delete=False
                    ) as temp_reencode:
                        temp_reencode_path = temp_reencode.name

                    # Open temp file for writing
                    temp_file = open(temp_concat_path, "wb")

                    for i, path in enumerate(group_chunks):
                        # Download chunk
                        data = await self.download_single_chunk(path)
                        fname = path.split("/")[-1]
                        is_first_in_group = i == 0
                        is_start_chunk = "_start" in fname

                        # Check if this non-start chunk begins a new subgroup (has EBML header)
                        is_subgroup_boundary = (
                            not is_first_in_group
                            and not is_start_chunk
                            and data.startswith(EBML_MAGIC)
                        )

                        if is_subgroup_boundary:
                            # Close current temp file and process the subgroup
                            temp_file.close()

                            # Encode and upload current subgroup
                            await loop.run_in_executor(
                                self._audio_executor,
                                self._encode_audio_data,
                                temp_concat_path,
                                temp_reencode_path,
                            )

                            with open(temp_reencode_path, "rb") as f:
                                re_data = f.read()

                            out_path = f"recordings/{session_id}/groups/group_{processed_group_idx}.webm"
                            await self.storage.upload(
                                bucket=self.bucket_name,
                                object_name=out_path,
                                file_data=re_data,
                                content_type="audio/webm",
                            )
                            uploaded_groups.append(out_path)
                            logger.info(
                                f"Uploaded subgroup with {chunk_count_in_subgroup} chunks "
                                f"(group index {processed_group_idx}) to {out_path}"
                            )
                            processed_group_idx += 1

                            # Clean up and create new temp files for next subgroup
                            if os.path.exists(temp_concat_path):
                                os.unlink(temp_concat_path)
                            if os.path.exists(temp_reencode_path):
                                os.unlink(temp_reencode_path)

                            with tempfile.NamedTemporaryFile(
                                suffix=".webm", delete=False
                            ) as temp_concat:
                                temp_concat_path = temp_concat.name

                            with tempfile.NamedTemporaryFile(
                                suffix=".webm", delete=False
                            ) as temp_reencode:
                                temp_reencode_path = temp_reencode.name

                            # Open new temp file for writing
                            temp_file = open(temp_concat_path, "wb")
                            chunk_count_in_subgroup = 0

                        # Process and write chunk data
                        is_start = (
                            is_first_in_group or is_start_chunk or is_subgroup_boundary
                        )
                        if not is_start and data.startswith(EBML_MAGIC):
                            # Strip unexpected EBML header from non-start chunk
                            ci = data.find(CLUSTER_MAGIC)
                            if ci > 0:
                                data = data[ci:]
                            else:
                                logger.warning(
                                    f"Skipping non-start EBML chunk without Cluster: {fname}"
                                )
                                continue

                        temp_file.write(data)
                        chunk_count_in_subgroup += 1

                    # Close and process final subgroup
                    temp_file.close()

                    await loop.run_in_executor(
                        self._audio_executor,
                        self._encode_audio_data,
                        temp_concat_path,
                        temp_reencode_path,
                    )

                    with open(temp_reencode_path, "rb") as f:
                        re_data = f.read()

                    out_path = f"recordings/{session_id}/groups/group_{processed_group_idx}.webm"
                    await self.storage.upload(
                        bucket=self.bucket_name,
                        object_name=out_path,
                        file_data=re_data,
                        content_type="audio/webm",
                    )
                    uploaded_groups.append(out_path)
                    logger.info(
                        f"Uploaded final subgroup with {chunk_count_in_subgroup} chunks "
                        f"(group index {processed_group_idx}) to {out_path}"
                    )
                    processed_group_idx += 1

                finally:
                    # Close temp file if still open
                    if temp_file:
                        try:
                            temp_file.close()
                        except Exception as close_error:
                            logger.warning(f"Failed to close temp file: {close_error}")

                    # Clean up temp files
                    try:
                        if temp_concat_path and os.path.exists(temp_concat_path):
                            os.unlink(temp_concat_path)
                        if temp_reencode_path and os.path.exists(temp_reencode_path):
                            os.unlink(temp_reencode_path)
                    except Exception as cleanup_error:
                        logger.warning(f"Failed to cleanup temp files: {cleanup_error}")

            except Exception as e:
                logger.error(f"Failed to process group {group_index}: {e}")
                # Continue with other groups
                raise

        logger.info(
            f"Successfully processed {len(uploaded_groups)} out of {len(groups)} groups"
        )
        return uploaded_groups

    async def generate_signed_url(
        self, file_path: str, expiration_minutes: int = 5
    ) -> str:
        try:
            await self.storage.download(
                bucket=self.bucket_name,
                object_name=file_path,
                headers={"Range": "bytes=0-0"},  # Just check existence
            )
        except Exception as e:
            if "404" in str(e):
                logger.error(
                    f"File not found in GCS bucket {self.bucket_name}: {file_path}"
                )
                raise FileNotFoundError(f"File {file_path} not found")

        logger.info(
            f"Generating signed URL for file: gs://{self.bucket_name}/{file_path}"
        )

        service_account_email = await self.get_client_email()

        metadata = await self.storage.download_metadata(
            bucket=self.bucket_name,
            object_name=file_path,
        )

        bucket = self.storage.get_bucket(self.bucket_name)
        blob = Blob(bucket=bucket, name=file_path, metadata=metadata)

        expiration_seconds = expiration_minutes * 60  # Convert minutes to seconds
        signed_url = await blob.get_signed_url(
            expiration=expiration_seconds,
            http_method="GET",
            service_account_email=service_account_email,
        )

        logger.info(f"Generated signed URL: {signed_url}")
        return signed_url

    async def delete_chunks(self, session_id: str, total_chunks: int) -> None:
        # Sequential deletions to avoid rate limits
        for i in range(total_chunks):
            chunk_path = f"recordings/{session_id}/chunks/chunk_{i:04d}.webm"
            try:
                await self.storage.delete(
                    bucket=self.bucket_name,
                    object_name=chunk_path,
                )
            except Exception as e:
                # Log but don't fail if chunk already deleted
                logger.warning(f"Failed to delete chunk {chunk_path}: {e}")

    async def concatenate_groups_upload_final(
        self,
        session_id: str,
        output_filename: str = "final_audio.webm",
    ) -> str:
        prefix = f"recordings/{session_id}/groups/"

        objects = await self.storage.list_objects(
            bucket=self.bucket_name, params={"prefix": prefix}
        )

        group_files = []
        for obj in objects.get("items", []):
            name = obj["name"]
            if name.startswith(prefix) and name.endswith(".webm") and "group_" in name:
                group_files.append(name)

        if not group_files:
            logger.warning(f"No group files found for session {session_id}")
            return ""

        group_files.sort()

        logger.info(
            f"Starting concatenation for session {session_id} with {len(group_files)} group files: {group_files}"
        )

        temp_files = []
        temp_output_path = None

        try:
            for i, gcs_path in enumerate(group_files):
                try:
                    logger.info(
                        f"Downloading group file {i+1}/{len(group_files)}: {gcs_path}"
                    )
                    file_data = await self.download_single_chunk(gcs_path)

                    with tempfile.NamedTemporaryFile(
                        suffix=".webm", delete=False
                    ) as temp_file:
                        temp_file.write(file_data)
                        temp_files.append(temp_file.name)
                        logger.debug(f"Saved group to temp file: {temp_file.name}")

                except Exception as e:
                    logger.error(f"Failed to download group file {gcs_path}: {e}")
                    raise

            if not temp_files:
                raise ValueError("No group files were successfully downloaded")

            with tempfile.NamedTemporaryFile(
                suffix=".webm", delete=False
            ) as temp_output:
                temp_output_path = temp_output.name

            logger.info("Running ffmpeg concatenation in thread executor")
            loop = asyncio.get_event_loop()
            final_output_path = await loop.run_in_executor(
                self._audio_executor,
                _concatenate_webm_files,
                temp_files,
                temp_output_path,
            )
            logger.info("Groups concatenation completed")

            with open(final_output_path, "rb") as f:
                concatenated_data = f.read()

            output_gcs_path = f"recordings/{session_id}/final/{output_filename}"
            await self.storage.upload(
                bucket=self.bucket_name,
                object_name=output_gcs_path,
                file_data=concatenated_data,
                content_type="audio/webm",
            )

            logger.info(
                f"Successfully uploaded concatenated file to: {output_gcs_path}"
            )
            return output_gcs_path

        except Exception as e:
            logger.error(
                f"Failed to concatenate and upload group files for session {session_id}: {e}"
            )
            raise
        finally:
            for temp_file in temp_files:
                try:
                    if os.path.exists(temp_file):
                        os.unlink(temp_file)
                        logger.debug(f"Cleaned up temp file: {temp_file}")
                except Exception as cleanup_error:
                    logger.warning(
                        f"Failed to cleanup temp file {temp_file}: {cleanup_error}"
                    )

            if temp_output_path and os.path.exists(temp_output_path):
                try:
                    os.unlink(temp_output_path)
                    logger.debug(f"Cleaned up temp output file: {temp_output_path}")
                except Exception as cleanup_error:
                    logger.warning(
                        f"Failed to cleanup temp output file {temp_output_path}: {cleanup_error}"
                    )

    async def process_chunks_to_final_audio(
        self,
        session_id: str,
        output_filename: str = "final_audio.webm",
    ) -> str:
        logger.info(
            f"Starting complete audio processing pipeline for session {session_id}"
        )

        logger.info("Step 1: Processing chunks into groups")
        group_paths = await self.process_and_upload_groups(session_id)

        if not group_paths:
            logger.warning(f"No groups were created for session {session_id}")
            raise ValueError("Failed or empty audio file")

        logger.info(f"Successfully created {len(group_paths)} groups: {group_paths}")

        logger.info("Step 2: Concatenating groups into final audio")
        final_audio_path = await self.concatenate_groups_upload_final(
            session_id, output_filename
        )

        if not final_audio_path:
            logger.error(f"Failed to create final audio for session {session_id}")
            return ""

        logger.info(
            f"Successfully completed audio processing pipeline for session {session_id}: {final_audio_path}"
        )
        return final_audio_path
