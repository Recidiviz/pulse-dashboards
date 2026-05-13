# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

"""Markdown preprocessing and HTML rendering for action plan PDFs."""

import html
import re

import markdown as markdown_lib
from pydantic import BaseModel, field_validator

_CSS_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{3,8}$")


class ResourceForPDF(BaseModel):
    name: str
    address: str | None = None
    phone: str | None = None
    website: str | None = None
    description: str | None = None
    subcategory: str | None = None
    travel_distance_miles: float | None = None
    is_digital: bool = False
    chip_bg: str | None = None
    chip_text: str | None = None

    @field_validator("chip_bg", "chip_text")
    @classmethod
    def validate_css_color(cls, v: str | None) -> str | None:
        if v is not None and not _CSS_HEX_COLOR_RE.match(v):
            raise ValueError(f"Invalid CSS color value: {v!r}")
        return v


_RE_LIST = re.compile(r"[ \t]*(?:\d+[.)]\s|[-*+]\s)")
_RE_HEADING = re.compile(r"#+\s")
_RE_INDENTED_CONT = re.compile(r"^ {2}\S")

_SVG_LOCATION = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13"'
    ' style="fill:#4a6170;vertical-align:middle;margin-right:4px;opacity:0.7;flex-shrink:0">'
    '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'
    "m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
    '"/></svg>'
)
_SVG_PHONE = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13"'
    ' style="fill:#4a6170;vertical-align:middle;margin-right:4px;opacity:0.7;flex-shrink:0">'
    '<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24'
    " 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17"
    " 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
    '"/></svg>'
)
_SVG_LANGUAGE = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13"'
    ' style="fill:#4a6170;vertical-align:middle;margin-right:4px;opacity:0.7;flex-shrink:0">'
    '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2z'
    "m6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2"
    " 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12"
    "s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25"
    " .78 2.45 1.38 3.56-1.84-.63-3.37-1.91-4.33-3.56zm2.95-8H5.08c.96-1.65 2.49-2.93"
    " 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82"
    "c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35"
    " .16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31"
    " 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2"
    ' 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>'
)


def markdown_to_html(text: str) -> str:
    md = markdown_lib.Markdown(extensions=["tables"], tab_length=2)
    return md.convert(text)


def _convert_unicode_bullets(text: str) -> str:
    result = []
    for line in text.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("•"):
            indent = " " * (len(line) - len(stripped))
            result.append(f"{indent}- {stripped[1:].lstrip()}")
        else:
            result.append(line)
    return "\n".join(result)


def _insert_blanks_before_lists(text: str) -> str:
    lines = []
    for line in text.splitlines():
        if lines:
            prev = lines[-1]
            if _RE_LIST.match(line) and prev.strip():
                prev_is_list = bool(_RE_LIST.match(prev))
                prev_is_heading = bool(_RE_HEADING.match(prev))
                if not prev_is_list and not prev_is_heading:
                    lines.append("")
                elif prev_is_list:
                    if len(line) - len(line.lstrip()) < len(prev) - len(prev.lstrip()):
                        lines.append("")
        lines.append(line)
    return "\n".join(lines)


def _insert_blanks_between_continuations(text: str) -> str:
    lines_in = text.splitlines()
    lines_out = []
    for i, line in enumerate(lines_in):
        lines_out.append(line)
        if i + 1 < len(lines_in):
            nxt = lines_in[i + 1]
            nxt_is_cont = bool(_RE_INDENTED_CONT.match(nxt)) and not bool(
                _RE_LIST.match(nxt)
            )
            cur_is_cont = bool(_RE_INDENTED_CONT.match(line)) and not bool(
                _RE_LIST.match(line)
            )
            if (
                nxt_is_cont
                and (cur_is_cont or bool(_RE_LIST.match(line)))
                and line.strip()
            ):
                lines_out.append("")
    return "\n".join(lines_out)


def preprocess_markdown_common(text: str) -> str:
    text = re.sub(r"\\\$", "$", text)
    text = "\n".join(line.rstrip() for line in text.splitlines())
    text = _convert_unicode_bullets(text)
    text = _insert_blanks_before_lists(text)
    text = _insert_blanks_between_continuations(text)
    return text


def _render_resources_html(
    resources: list[ResourceForPDF], section_title: str = ""
) -> str:
    if not resources:
        return ""
    cards = []
    for r in resources:
        chip_html = ""
        if r.subcategory:
            chip_style = ""
            if r.chip_bg and r.chip_text:
                chip_style = (
                    f' style="background-color:{r.chip_bg};color:{r.chip_text}"'
                )
            chip_html = (
                f'<span class="resource-subcategory"{chip_style}>'
                f"{html.escape(r.subcategory)}</span>"
            )
        digital_badge = ""
        if r.is_digital:
            badge_style = ""
            if r.chip_bg and r.chip_text:
                badge_style = (
                    f' style="background-color:{r.chip_bg};color:{r.chip_text}"'
                )
            digital_badge = (
                f'<span class="resource-digital-badge"{badge_style}>+ Digital</span>'
            )
        lines = [
            f'<div class="resource-name-row">'
            f'<span class="resource-name">{html.escape(r.name)}</span>'
            f"{chip_html}"
            f"{digital_badge}"
            f"</div>"
        ]
        if r.description:
            lines.append(
                f'<div class="resource-detail resource-description">'
                f"{html.escape(r.description)}</div>"
            )
        if r.address:
            lines.append(
                f'<div class="resource-detail">'
                f"{_SVG_LOCATION}{html.escape(r.address)}</div>"
            )
        if r.travel_distance_miles is not None:
            lines.append(
                f'<div class="resource-detail resource-distance">'
                f"{_SVG_LOCATION}{r.travel_distance_miles:.1f} mi away</div>"
            )
        if r.phone:
            lines.append(
                f'<div class="resource-detail">'
                f"{_SVG_PHONE}{html.escape(r.phone)}</div>"
            )
        if r.website:
            lines.append(
                f'<div class="resource-detail">'
                f"{_SVG_LANGUAGE}{html.escape(r.website)}</div>"
            )
        cards.append(f'<div class="resource-card">{"".join(lines)}</div>')
    title_html = (
        f'<div class="resource-section-title">{html.escape(section_title)} Resources</div>'
        if section_title
        else ""
    )
    return f'<div class="resource-section">{title_html}<div class="resource-list">{"".join(cards)}</div></div>'


# Fields the LLM should always bold and that it sometimes emits as bare continuation
# lines instead of bullet items. Adding a label here covers both behaviors.
_HIGHLIGHTED_FIELD_LABELS = ["Goal"]


def _promote_highlighted_field_continuations(text: str) -> str:
    # The LLM inconsistently formats highlighted fields like "Goal:" — sometimes as a
    # proper bullet item ("   * **Goal:** ...") and sometimes as a bare continuation
    # line ("     Goal: ...") with no bullet marker. Markdown parsers merge
    # continuations inline with the preceding bullet, so we promote them here.
    pattern = re.compile(
        r"\*{0,2}(?:"
        + "|".join(re.escape(label) for label in _HIGHLIGHTED_FIELD_LABELS)
        + r")\*{0,2}\s*:",
        re.IGNORECASE,
    )
    lines = []
    for line in text.splitlines():
        stripped = line.lstrip()
        indent = line[: len(line) - len(stripped)]
        if indent and stripped and pattern.match(stripped) and not _RE_LIST.match(line):
            lines.append(f"{indent}* {stripped}")
        else:
            lines.append(line)
    return "\n".join(lines)


def preprocess_action_plan_markdown(
    text: str,
    resources_by_section: dict[str, list[ResourceForPDF]] | None = None,
) -> str:
    text = preprocess_markdown_common(text)
    text = _promote_highlighted_field_continuations(text)
    text = re.sub(r"<annotations>.*?</annotations>", "", text, flags=re.DOTALL)
    text = re.sub(r"<resources>.*?</resources>", "", text, flags=re.DOTALL)

    def _replace_resource_bank(m: re.Match) -> str:
        title_match = re.search(r'section_title=["\']([^"\']*)["\']', m.group(0))
        if not title_match or not resources_by_section:
            return ""
        section = title_match.group(1)
        return _render_resources_html(resources_by_section.get(section, []), section)

    text = re.sub(
        r"<resourcebank\b[^/]*/?>", _replace_resource_bank, text, flags=re.IGNORECASE
    )
    text = re.sub(r"<notes>.*?</notes>", "", text, flags=re.DOTALL)
    text = re.sub(
        r"""<readonlylink[^>]*href=(["'])([^"']*)\1[^>]*>(.*?)</readonlylink>""",
        r"[\3](\2)",
        text,
        flags=re.DOTALL,
    )
    for label in _HIGHLIGHTED_FIELD_LABELS:
        text = re.sub(
            rf"\*{{0,2}}{re.escape(label)}\*{{0,2}}\s*:\*{{0,2}}", f"**{label}:**", text
        )
    return text
