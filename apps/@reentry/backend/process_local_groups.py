#!/usr/bin/env python3
"""Process and generate groups from local existing chunks.

This script is based on RecordingService.process_and_upload_groups but works
with local files instead of Google Cloud Storage.

Usage:
    python process_local_groups.py <chunks_directory> <output_directory>

Example:
    python process_local_groups.py ./recordings/session123/chunks ./recordings/session123/groups
"""

import argparse
import logging
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import List

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Matroska/WebM signatures
EBML_MAGIC = b"\x1a\x45\xdf\xa3"
CLUSTER_MAGIC = b"\x1f\x43\xb6\x75"

# Audio encoding constants (from audio_converter)
DEFAULT_CHANNELS = "1"
DEFAULT_SAMPLE_RATE = "16000"
DEFAULT_BITRATE = "32k"


def call_ffmpeg(args: List[str]) -> None:
    """Call ffmpeg with the given arguments."""
    cmd = ["ffmpeg"] + args
    logger.debug(f"Running ffmpeg command: {' '.join(cmd)}")

    result = subprocess.run(cmd, capture_output=True, text=True, check=False)

    if result.returncode != 0:
        logger.error(f"ffmpeg failed with return code {result.returncode}")
        logger.error(f"ffmpeg stderr: {result.stderr}")
        raise RuntimeError(f"ffmpeg command failed: {result.stderr}")

    logger.debug("ffmpeg completed successfully")


def encode_audio_data(input_filename: str, output_filename: str) -> None:
    """Re-encode audio data using ffmpeg."""
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


def extract_timestamp_from_filename(file_path: str) -> int:
    """
    Extract timestamp from filename:
    - New format: chunk_1726847234567_0001.webm or chunk_1726847234567_0001_start.webm
    - Legacy format: chunk_0001.webm or chunk_0001_start.webm
    """
    try:
        filename = os.path.basename(file_path)

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


def process_local_groups(chunks_directory: str, output_directory: str) -> List[str]:
    """Process local chunks into groups using the new session-based approach.

    This mirrors RecordingService.process_and_upload_groups:
    1. Split chunks into recording sessions based on _start markers
    2. Extract EBML header once per session
    3. Split each session into groups of 100 chunks
    4. Reuse the session-specific EBML header for all groups

    Args:
        chunks_directory: Directory containing the chunk files
        output_directory: Directory where group files will be written

    Returns:
        List of paths to generated group files
    """
    chunks_dir = Path(chunks_directory)
    output_dir = Path(output_directory)

    if not chunks_dir.exists():
        raise ValueError(f"Chunks directory does not exist: {chunks_directory}")

    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)

    # List all chunk files
    chunk_files = [str(f) for f in chunks_dir.glob("chunk_*.webm")]

    if not chunk_files:
        logger.warning(f"No chunk files found in {chunks_directory}")
        return []

    logger.info(f"Found {len(chunk_files)} chunk files in {chunks_directory}")

    # Sort files by timestamp
    sorted_files = sorted(chunk_files, key=extract_timestamp_from_filename)

    # Split into recording sessions based on _start markers
    sessions = []
    current_session = []

    for file_path in sorted_files:
        filename = os.path.basename(file_path)
        if "_start" in filename and current_session:
            # New recording session started
            sessions.append(current_session)
            current_session = [file_path]
        else:
            current_session.append(file_path)

    if current_session:
        sessions.append(current_session)

    logger.info(f"Found {len(sessions)} recording sessions")

    generated_groups = []

    for session_idx, session_chunks in enumerate(sessions):
        logger.info(
            f"Processing session {session_idx} with {len(session_chunks)} chunks"
        )

        # Extract EBML header for THIS session
        with open(session_chunks[0], "rb") as f:
            first_chunk_data = f.read()

        if not first_chunk_data.startswith(EBML_MAGIC):
            logger.error(f"Session {session_idx} first chunk missing EBML header")
            continue

        cluster_index = first_chunk_data.find(CLUSTER_MAGIC)
        if cluster_index <= 0:
            logger.error(f"Session {session_idx} first chunk missing Cluster")
            continue

        ebml_header = first_chunk_data[:cluster_index]
        logger.info(
            f"Extracted EBML header ({len(ebml_header)} bytes) for session {session_idx}"
        )

        # Split this session into groups of 100 chunks
        session_groups = []
        for i in range(0, len(session_chunks), 100):
            session_groups.append(session_chunks[i : i + 100])

        logger.info(f"Session {session_idx}: created {len(session_groups)} groups")

        for group_idx, group_chunks in enumerate(session_groups):
            try:
                logger.info(
                    f"Processing session {session_idx}, group {group_idx} with {len(group_chunks)} chunks"
                )

                # Read chunks for this group
                downloaded: List[tuple[str, bytes]] = []
                for path in group_chunks:
                    with open(path, "rb") as f:
                        data = f.read()
                    downloaded.append((path, data))

                temp_concat_path = None
                temp_reencode_path = None
                try:
                    # Create temporary files for concatenation and re-encoding
                    with tempfile.NamedTemporaryFile(
                        suffix=".webm", delete=False
                    ) as temp_concat:
                        temp_concat_path = temp_concat.name

                    with tempfile.NamedTemporaryFile(
                        suffix=".webm", delete=False
                    ) as temp_reencode:
                        temp_reencode_path = temp_reencode.name

                    # Concatenate with session-specific EBML header
                    with open(temp_concat_path, "wb") as out_f:
                        # Write EBML header from this session
                        out_f.write(ebml_header)

                        # Write cluster data from all chunks
                        for j, (p, d) in enumerate(downloaded):
                            fname = os.path.basename(p)

                            if d.startswith(EBML_MAGIC):
                                # Strip EBML header, keep only clusters
                                ci = d.find(CLUSTER_MAGIC)
                                if ci > 0:
                                    d = d[ci:]
                                else:
                                    logger.warning(
                                        f"Skipping chunk without Cluster: {fname}"
                                    )
                                    continue

                            out_f.write(d)

                    # Re-encode with ffmpeg
                    global_group_idx = len(generated_groups)
                    logger.info(
                        f"Re-encoding group_{global_group_idx}.webm with ffmpeg"
                    )
                    encode_audio_data(temp_concat_path, temp_reencode_path)

                    # Generate final output path and copy re-encoded file
                    output_path = output_dir / f"group_{global_group_idx}.webm"
                    with open(temp_reencode_path, "rb") as f:
                        re_data = f.read()
                    with open(output_path, "wb") as f:
                        f.write(re_data)

                    generated_groups.append(str(output_path))
                    logger.info(
                        f"Uploaded session {session_idx} group {group_idx} "
                        f"(global index {global_group_idx}) to {output_path}"
                    )

                except Exception as e:
                    logger.error(
                        f"Failed to process session {session_idx} group {group_idx}: {e}"
                    )
                    raise
                finally:
                    # Clean up temporary files
                    try:
                        if temp_concat_path and os.path.exists(temp_concat_path):
                            os.unlink(temp_concat_path)
                        if temp_reencode_path and os.path.exists(temp_reencode_path):
                            os.unlink(temp_reencode_path)
                    except Exception as cleanup_error:
                        logger.warning(f"Failed to cleanup temp files: {cleanup_error}")

            except Exception as e:
                logger.error(
                    f"Failed to process session {session_idx} group {group_idx}: {e}"
                )
                raise

    logger.info(f"Successfully processed {len(generated_groups)} total groups")
    return generated_groups


def main():
    parser = argparse.ArgumentParser(
        description="Process local audio chunks into groups using ffmpeg re-encoding",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process chunks from a session directory
  python process_local_groups.py ./recordings/session123/chunks ./recordings/session123/groups

  # Process chunks with absolute paths
  python process_local_groups.py /path/to/chunks /path/to/output
        """,
    )
    parser.add_argument(
        "chunks_directory", help="Directory containing the chunk files (chunk_*.webm)"
    )
    parser.add_argument(
        "output_directory", help="Directory where group files will be written"
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose (debug) logging"
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        generated_groups = process_local_groups(
            args.chunks_directory, args.output_directory
        )

        if generated_groups:
            print(f"\nSuccessfully generated {len(generated_groups)} group files:")
            for group_path in generated_groups:
                print(f"  - {group_path}")
        else:
            print("\nNo groups were generated")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Failed to process local groups: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
