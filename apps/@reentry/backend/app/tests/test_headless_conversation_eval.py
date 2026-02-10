import subprocess
from pathlib import Path

import pytest

# These tests use seed config files from seed_assessment_configs/
# The AssessmentFileLoader automatically checks both assessment_configs/ and
# seed_assessment_configs/ directories.
SEED_CONFIG_FILE = "UT-CCCI-v1.yaml"


@pytest.mark.integration
def test_headless_conversation_eval_use_sample_conversation():
    backend_dir = Path(__file__).parent.parent.parent

    result = subprocess.run(
        [
            "uv",
            "run",
            "python",
            "-m",
            "app.manage",
            "headless-conversation-eval",
            "--config_file_name",
            SEED_CONFIG_FILE,
            "--use-sample-conversation",
        ],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )

    print("\n=== STDOUT ===")
    print(result.stdout)
    print("\n=== STDERR ===")
    print(result.stderr)
    print(f"\n=== Return Code: {result.returncode} ===")

    assert "Status: success" in result.stdout, "Expected 'Status: success' in output"


@pytest.mark.integration
def test_headless_conversation_eval_use_failed_sample_conversation():
    backend_dir = Path(__file__).parent.parent.parent

    result = subprocess.run(
        [
            "uv",
            "run",
            "python",
            "-m",
            "app.manage",
            "headless-conversation-eval",
            "--config_file_name",
            SEED_CONFIG_FILE,
            "--use-sample-failed-conversation",
        ],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )

    print("\n=== STDOUT ===")
    print(result.stdout)
    print("\n=== STDERR ===")
    print(result.stderr)
    print(f"\n=== Return Code: {result.returncode} ===")

    assert (
        "Status: partial_success" in result.stdout
    ), "Expected 'Status: partial_success' in output"
    assert (
        "Conversation Error: API timeout error: OpenAI service unavailable after 3 retry attempts"
        in result.stdout
    ), "Expected conversation error message in output"


@pytest.mark.integration
@pytest.mark.skip(
    reason="Requires authentication to demo environment - run manually if needed."
)
def test_headless_conversation_eval_in_demo_env():
    backend_dir = Path(__file__).parent.parent.parent

    result = subprocess.run(
        [
            "uv",
            "run",
            "python",
            "-m",
            "app.manage",
            "headless-conversation-eval",
            "--config_file_name",
            SEED_CONFIG_FILE,
            "--client-pseudo-id",
            "p1234",
            "--environment",
            "demo",
        ],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )

    print("\n=== STDOUT ===")
    print(result.stdout)
    print("\n=== STDERR ===")
    print(result.stderr)
    print(f"\n=== Return Code: {result.returncode} ===")

    assert "Status: success" in result.stdout, "Expected 'Status: success' in output"


@pytest.mark.integration
@pytest.mark.skip(
    reason="Takes about 5 minutes to generate and evaluate a conversation."
)
def test_headless_conversation_eval_generate_conversation():
    backend_dir = Path(__file__).parent.parent.parent

    result = subprocess.run(
        [
            "uv",
            "run",
            "python",
            "-m",
            "app.manage",
            "headless-conversation-eval",
            "--config_file_name",
            SEED_CONFIG_FILE,
            "--generate-conversation",
        ],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )

    print("\n=== STDOUT ===")
    print(result.stdout)
    print("\n=== STDERR ===")
    print(result.stderr)
    print(f"\n=== Return Code: {result.returncode} ===")

    assert "Status: success" in result.stdout, "Expected 'Status: success' in output"
