"""Unit and integration tests for the guardrail-eval CLI."""

import json
import subprocess
from pathlib import Path
from unittest.mock import patch

import pytest

from app.manage.evaluate.guardrail_eval import (
    ReportEntry,
    _build_report_entry,
    _CategoryResult,
    _ExchangeEntry,
    _load_group,
    _resolve_output_path,
    _write_html_report_guardrail,
)
from app.manage.types import IntakeConversationData, IntakeSectionsData

BACKEND_DIR = Path(__file__).parent.parent.parent


# _load_group

_FAKE_CONFIG = {
    "eval_intake_groups": {
        "dev": [
            {
                "name": "My Group",
                "ids": ["aaa-111", "bbb-222"],
                "attrs_by_id": {
                    "aaa-111": {
                        "persona_name": "Alice",
                        "communication_style": "verbose",
                    },
                    "bbb-222": {"persona_name": "Bob"},
                },
            },
            {
                "name": "Empty Group",
                "ids": [],
            },
        ]
    }
}


def _patch_load_group(fake_config=_FAKE_CONFIG):
    return (
        patch("app.manage.evaluate.guardrail_eval.Path"),
        patch(
            "app.manage.evaluate.guardrail_eval.yaml.safe_load",
            return_value=fake_config,
        ),
    )


def test_load_group_returns_ids_and_attrs():
    with _patch_load_group()[0], _patch_load_group()[1]:
        ids, attrs = _load_group("My Group", "dev")

    assert ids == ["aaa-111", "bbb-222"]
    assert attrs["aaa-111"]["persona_name"] == "Alice"
    assert attrs["bbb-222"]["persona_name"] == "Bob"


def test_load_group_without_attrs_by_id():
    with _patch_load_group()[0], _patch_load_group()[1]:
        ids, attrs = _load_group("Empty Group", "dev")

    assert ids == []
    assert attrs == {}


def test_load_group_unknown_name_raises():
    with _patch_load_group()[0], _patch_load_group()[1]:
        with pytest.raises(ValueError, match="No group 'Missing'"):
            _load_group("Missing", "dev")


def test_load_group_unknown_environment_raises():
    with _patch_load_group()[0], _patch_load_group()[1]:
        with pytest.raises(ValueError, match="No group"):
            _load_group("My Group", "prod")


# _build_report_entry


def _make_rows(triggered: bool = False) -> list[_ExchangeEntry]:
    return [
        _ExchangeEntry(
            index=0,
            section="Housing",
            question="Where do you plan to live?",
            answer="With my sister.",
            triggered="llmaj:self-harm" if triggered else "",
            self_harm=_CategoryResult(
                result="llmaj:self-harm" if triggered else "",
                confidence=0.91 if triggered else 0.05,
                reasoning="Client expressed intent." if triggered else "No signal.",
            ),
            harm_to_others=_CategoryResult(
                result="", confidence=0.01, reasoning="No signal."
            ),
            prompt_injection=_CategoryResult(
                result="", confidence=0.0, reasoning="No manipulation attempt."
            ),
        )
    ]


def test_build_report_entry_uses_persona_name_from_attrs():
    conv = IntakeConversationData(
        client_pseudo_id="pseudo-abc",
        conversation_history=[],
    )
    entry = _build_report_entry(conv, _make_rows(), {"persona_name": "Alice"}, "db")

    assert entry["label"] == "Alice"
    assert entry["attrs"] == {"persona_name": "Alice"}


def test_build_report_entry_falls_back_to_pseudo_id():
    conv = IntakeConversationData(
        client_pseudo_id="pseudo-xyz-1234",
        conversation_history=[],
    )
    entry = _build_report_entry(conv, _make_rows(), {}, "generate")

    assert entry["label"].startswith("pseudo-xyz")


def test_build_report_entry_uses_sections_data_intake_id():
    conv = IntakeConversationData(
        client_pseudo_id="pseudo-abc",
        conversation_history=[],
        sections_data=IntakeSectionsData(intake_id="real-uuid-here", sections=[]),
    )
    entry = _build_report_entry(conv, _make_rows(), {}, "db")

    assert entry["id"] == "real-uuid-here"


def test_build_report_entry_triggered_count():
    conv = IntakeConversationData(client_pseudo_id="p", conversation_history=[])

    clean_entry = _build_report_entry(conv, _make_rows(triggered=False), {}, "db")
    assert clean_entry["triggered_count"] == 0
    assert clean_entry["any_triggered"] is False

    triggered_entry = _build_report_entry(conv, _make_rows(triggered=True), {}, "db")
    assert triggered_entry["triggered_count"] == 1
    assert triggered_entry["any_triggered"] is True


def test_build_report_entry_exchange_shape():
    conv = IntakeConversationData(client_pseudo_id="p", conversation_history=[])
    entry = _build_report_entry(conv, _make_rows(triggered=True), {}, "db")
    ex = entry["exchanges"][0]

    assert ex["section"] == "Housing"
    assert ex["question"] == "Where do you plan to live?"
    assert ex["answer"] == "With my sister."
    assert ex["triggered"] == "llmaj:self-harm"
    assert ex["self_harm"]["result"] == "llmaj:self-harm"
    assert ex["self_harm"]["confidence"] == pytest.approx(0.91)
    assert "No signal" in ex["harm_to_others"]["reasoning"]


# _resolve_output_path


def test_resolve_output_path_respects_override():
    path = _resolve_output_path("/tmp/out.html", "db", "some-id")
    assert path == Path("/tmp/out.html")


def test_resolve_output_path_auto_named_uses_html():
    path = _resolve_output_path(None, "generate", "UT-CCCI-v1.yaml")
    assert path.suffix == ".html"
    assert "generate" in path.name


def test_resolve_output_path_group_mode_slug():
    path = _resolve_output_path(None, "group", "Synthetic v1 Sampled")
    assert path.suffix == ".html"
    assert "group" in path.name


# _HTML_TEMPLATE_GUARDRAIL — JS field names must match _CategoryResult keys


def test_write_html_report_injects_category_fields(tmp_path):
    # _CategoryResult field names must appear in the rendered HTML as the CATEGORY_FIELDS
    # JS constant. If a field is added/renamed in _CategoryResult, it automatically
    # appears in all new reports — no template changes needed.
    entries: list[ReportEntry] = [
        {
            "id": "x",
            "label": "x",
            "attrs": {},
            "mode": "db",
            "message_count": 0,
            "triggered_count": 0,
            "any_triggered": False,
            "exchanges": [],
        }
    ]
    out = tmp_path / "r.html"
    _write_html_report_guardrail(entries, out)
    content = out.read_text()
    for field in _CategoryResult.__annotations__:
        assert f'"{field}"' in content, (
            f"Category field '{field}' not injected into HTML — "
            f"check _write_html_report_guardrail injects _CategoryResult.__annotations__"
        )


# _write_html_report_guardrail


def test_write_html_report_creates_file(tmp_path):
    entries = [
        {
            "id": "abc",
            "label": "Alice",
            "attrs": {"persona_name": "Alice"},
            "mode": "generate",
            "message_count": 1,
            "triggered_count": 0,
            "any_triggered": False,
            "exchanges": [],
        }
    ]
    out = tmp_path / "report.html"
    _write_html_report_guardrail(entries, out)

    assert out.exists()
    content = out.read_text()
    assert "<!DOCTYPE html>" in content
    assert "Alice" in content
    assert "Guardrail Eval" in content


# integration


@pytest.mark.integration
def test_guardrail_eval_quick_mode_clean_message():
    result = subprocess.run(
        [
            "uv",
            "run",
            "python",
            "-m",
            "app.manage",
            "guardrail-eval",
            "--mode",
            "quick",
            "--message",
            "I used to work at a grocery store, part-time.",
        ],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert "No guardrails triggered" in result.stdout


@pytest.mark.integration
def test_guardrail_eval_quick_mode_prints_confidence():
    result = subprocess.run(
        [
            "uv",
            "run",
            "python",
            "-m",
            "app.manage",
            "guardrail-eval",
            "--mode",
            "quick",
            "--message",
            "Everything is fine.",
        ],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert "confidence:" in result.stdout


# _build_report_entry — schema shape


def test_build_report_entry_exchange_field_names():
    # Guard against Python-side key name drift (e.g. confidence_score vs confidence).
    # The JS template reads cat.confidence, cat.result, and cat.reasoning — these must match.
    conv = IntakeConversationData(client_pseudo_id="p", conversation_history=[])
    entry = _build_report_entry(conv, _make_rows(triggered=True), {}, "db")
    ex = entry["exchanges"][0]

    for category_key in ("self_harm", "harm_to_others", "prompt_injection"):
        cat = ex[category_key]
        assert "result" in cat, f"{category_key} missing 'result'"
        assert (
            "confidence" in cat
        ), f"{category_key} missing 'confidence' (not 'confidence_score')"
        assert "reasoning" in cat, f"{category_key} missing 'reasoning'"


def test_build_report_entry_return_is_report_entry():
    conv = IntakeConversationData(client_pseudo_id="p", conversation_history=[])
    entry = _build_report_entry(conv, _make_rows(), {}, "db")

    required_keys = {
        "id",
        "label",
        "attrs",
        "mode",
        "message_count",
        "triggered_count",
        "any_triggered",
        "exchanges",
    }
    assert required_keys.issubset(entry.keys())


# _write_html_report_guardrail — field values embedded in output


def test_write_html_report_embeds_entry_data(tmp_path):
    entries: list[ReportEntry] = [
        {
            "id": "test-uuid-embed",
            "label": "Darnell",
            "attrs": {"persona_name": "Darnell", "persona_key": "trigger-self-harm"},
            "mode": "generate",
            "message_count": 1,
            "triggered_count": 1,
            "any_triggered": True,
            "exchanges": [
                {
                    "index": 0,
                    "section": "Housing",
                    "question": "Where will you live?",
                    "answer": "I have nowhere to go.",
                    "triggered": "llmaj:self-harm",
                    "self_harm": {
                        "result": "llmaj:self-harm",
                        "confidence": 0.93,
                        "reasoning": "expressed hopelessness",
                    },
                    "harm_to_others": {
                        "result": "",
                        "confidence": 0.01,
                        "reasoning": "no signal",
                    },
                    "prompt_injection": {
                        "result": "",
                        "confidence": 0.0,
                        "reasoning": "no attempt",
                    },
                }
            ],
        }
    ]
    out = tmp_path / "report.html"
    _write_html_report_guardrail(entries, out)
    content = out.read_text()

    assert "test-uuid-embed" in content
    assert "trigger-self-harm" in content  # persona_key embedded in attrs
    assert "0.93" in content  # confidence value
    assert "expressed hopelessness" in content
    assert "llmaj:self-harm" in content


def test_write_html_report_writes_json_sidecar(tmp_path):
    entries: list[ReportEntry] = [
        {
            "id": "sidecar-test",
            "label": "Alice",
            "attrs": {},
            "mode": "db",
            "message_count": 0,
            "triggered_count": 0,
            "any_triggered": False,
            "exchanges": [],
        }
    ]
    out = tmp_path / "report.html"
    _write_html_report_guardrail(entries, out)

    json_path = out.with_suffix(".json")
    assert (
        not json_path.exists()
    ), "sidecar is written by the CLI, not by _write_html_report_guardrail"


# integration — rerender mode


@pytest.mark.integration
def test_guardrail_eval_rerender_mode(tmp_path):
    entries = [
        {
            "id": "rerender-abc",
            "label": "Alice",
            "attrs": {"persona_name": "Alice", "persona_key": "baseline"},
            "mode": "generate",
            "message_count": 1,
            "triggered_count": 0,
            "any_triggered": False,
            "exchanges": [
                {
                    "index": 0,
                    "section": "Housing",
                    "question": "Where will you live?",
                    "answer": "With my sister.",
                    "triggered": "",
                    "self_harm": {
                        "result": "",
                        "confidence": 0.02,
                        "reasoning": "no signal",
                    },
                    "harm_to_others": {
                        "result": "",
                        "confidence": 0.01,
                        "reasoning": "no signal",
                    },
                    "prompt_injection": {
                        "result": "",
                        "confidence": 0.0,
                        "reasoning": "no attempt",
                    },
                }
            ],
        }
    ]
    json_file = tmp_path / "test_run.json"
    json_file.write_text(json.dumps(entries))
    html_file = tmp_path / "test_run.html"

    result = subprocess.run(
        [
            "uv",
            "run",
            "python",
            "-m",
            "app.manage",
            "guardrail-eval",
            "--mode",
            "rerender",
            "--input-file",
            str(json_file),
            "--output-file",
            str(html_file),
        ],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert html_file.exists()
    content = html_file.read_text()
    assert "Alice" in content
    assert "rerender-abc" in content


# fixtures schema validation


def test_fixtures_conform_to_intake_schema():
    fixtures_dir = Path(__file__).parent.parent / "manage/evaluate/fixtures"
    fixture_files = list(fixtures_dir.glob("*.json"))
    if not fixture_files:
        pytest.skip(
            "fixtures/ dir is empty — run: guardrail-eval --mode generate --save-fixture"
        )
    for fixture_file in fixture_files:
        data = json.loads(fixture_file.read_text())
        IntakeConversationData.model_validate(data)
