import logging
import os
import re
import subprocess
from pathlib import Path
from typing import List, Optional

import imageio_ffmpeg as ffmpeg

SUPPORTED_FORMATS = {
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".flac",
    ".ogg",
    ".wma",
    ".opus",
    ".webm",
}
DEFAULT_SAMPLE_RATE = "48000"
DEFAULT_BITRATE = "128k"
DEFAULT_CHANNELS = "2"

logger = logging.getLogger(__name__)


class AudioConversionError(Exception):
    pass


def call_ffmpeg(args: List[str]) -> subprocess.CompletedProcess:
    ffmpeg_path = ffmpeg.get_ffmpeg_exe()
    cmd = [ffmpeg_path] + args

    logger.info(f"Running ffmpeg command: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        logger.debug(f"ffmpeg stdout: {result.stdout}")
        return result

    except subprocess.CalledProcessError as e:
        logger.error(f"ffmpeg failed: {e.stderr}")
        raise AudioConversionError(
            f"ffmpeg failed with code {e.returncode}: {e.stderr}"
        )
    except Exception as e:
        logger.error(f"Unexpected error running ffmpeg: {e}")
        raise AudioConversionError(f"Failed to run ffmpeg: {e}")


def is_supported_format(filename: str) -> bool:
    file_ext = Path(filename).suffix.lower()
    return file_ext in SUPPORTED_FORMATS


def get_audio_duration(input_path: str) -> float:
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if not is_supported_format(input_path):
        input_suffix = Path(input_path).suffix.lower()
        raise AudioConversionError(
            f"Unsupported input format: {input_suffix}. "
            f"Supported formats: {', '.join(sorted(SUPPORTED_FORMATS))}"
        )

    # Use ffmpeg with -f null to get duration from stderr output
    # ffmpeg with -f null always "fails" but outputs duration info in stderr
    # We need to catch the subprocess error and parse stderr
    args = ["-i", input_path, "-f", "null", "-"]

    ffmpeg_path = ffmpeg.get_ffmpeg_exe()
    cmd = [ffmpeg_path] + args

    try:
        result = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        stderr_output = result.stderr

        # Look for duration pattern in stderr
        # Parse duration from ffmpeg stderr output like "Duration: 00:00:10.23"
        duration_match = re.search(
            r"Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})", stderr_output
        )
        if duration_match:
            hours = int(duration_match.group(1))
            minutes = int(duration_match.group(2))
            seconds = int(duration_match.group(3))
            centiseconds = int(duration_match.group(4))

            total_seconds = hours * 3600 + minutes * 60 + seconds + centiseconds / 100.0
            duration = round(total_seconds, 1)
            logger.info(f"Audio duration: {duration} seconds")
            return duration
        else:
            raise AudioConversionError("Could not parse duration from ffmpeg output")

    except Exception as e:
        logger.error(f"Failed to get audio duration: {e}")
        raise AudioConversionError(f"Failed to get audio duration: {e}")


def prepare_opus_webm_args(
    input_path: str,
    output_path: str,
    sample_rate: str = DEFAULT_SAMPLE_RATE,
    bitrate: str = DEFAULT_BITRATE,
    channels: str = DEFAULT_CHANNELS,
    overwrite: bool = True,
    additional_args: Optional[List[str]] = None,
) -> List[str]:
    args = []

    if overwrite:
        args.append("-y")
    else:
        args.append("-n")

    args.extend(["-i", input_path])

    args.extend(
        [
            "-ar",
            sample_rate,
            "-ac",
            channels,
            "-c:a",
            "libopus",
            "-b:a",
            bitrate,
            "-vbr",
            "on",
            "-application",
            "audio",
            "-f",
            "webm",
        ]
    )

    if additional_args:
        args.extend(additional_args)

    args.append(output_path)

    logger.info(f"ffmpeg command arguments: {args}")
    return args


def convert_to_opus_webm(
    input_path: str,
    output_path: str,
    sample_rate: str = DEFAULT_SAMPLE_RATE,
    bitrate: str = DEFAULT_BITRATE,
    channels: str = DEFAULT_CHANNELS,
    overwrite: bool = True,
    additional_args: Optional[List[str]] = None,
) -> str:
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if not is_supported_format(input_path):
        input_suffix = Path(input_path).suffix.lower()
        raise AudioConversionError(
            f"Unsupported input format: {input_suffix}. "
            f"Supported formats: {', '.join(sorted(SUPPORTED_FORMATS))}"
        )

    if os.path.exists(output_path) and not overwrite:
        raise AudioConversionError(
            f"Output file already exists: {output_path}. "
            "Set overwrite=True to replace it."
        )

    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        raise AudioConversionError(f"Output directory does not exist: {output_dir}")

    ffmpeg_args = prepare_opus_webm_args(
        input_path=input_path,
        output_path=output_path,
        sample_rate=sample_rate,
        bitrate=bitrate,
        channels=channels,
        overwrite=overwrite,
        additional_args=additional_args,
    )

    try:
        call_ffmpeg(ffmpeg_args)

        if not os.path.exists(output_path):
            raise AudioConversionError("Output file was not created.")

        output_size = os.path.getsize(output_path)
        logger.info(f"Conversion successful: {output_path} ({output_size:,} bytes)")

        return output_path

    except Exception as e:
        logger.error(f"Failed to convert {input_path}: {e}")
        if output_path and os.path.exists(output_path):
            try:
                os.unlink(output_path)
                logger.debug(f"Cleaned up partial output file: {output_path}")
            except OSError as e:
                logger.warning(
                    f"Failed to clean up partial output file {output_path}: {e}"
                )
