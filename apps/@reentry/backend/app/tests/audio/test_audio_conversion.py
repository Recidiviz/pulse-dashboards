import os
import tempfile
from pathlib import Path

import pytest

from app.services.audio_converter import convert_to_opus_webm, get_audio_duration

test_data_directory = Path(__file__).parent.parent / "data" / "audio" / "conversion"


@pytest.mark.integration
def test_convert_to_opus_webm():
    input_file = test_data_directory / "sample-1.mp3"
    expected_output_file = test_data_directory / "sample-1-expected.webm"

    assert input_file.exists(), f"Input file not found: {input_file}"
    assert (
        expected_output_file.exists()
    ), f"Expected output file not found: {expected_output_file}"

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
        temp_output_path = temp_file.name

    try:
        result_path = convert_to_opus_webm(str(input_file), temp_output_path)
        result_file = Path(result_path)

        assert result_file.exists(), "Output file was not created"
        assert result_file.stat().st_size > 0, "Output file is empty"

        input_duration = get_audio_duration(str(input_file))
        output_duration = get_audio_duration(temp_output_path)
        assert (
            input_duration == output_duration
        ), f"Duration mismatch: input={input_duration}s, output={output_duration}s"

    finally:
        if os.path.exists(temp_output_path):
            os.unlink(temp_output_path)
