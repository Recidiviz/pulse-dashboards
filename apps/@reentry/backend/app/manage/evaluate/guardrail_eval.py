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

"""
Eval for the LLMAJ safety classifier.

Runs every client message in an intake through the current LLMAJ prompt (with its full
conversation context) and writes a self-contained HTML report showing result and reasoning
per message. Useful for validating prompt changes against known false positives and verifying
that trigger personas fire correctly (true-positive testing).

Evaluation stops at the first threshold-passing trigger per conversation — subsequent
messages are not evaluated, mirroring the hard-stop behavior in production. Low-confidence
model outputs (below the 0.80 production threshold) do not stop evaluation; they are
recorded in the report but the conversation continues to the next message.

Modes:
  quick     Test a single message inline. Prints results to the terminal.
  db        Fetch one or more real intakes from the database.
  generate  Synthesize a conversation with a simulated client persona.

DB mode options (mutually exclusive):
  --intake-id <uuid>           Single intake (repeatable for multiple)
  --intake-ids id1,id2,id3     Comma-separated list of intake UUIDs
  --client-pseudo-id <id>      Single intake by pseudo ID
  --group-name <name>          All intakes in a named group from eval_config.yaml

Personas (generate mode):
  --persona-key baseline                 Jordan Smith — clean, no triggers expected
  --persona-key trigger-self-harm        Darnell Washington — expresses suicidal ideation mid-conversation
  --persona-key trigger-harm-to-others   Angela Torres — expresses intent to harm ex-partner mid-conversation
  --persona-key trigger-prompt-injection Kevin Park — attempts multi-turn AI jailbreak

Usage:
    uv run python -m app.manage guardrail-eval --mode quick --message "I don't drink or use drugs"
    uv run python -m app.manage guardrail-eval --mode db --intake-id <uuid> [--environment pilot]
    uv run python -m app.manage guardrail-eval --mode db --intake-id <uuid1> --intake-id <uuid2>
    uv run python -m app.manage guardrail-eval --mode db --intake-ids id1,id2,id3,id4
    uv run python -m app.manage guardrail-eval --mode db --group-name "Synthetic v1 Sampled" --environment dev
    uv run python -m app.manage guardrail-eval --mode generate --config-file-name UT-CCCI-v1.yaml
    uv run python -m app.manage guardrail-eval --mode generate --config-file-name UT-CCCI-v1.yaml --persona-key trigger-self-harm
    uv run python -m app.manage guardrail-eval --mode generate --config-code CCCI --environment pilot
"""

import asyncio
import json
import re
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, TypedDict

import structlog
import yaml
from langchain_core.messages import AIMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langsmith import traceable
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from typer import Option

from app.core.config import langsmith_client, settings, tracer
from app.core.data_config.assessment_configs.loader import AssessmentFileLoader
from app.manage.base import cli
from app.manage.evaluate._html_utils import write_html_report
from app.manage.evaluate.headless_conversation_eval import (
    SAMPLE_PERSONAS,
    generate_client_conversation,
    get_assessment_config,
)
from app.manage.extract_intake_conversation import (
    fetch_conversation,
    fetch_conversation_by_intake_id,
    get_postgres_engine,
    to_environment,
)
from app.manage.types import IntakeConversationData
from app.models.assessment_config import AssessmentConfig, ConfigStatus
from app.utils.intake.conversation_graph import run_llmaj_safety_check
from app.utils.intake.prompts import LLMAJ_THRESHOLD_MAP, generate_llmaj_safety_prompt

logger = structlog.get_logger(__name__)


class _CategoryResult(TypedDict):
    result: str
    confidence: float
    reasoning: str


class _ExchangeEntry(TypedDict):
    index: int
    section: str
    question: str
    answer: str
    triggered: str
    self_harm: _CategoryResult
    harm_to_others: _CategoryResult
    prompt_injection: _CategoryResult


class ReportEntry(TypedDict):
    id: str
    label: str
    attrs: dict
    mode: str
    message_count: int
    triggered_count: int
    any_triggered: bool
    exchanges: list


_HTML_TEMPLATE_GUARDRAIL = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guardrail Eval</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; height: 100vh; overflow: hidden; }
    #root { display: flex; flex-direction: column; height: 100%; }
    header { background: #1a1a2e; color: #fff; padding: 14px 24px; display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    header h1 { font-size: 16px; font-weight: 600; flex: 1; }
    .run-label { font-size: 13px; font-weight: 400; opacity: .65; margin-left: 8px; }
    .run-label a { color: inherit; text-decoration: underline; text-underline-offset: 2px; opacity: .8; }
    .stat { font-size: 13px; opacity: .75; }
    .stat b { opacity: 1; }
    .badge { display: inline-block; padding: 2px 9px; border-radius: 10px; font-size: 11px; font-weight: 700; letter-spacing: .02em; }
    .clean { background: #d4edda; color: #155724; }
    .triggered { background: #f8d7da; color: #721c24; }
    .main-view { padding: 24px; flex: 1; overflow-y: auto; min-height: 0; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.07); }
    th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #999; padding: 10px 14px; text-align: left; border-bottom: 1px solid #eee; }
    td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr.intake-row { cursor: pointer; }
    tr.intake-row:hover td { background: #f8f8ff; }
    .attrs-chip { display: inline-block; background: #f0f0f5; color: #555; border-radius: 4px; padding: 2px 7px; font-size: 11px; }
    .triggered-list { font-size: 12px; font-family: monospace; color: #b00020; }
    .detail-view { display: none; flex: 1; overflow-y: auto; min-height: 0; }
    .detail-header { display: flex; align-items: center; gap: 10px; position: sticky; top: 0; z-index: 10; background: #f5f5f5; padding: 16px 24px; border-bottom: 1px solid #e8e8e8; }
    .back-btn { background: none; border: 1px solid #ccc; border-radius: 5px; padding: 5px 12px; font-size: 13px; cursor: pointer; color: #555; }
    .back-btn:hover { background: #f0f0f0; }
    .nav-btn { background: none; border: 1px solid #ccc; border-radius: 5px; padding: 5px 10px; font-size: 13px; cursor: pointer; color: #555; }
    .nav-btn:hover:not(:disabled) { background: #f0f0f0; }
    .nav-btn:disabled { opacity: .35; cursor: default; }
    .detail-title-group { flex: 1; min-width: 0; }
    .detail-title { font-size: 15px; font-weight: 600; }
    .detail-meta { font-size: 11px; color: #aaa; margin-top: 2px; font-family: monospace; }
    .detail-attrs { font-size: 12px; color: #888; }
    .exchange { background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 14px; margin-bottom: 10px; }
    .exchange.is-triggered { border-color: #f5a0a8; background: #fde8e8; }
    .ex-section { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #aaa; margin-bottom: 6px; }
    .ex-q { font-size: 13px; color: #666; padding-left: 10px; border-left: 2px solid #ccc; margin-bottom: 7px; }
    .ex-a { font-size: 13px; color: #222; padding-left: 10px; border-left: 2px solid #1a1a2e; margin-bottom: 9px; }
    .msg-role { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #aaa; display: block; margin-bottom: 3px; }
    .trigger-badge { margin-bottom: 8px; }
    .reasoning-block { margin-top: 9px; border-top: 1px solid #eee; padding-top: 9px; }
    .category { margin-bottom: 8px; }
    .category:last-child { margin-bottom: 0; }
    .cat-name { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #777; margin-bottom: 4px; }
    .cat-field { font-size: 11px; font-family: monospace; margin-bottom: 2px; color: #888; padding-left: 12px; }
    .cat-field .field-name { color: #999; }
    .cat-field.fired .field-value { color: #b00020; font-weight: 700; }
    .delta-tag { display: inline-block; border-radius: 4px; font-size: 11px; font-weight: 500; padding: 2px 8px; margin-top: 5px; }
    .delta-tag-cleared { background: #d4edda; color: #155724; border: 1px solid #b7dfca; }
    .delta-tag-new { background: #f8d7da; color: #721c24; border: 1px solid #f1b0b7; }
    .delta-tag-changed { background: #fff3cd; color: #856404; border: 1px solid #ffe08a; }
    .row-changes { font-size: 11px; display: flex; flex-wrap: wrap; gap: 4px; }
    .cat-reasoning-text { font-size: 12px; color: #555; line-height: 1.55; }
    #detail-content { padding: 16px 24px 24px; }
    .prompt-drawer { background: #fff; border-bottom: 1px solid #e0e0e0; flex-shrink: 0; }
    .prompt-drawer > summary { padding: 7px 24px; font-size: 11px; color: #555; cursor: pointer; user-select: none; list-style: none; display: flex; align-items: center; gap: 6px; }
    .prompt-drawer > summary::-webkit-details-marker { display: none; }
    .prompt-drawer > summary::before { content: '▶'; font-size: 9px; transition: transform .15s; }
    .prompt-drawer[open] > summary::before { transform: rotate(90deg); }
    .prompt-drawer > summary:hover { background: #f8f8f8; color: #222; }
    .prompt-pre { margin: 0; padding: 16px 0; font-size: 11px; font-family: monospace; line-height: 1.65; border-top: 1px solid #eee; max-height: 55vh; overflow-y: auto; background: #fafafa; }
    .diff-line { display: block; white-space: pre-wrap; padding: 1px 24px; }
    .diff-add  { background: #e6ffec; color: #1a7f37; }
    .diff-rm   { background: #ffebe9; color: #cf222e; }
    .diff-same { color: #444; }
    .stat-add  { color: #1a7f37; font-weight: 600; }
    .stat-rm   { color: #cf222e; font-weight: 600; }
  </style>
</head>
<body>
<div id="root"></div>
<script>
const DATA = __DATA__;
const CATEGORY_FIELDS = __CATEGORY_FIELDS__;
const PROMPT = __PROMPT__;
const PREV_PROMPT = __PREV_PROMPT__;
const PREV_PROMPT_SOURCE = __PREV_PROMPT_SOURCE__;
const PREV_DATA_MAP = __PREV_DATA_MAP__;
const RUN_LABEL = __RUN_LABEL__;
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function computeDiff(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m + 1}, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const out = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) { out.unshift({t:'same', s:a[i-1]}); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { out.unshift({t:'add', s:b[j-1]}); j--; }
    else { out.unshift({t:'rm', s:a[i-1]}); i--; }
  }
  return out;
}
function renderPromptDiff(diff, curr) {
  const lines = diff || curr.split('\\n').map(s => ({t: 'same', s}));
  return lines.map(l => {
    const pfx = l.t === 'add' ? '+ ' : l.t === 'rm' ? '- ' : '  ';
    return `<span class="diff-line diff-${l.t}">${esc(pfx + l.s)}</span>`;
  }).join('');
}
const _diff = PREV_PROMPT ? computeDiff(PREV_PROMPT.split('\\n'), PROMPT.split('\\n')) : null;
const _sourceLabel = PREV_PROMPT_SOURCE === 'main' ? 'vs main' : 'vs prev run';
const _diffStats = _diff
  ? ` &mdash; <span class="stat-add">+${_diff.filter(l=>l.t==='add').length}</span> / <span class="stat-rm">-${_diff.filter(l=>l.t==='rm').length}</span> lines (${_sourceLabel})`
  : '';
const totalTriggered = DATA.filter(d => d.any_triggered).length;
const totalClean = DATA.length - totalTriggered;
const totalMessages = DATA.reduce((sum, d) => sum + d.message_count, 0);
document.getElementById('root').innerHTML = `
<header>
  <h1>Guardrail Eval${RUN_LABEL ? ` <span class="run-label">${esc(RUN_LABEL.text || RUN_LABEL)}${RUN_LABEL.hash ? ` · ${RUN_LABEL.url ? `<a href="${esc(RUN_LABEL.url)}" target="_blank">${esc(RUN_LABEL.hash)}</a>` : esc(RUN_LABEL.hash)}${RUN_LABEL.branch ? ` (${RUN_LABEL.branch_url ? `<a href="${esc(RUN_LABEL.branch_url)}" target="_blank">${esc(RUN_LABEL.branch)}</a>` : esc(RUN_LABEL.branch)})` : ''}` : ''}</span>` : ''}</h1>
  <span class="stat"><b>${DATA.length}</b> conversation${DATA.length !== 1 ? 's' : ''}</span>
  <span class="stat"><b style="color:#8bc34a">${totalClean}</b> clean</span>
  <span class="stat"><b style="color:#ef9a9a">${totalTriggered}</b> triggered</span>
  <span class="stat"><b>${totalMessages}</b> message${totalMessages !== 1 ? 's' : ''} analyzed</span>
</header>
<details class="prompt-drawer">
  <summary>LLMAJ prompt &mdash; ${PROMPT.length.toLocaleString()} chars${_diffStats}</summary>
  <div class="prompt-pre">${renderPromptDiff(_diff, PROMPT)}</div>
</details>
<div class="main-view" id="main-view">
  <table>
    <thead>
      <tr>
        <th>Status</th><th>Label</th><th>Attrs</th><th>Messages</th><th>Triggered</th>${PREV_DATA_MAP ? '<th>Changes vs prior run</th>' : ''}
      </tr>
    </thead>
    <tbody id="intake-table"></tbody>
  </table>
</div>
<div class="detail-view" id="detail-view">
  <div class="detail-header">
    <button class="back-btn" onclick="showMain()">&#8592; Back</button>
    <button class="nav-btn" id="prev-btn" onclick="navigate(-1)">&#8592;</button>
    <button class="nav-btn" id="next-btn" onclick="navigate(1)">&#8594;</button>
    <div class="detail-title-group"><div class="detail-title" id="detail-title"></div><div class="detail-meta" id="detail-meta"></div></div>
    <span class="detail-attrs" id="detail-attrs"></span>
  </div>
  <div id="detail-content"></div>
</div>`;
function triggerDelta(label, exchanges) {
  if (!PREV_DATA_MAP || !PREV_DATA_MAP[label]) return [];
  const prev = PREV_DATA_MAP[label];
  const changes = [];
  exchanges.forEach(ex => {
    const p = prev[String(ex.index)] ?? null;
    const c = ex.triggered || '';
    if (p === null || p === c) return;
    const pLabel = p || 'clean';
    const cLabel = c || 'clean';
    if (!p && c) changes.push({type:'new', text:`msg ${ex.index+1}: clean → ${cLabel}`});
    else if (p && !c) changes.push({type:'cleared', text:`msg ${ex.index+1}: ${pLabel} → clean`});
    else changes.push({type:'changed', text:`msg ${ex.index+1}: ${pLabel} → ${cLabel}`});
  });
  return changes;
}
let currentIdx = 0;
document.getElementById('intake-table').innerHTML = DATA.map((d, i) => {
  const attrsText = Object.values(d.attrs || {}).filter(v => v && v !== 'n/a').slice(0, 3).join(' \xb7 ');
  const triggeredIds = d.exchanges.filter(e => e.triggered).map(e => e.triggered);
  const triggeredText = [...new Set(triggeredIds)].join(', ') || '—';
  const changes = triggerDelta(d.label, d.exchanges);
  const changesHtml = PREV_DATA_MAP
    ? `<td>${changes.length ? `<div class="row-changes">${changes.map(ch => `<span class="delta-tag delta-tag-${ch.type}">${esc(ch.text)}</span>`).join('')}</div>` : '<span style="color:#ccc">—</span>'}</td>`
    : '';
  return `<tr class="intake-row" onclick="showDetail(${i})">
    <td><span class="badge ${d.any_triggered ? 'triggered' : 'clean'}">${d.any_triggered ? 'TRIGGERED' : 'CLEAN'}</span></td>
    <td>${esc(d.label)}</td>
    <td>${attrsText ? `<span class="attrs-chip">${esc(attrsText)}</span>` : '<span style="color:#ccc">—</span>'}</td>
    <td>${d.message_count}</td>
    <td class="triggered-list">${esc(triggeredText)}</td>
    ${changesHtml}
  </tr>`;
}).join('');
function renderCategory(name, cat) {
  const fields = CATEGORY_FIELDS.map(field => {
    const val = cat[field];
    const isNull = val == null;
    const isFired = val === true;
    const displayVal = isNull ? 'null' : (typeof val === 'boolean' ? String(val) : esc(String(val)));
    const valueHtml = (!isNull && typeof val === 'string' && val.length > 60)
      ? `<span class="cat-reasoning-text">${displayVal}</span>`
      : `<span class="field-value">${displayVal}</span>`;
    return `<div class="cat-field${isFired ? ' fired' : ''}"><span class="field-name">${field}: </span>${valueHtml}</div>`;
  }).join('');
  return `<div class="category"><div class="cat-name">${name}</div>${fields}</div>`;
}
function showMain() {
  document.getElementById('main-view').style.display = '';
  document.getElementById('detail-view').style.display = 'none';
  document.getElementById('detail-view').scrollTop = 0;
}
function showDetail(idx) {
  currentIdx = idx;
  const d = DATA[idx];
  document.getElementById('main-view').style.display = 'none';
  document.getElementById('detail-view').style.display = 'block';
  document.getElementById('detail-view').scrollTop = 0;
  document.getElementById('prev-btn').disabled = idx === 0;
  document.getElementById('next-btn').disabled = idx === DATA.length - 1;
  const attrsEntries = Object.entries(d.attrs || {}).filter(([, v]) => v && v !== 'n/a');
  const attrsText = attrsEntries.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' \xb7 ');
  document.getElementById('detail-title').textContent = d.label;
  const metaParts = [];
  if (d.id && d.id !== d.label) metaParts.push(d.id);
  if (d.attrs && d.attrs.persona_key) metaParts.push('key: ' + d.attrs.persona_key);
  document.getElementById('detail-meta').textContent = metaParts.join(' \xb7 ');
  const distinctTriggered = [...new Set(d.exchanges.filter(e => e.triggered).flatMap(e => e.triggered.split('|')))];
  let attrsHtml = `${d.message_count} messages \xb7 ${d.triggered_count} triggered`;
  if (distinctTriggered.length > 0) {
    attrsHtml += ': ' + distinctTriggered.map(t => `<span style="color:#b00020;font-weight:700;font-family:monospace">${esc(t)}</span>`).join(', ');
  }
  if (attrsText) attrsHtml += ` \xb7 ${esc(attrsText)}`;
  document.getElementById('detail-attrs').innerHTML = attrsHtml;
  let html = '';
  d.exchanges.forEach((ex, i) => {
    const cats = [
      ['Self-harm', ex.self_harm],
      ['Harm to others', ex.harm_to_others],
      ['Prompt injection', ex.prompt_injection],
    ];
    const prevTriggered = PREV_DATA_MAP && PREV_DATA_MAP[d.label]
      ? (PREV_DATA_MAP[d.label][String(ex.index)] ?? null)
      : null;
    let deltaBadge = '';
    if (prevTriggered !== null && prevTriggered !== (ex.triggered || '')) {
      const p = prevTriggered || 'clean';
      const c = ex.triggered || 'clean';
      const dtype = !prevTriggered ? 'new' : !ex.triggered ? 'cleared' : 'changed';
      deltaBadge = `<div><span class="delta-tag delta-tag-${dtype}">was: ${esc(p)} → now: ${esc(c)}</span></div>`;
    }
    html += `<div class="exchange${ex.triggered ? ' is-triggered' : ''}">
      <div class="ex-section">${esc(ex.section)}</div>
      ${ex.question ? `<div class="ex-q"><span class="msg-role">Chatbot</span>${esc(ex.question)}</div>` : ''}
      ${ex.answer ? `<div class="ex-a"><span class="msg-role">Client</span>${esc(ex.answer)}</div>` : ''}
      ${ex.triggered ? `<div class="trigger-badge"><span class="badge triggered">${esc(ex.triggered)}</span></div>` : ''}
      ${deltaBadge}
      ${ex.answer ? `<div class="reasoning-block">${cats.map(([name, cat]) => renderCategory(name, cat)).join('')}</div>` : ''}
    </div>`;
  });
  document.getElementById('detail-content').innerHTML = html;
}
function navigate(dir) {
  const next = currentIdx + dir;
  if (next >= 0 && next < DATA.length) showDetail(next);
}
document.addEventListener('keydown', e => {
  if (document.getElementById('detail-view').style.display !== 'block') return;
  if (e.key === 'Escape') showMain();
  if (e.key === 'ArrowLeft') navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});
</script>
</body>
</html>
"""


@cli.command(name="guardrail-eval")
async def guardrail_eval(
    mode: str = Option(
        ...,
        "--mode",
        help="Conversation source: quick | db | generate",
    ),
    message: Optional[str] = Option(
        None,
        "--message",
        help="Single message to evaluate inline (quick mode)",
    ),
    intake_ids: Optional[List[str]] = Option(
        None,
        "--intake-id",
        help="UUID of an intake to evaluate (db mode, repeatable for multiple)",
    ),
    intake_ids_csv: Optional[str] = Option(
        None,
        "--intake-ids",
        help="Comma-separated intake UUIDs (db mode), e.g. --intake-ids id1,id2,id3",
    ),
    client_pseudo_id: Optional[str] = Option(
        None,
        "--client-pseudo-id",
        help="Client pseudo ID to look up intake (db mode)",
    ),
    group_name: Optional[str] = Option(
        None,
        "--group-name",
        help="Eval group name from eval_config.yaml (db mode)",
    ),
    config_file_name: Optional[str] = Option(
        None,
        "--config-file-name",
        help="Local assessment config YAML filename, e.g. UT-CCCI-v1.yaml (generate mode)",
    ),
    config_code: Optional[str] = Option(
        None,
        "--config-code",
        help="Assessment config code to load from the DB, e.g. UT-CCCI (generate mode)",
    ),
    environment: str = Option(
        "local",
        "--environment",
        help="Database environment: local | dev | demo | staging | pilot | prod",
    ),
    output_file: Optional[str] = Option(
        None,
        "--output-file",
        help="HTML output path (auto-named if omitted)",
    ),
    persona_name: Optional[str] = Option(
        None,
        "--persona-name",
        help="Persona to use by name, e.g. 'Jordan Smith' (generate mode)",
    ),
    persona_key: Optional[str] = Option(
        None,
        "--persona-key",
        help="Persona key (generate mode). Available: baseline, trigger-self-harm, trigger-self-harm-veiled, trigger-self-harm-harm-to-others, trigger-harm-to-others, trigger-harm-to-others-distributed, trigger-prompt-injection, trigger-prompt-injection-gradual, clean-cooperative, clean-frustrated, clean-avoidant",
    ),
    save_fixture: bool = Option(
        False,
        "--save-fixture",
        help="Save the raw conversation to fixtures/<persona-key>.json for use with fixture mode (generate mode)",
    ),
    fixtures_dir: Optional[str] = Option(
        None,
        "--fixtures-dir",
        help="Directory of fixture JSON files (fixture mode, defaults to evaluate/fixtures/)",
    ),
    input_file: Optional[str] = Option(
        None,
        "--input-file",
        help="Path to a .json sidecar or .html from a previous run (rerender mode)",
    ),
) -> None:
    """
    Run the LLMAJ safety classifier against every client message in an intake and write
    a self-contained HTML report with result and reasoning per message.

    QUICK MODE — test a single message, no file:
        uv run python -m app.manage guardrail-eval \\
            --mode quick --message "I don't drink or use drugs"

    DB MODE — single intake:
        uv run python -m app.manage guardrail-eval \\
            --mode db --intake-id <uuid> --environment pilot

    DB MODE — multiple intakes:
        uv run python -m app.manage guardrail-eval \\
            --mode db --intake-id <uuid1> --intake-id <uuid2> --environment pilot

    DB MODE — comma-separated intake IDs:
        uv run python -m app.manage guardrail-eval \\
            --mode db --intake-ids id1,id2,id3,id4 --environment pilot

    DB MODE — named group from eval_config.yaml:
        uv run python -m app.manage guardrail-eval \\
            --mode db --group-name "Synthetic v1 Sampled" --environment dev

    GENERATE MODE — synthesize a conversation from a local YAML:
        uv run python -m app.manage guardrail-eval \\
            --mode generate --config-file-name UT-CCCI-v1.yaml

    GENERATE MODE — synthesize using a guardrail trigger persona:
        uv run python -m app.manage guardrail-eval \\
            --mode generate --config-file-name UT-CCCI-v1.yaml --persona-key trigger-harm-to-others

    RERENDER MODE — re-render a previous run's HTML from its .json sidecar (no LLMAJ calls):
        uv run python -m app.manage guardrail-eval \\
            --mode rerender --input-file guardrail_eval_group_Default_20260520.json

    FIXTURE MODE — run fresh LLMAJ eval against saved fixture conversations:
        uv run python -m app.manage guardrail-eval \\
            --mode fixture --group-name golden-triggers
        uv run python -m app.manage guardrail-eval \\
            --mode fixture --group-name golden-clean

    GENERATE + SAVE FIXTURE — generate a conversation and save it for future fixture runs:
        uv run python -m app.manage guardrail-eval \\
            --mode generate --config-file-name UT-CCCI-v1.yaml --persona-key trigger-self-harm --save-fixture
    """
    if intake_ids_csv:
        intake_ids = (intake_ids or []) + [
            i.strip() for i in intake_ids_csv.split(",") if i.strip()
        ]

    if mode not in ("db", "fixture", "generate", "quick", "rerender"):
        print(
            "Error: --mode must be 'quick', 'db', 'generate', 'fixture', or 'rerender'"
        )
        sys.exit(1)

    if mode == "quick" and not message:
        print("Error: quick mode requires --message")
        sys.exit(1)

    if mode == "db":
        has_single = intake_ids or client_pseudo_id
        if not has_single and not group_name:
            print(
                "Error: db mode requires --intake-id, --client-pseudo-id, or --group-name"
            )
            sys.exit(1)
        if group_name and has_single:
            print(
                "Error: --group-name is mutually exclusive with --intake-id and --client-pseudo-id"
            )
            sys.exit(1)

    if mode == "generate" and not config_file_name and not config_code:
        print("Error: generate mode requires --config-file-name or --config-code")
        sys.exit(1)

    if mode == "fixture" and not group_name:
        print("Error: fixture mode requires --group-name")
        sys.exit(1)

    if mode == "rerender":
        if not input_file:
            print("Error: rerender mode requires --input-file <path-to-.json or .html>")
            sys.exit(1)
        input_path = Path(input_file)
        rerender_run_label: Optional[str] = None
        if input_path.suffix == ".html":
            match = re.search(
                r"^const DATA = (.+);$", input_path.read_text(), re.MULTILINE
            )
            if not match:
                print("Error: could not find embedded DATA in HTML file")
                sys.exit(1)
            entries = json.loads(match.group(1).replace("<\\/script>", "</script>"))
            prompt_override = None
            prev_prompt_override = None
            prev_prompt_source_override = None
            default_out = input_path.with_stem(
                input_path.stem + "_rerendered"
            ).with_suffix(".html")
        else:
            raw = json.loads(input_path.read_text())
            if isinstance(raw, dict):
                entries = raw["data"]
                prompt_override = raw.get("prompt")
                prev_prompt_override = raw.get("diff_prompt") or raw.get("prev_prompt")
                prev_prompt_source_override = raw.get("diff_source") or raw.get(
                    "prev_prompt_source"
                )
                rerender_run_label = raw.get("run_label")
            else:
                entries = raw
                prompt_override = None
                prev_prompt_override = None
                prev_prompt_source_override = None
            default_out = input_path.with_suffix(".html")
        html_path = Path(output_file) if output_file else default_out
        _write_html_report_guardrail(
            entries,
            html_path,
            prompt_override=prompt_override,
            prev_prompt_override=prev_prompt_override,
            prev_prompt_source_override=prev_prompt_source_override,
            run_label=rerender_run_label,
        )
        print(f"Wrote {len(entries)} conversation(s) to {html_path}")
        return

    if mode == "fixture":
        fixtures_root = (
            Path(fixtures_dir) if fixtures_dir else Path(__file__).parent / "fixtures"
        )
        fixture_cfg = _load_fixture_group(group_name, fixtures_root)
        conv_attrs_pairs = []
        for fixture_path, attrs in fixture_cfg:
            conv = IntakeConversationData.model_validate(
                json.loads(fixture_path.read_text())
            )
            conv_attrs_pairs.append((conv, attrs))
        output_slug = group_name
        output_mode = "fixture"
        if not conv_attrs_pairs:
            print(f"Error: no fixtures loaded for group '{group_name}'")
            sys.exit(1)
        model = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
            model=settings.LLMAJ_SAFETY_MODEL_NAME,
            temperature=0,
        )
        entries = list(
            await asyncio.gather(
                *[
                    _process_conversation(model, conv, attrs, output_mode)
                    for conv, attrs in conv_attrs_pairs
                ]
            )
        )
        html_path = _resolve_output_path(output_file, output_mode, output_slug)
        current_prompt = generate_llmaj_safety_prompt().content
        glob_pat = html_path.stem[:-15] + "*.json"
        most_recent_prompt, prev_data, last_changed = _find_prev_run(
            html_path.parent, glob_pat, current_prompt
        )
        if last_changed:
            diff_prompt, diff_source = last_changed, "run"
        elif (mp := _get_original_prompt_from_main()) and mp != current_prompt:
            diff_prompt, diff_source = mp, "main"
        else:
            diff_prompt, diff_source = None, None
        fixture_run_label = f"fixture · {group_name}"
        _write_html_report_guardrail(
            entries,
            html_path,
            prev_prompt_override=diff_prompt,
            prev_prompt_source_override=diff_source,
            prev_data_override=prev_data,
            run_label=fixture_run_label,
        )
        json_path = html_path.with_suffix(".json")
        json_path.write_text(
            json.dumps(
                {
                    "prompt": current_prompt,
                    "prev_prompt": most_recent_prompt,
                    "diff_prompt": diff_prompt,
                    "diff_source": diff_source,
                    "run_label": fixture_run_label,
                    "data": entries,
                },
                indent=2,
            )
        )
        total_triggered = sum(e["triggered_count"] for e in entries)
        total_messages = sum(e["message_count"] for e in entries)
        print(
            f"\nWrote {len(entries)} conversation(s) to {html_path}"
            f"\nJSON sidecar: {json_path}"
            f"\nOverall: {total_triggered}/{total_messages} messages triggered"
        )
        return

    model = ChatOpenAI(
        openai_api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL,
        model=settings.LLMAJ_SAFETY_MODEL_NAME,
        temperature=0,
    )

    if mode == "quick":
        await _evaluate_single_message(model, message)
        return

    if mode == "db":
        if group_name:
            conv_attrs_pairs = await _fetch_group_conversations(group_name, environment)
            output_slug = group_name
            output_mode = "group"
        else:
            conv_attrs_pairs = []
            for iid in intake_ids or []:
                conv = await _fetch_single_db_conversation(iid, None, environment)
                if conv and conv.error:
                    print(f"  Skipping {iid}: {conv.error}")
                elif conv:
                    conv_attrs_pairs.append((conv, {}))
            if client_pseudo_id:
                conv = await _fetch_single_db_conversation(
                    None, client_pseudo_id, environment
                )
                if conv and conv.error:
                    print(f"  Skipping {client_pseudo_id}: {conv.error}")
                elif conv:
                    conv_attrs_pairs.append((conv, {}))
            output_slug = (intake_ids or [client_pseudo_id or ""])[0]
            output_mode = "db"
    else:
        conversation, persona_attrs = await _generate_conversation(
            config_file_name=config_file_name,
            config_code=config_code,
            environment=environment,
            persona_name=persona_name,
            persona_key=persona_key,
        )
        if save_fixture:
            fixtures_root = Path(__file__).parent / "fixtures"
            fixtures_root.mkdir(exist_ok=True)
            fixture_key = persona_attrs.get("persona_key") or "unknown"
            fixture_path = fixtures_root / f"{fixture_key}.json"
            fixture_path.write_text(conversation.model_dump_json(indent=2))
            print(f"  Saved fixture: {fixture_path}")
        conv_attrs_pairs = [(conversation, persona_attrs)]
        output_slug = config_code or config_file_name or "synthetic"
        output_mode = "generate"

    if not conv_attrs_pairs:
        print("Error: could not fetch or generate any conversations.")
        sys.exit(1)

    entries = list(
        await asyncio.gather(
            *[
                _process_conversation(model, conv, attrs, output_mode)
                for conv, attrs in conv_attrs_pairs
            ]
        )
    )

    html_path = _resolve_output_path(output_file, output_mode, output_slug)
    current_prompt = generate_llmaj_safety_prompt().content
    glob_pat = html_path.stem[:-15] + "*.json"
    most_recent_prompt, prev_data, last_changed = _find_prev_run(
        html_path.parent, glob_pat, current_prompt
    )
    if last_changed:
        diff_prompt, diff_source = last_changed, "run"
    elif (mp := _get_original_prompt_from_main()) and mp != current_prompt:
        diff_prompt, diff_source = mp, "main"
    else:
        diff_prompt, diff_source = None, None
    if mode == "db" and group_name:
        db_run_label = f"{group_name} · {environment}"
    elif mode == "db":
        db_run_label = environment
    else:
        db_run_label = f"generate · {output_slug}"
    _write_html_report_guardrail(
        entries,
        html_path,
        prev_prompt_override=diff_prompt,
        prev_prompt_source_override=diff_source,
        prev_data_override=prev_data,
        run_label=db_run_label,
    )
    json_path = html_path.with_suffix(".json")
    json_path.write_text(
        json.dumps(
            {
                "prompt": current_prompt,
                "prev_prompt": most_recent_prompt,
                "diff_prompt": diff_prompt,
                "diff_source": diff_source,
                "run_label": db_run_label,
                "data": entries,
            },
            indent=2,
        )
    )
    total_triggered = sum(e["triggered_count"] for e in entries)
    total_messages = sum(e["message_count"] for e in entries)
    print(
        f"\nWrote {len(entries)} conversation(s) to {html_path}"
        f"\nJSON sidecar: {json_path}"
        f"\nOverall: {total_triggered}/{total_messages} messages triggered"
    )
    if langsmith_client:
        langsmith_client.flush()


async def _process_conversation(
    model: ChatOpenAI,
    conversation: "IntakeConversationData",
    attrs: dict,
    output_mode: str,
) -> "ReportEntry":
    rows = await _evaluate_messages(model, conversation)
    entry = _build_report_entry(conversation, rows, attrs, output_mode)
    print(
        f"  {entry['label']}: {entry['triggered_count']}/{entry['message_count']} triggered"
    )
    return entry


async def _evaluate_single_message(model: ChatOpenAI, message: str) -> None:
    messages = [HumanMessage(message)]
    try:
        result = await run_llmaj_safety_check(
            model, messages, {"callbacks": [tracer]} if tracer else {}
        )
    except Exception as e:
        print(f"Error: {e}")
        return

    categories = [
        ("Self-harm", result.self_harm, "llmaj:self-harm"),
        ("Harm to others", result.harm_to_others, "llmaj:harm-to-others"),
        ("Prompt injection", result.prompt_injection, "llmaj:prompt-injection"),
    ]
    triggered = [name for name, cat, _ in categories if cat.triggered]

    print(f'\nMessage: "{message}"\n')
    for name, cat, guardrail_type in categories:
        status = f"TRIGGERED ({guardrail_type})" if cat.triggered else "clean"
        print(f"  {name}: {status} (confidence: {cat.confidence_score:.2f})")
        print(f"    Reasoning: {cat.reasoning}\n")

    if triggered:
        print(f"Guardrails triggered: {', '.join(triggered)}")
    else:
        print("No guardrails triggered.")


async def _fetch_single_db_conversation(
    intake_id: Optional[str],
    client_pseudo_id: Optional[str],
    environment: str,
) -> Optional[IntakeConversationData]:
    # Thin wrapper that routes to the right fetch function based on which identifier is given.
    env = to_environment(environment)
    if intake_id:
        return await fetch_conversation_by_intake_id(intake_id, env)
    if client_pseudo_id:
        return await fetch_conversation(client_pseudo_id, env)
    return None


def _load_fixture_group(group_name: str, fixtures_dir: Path) -> list[tuple[Path, dict]]:
    # Reads eval_fixture_groups from eval_config.yaml and returns (fixture_path, attrs) pairs.
    # Groups may use `extends: [group1, group2]` to merge other groups without duplication.
    path = Path(__file__).parent.parent.parent / "core" / "eval_config.yaml"
    groups = yaml.safe_load(path.read_text()).get("eval_fixture_groups", {})
    return _resolve_fixture_group(group_name, groups, fixtures_dir)


def _resolve_fixture_group(
    group_name: str, groups: dict, fixtures_dir: Path
) -> list[tuple[Path, dict]]:
    group = groups.get(group_name)
    if group is None:
        available = ", ".join(f'"{k}"' for k in groups)
        raise ValueError(f"No fixture group '{group_name}'. Available: {available}")
    if isinstance(group, dict) and "extends" in group:
        result = []
        for parent in group["extends"]:
            result.extend(_resolve_fixture_group(parent, groups, fixtures_dir))
        return result
    return [(fixtures_dir / e["file"], e.get("attrs") or {}) for e in group]


def _load_group(group_name: str, environment: str) -> tuple[list[str], dict[str, dict]]:
    # Reads eval_config.yaml directly rather than via get_eval_intake_groups(), which is
    # coupled to settings.ENV_NAME and can't be overridden by the CLI's --environment flag.
    path = Path(__file__).parent.parent.parent / "core" / "eval_config.yaml"
    data = yaml.safe_load(path.read_text())
    groups = data.get("eval_intake_groups", {}).get(environment, [])
    group = next((g for g in groups if g["name"] == group_name), None)
    if not group:
        available = ", ".join(f'"{g["name"]}"' for g in groups)
        raise ValueError(
            f"No group '{group_name}' in environment '{environment}'. "
            f"Available: {available}"
        )
    ids = [str(i) for i in group.get("ids", [])]
    attrs_by_id = {str(k): v for k, v in (group.get("attrs_by_id") or {}).items()}
    return ids, attrs_by_id


async def _fetch_group_conversations(
    group_name: str, environment: str
) -> list[tuple[IntakeConversationData, dict]]:
    # Fetches all intakes in a named group, skipping any that fail rather than aborting.
    # fetch_conversation_by_intake_id always returns an object (never None), so we check
    # conv.error rather than truthiness.
    ids, attrs_by_id = _load_group(group_name, environment)
    env = to_environment(environment)
    print(f"Fetching {len(ids)} intakes from group '{group_name}' ({environment})...")
    results = []
    for intake_id in ids:
        try:
            conv = await fetch_conversation_by_intake_id(intake_id, env)
            if conv.error:
                print(f"  Skipping {intake_id}: {conv.error}")
            else:
                attrs = attrs_by_id.get(intake_id, {})
                results.append((conv, attrs))
        except Exception as e:
            logger.warning("Failed to fetch intake", intake_id=intake_id, error=str(e))
    return results


async def _load_config_from_db(config_code: str, environment: str):
    """Fetch the active assessment config with the given code from the environment DB."""
    env = to_environment(environment)
    engine, connector = await get_postgres_engine(env)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            stmt = select(AssessmentConfig).where(
                AssessmentConfig.code == config_code,
                AssessmentConfig.status == ConfigStatus.ACTIVE,
            )
            result = await session.execute(stmt)
            config = result.scalars().first()

            if not config:
                raise ValueError(
                    f"No active assessment config found with code '{config_code}' "
                    f"in environment '{environment}'"
                )

            print(
                f"Loaded config: {config.code} v{config.version} ({config.display_name})"
            )
            return AssessmentFileLoader.validate_yaml_content(config.config_yaml)
    finally:
        await engine.dispose()
        if connector:
            await connector.close_async()


async def _generate_conversation(
    config_file_name: Optional[str],
    config_code: Optional[str],
    environment: str,
    persona_name: Optional[str] = None,
    persona_key: Optional[str] = None,
) -> tuple[IntakeConversationData, dict]:
    if config_code:
        assessment_config = await _load_config_from_db(config_code, environment)
        if not assessment_config.intake.sections:
            raise ValueError(f"No sections found in config '{config_code}'")
        sections = assessment_config.intake.sections
    else:
        assessment_config, sections = get_assessment_config(config_file_name)

    if persona_key:
        matched = next(
            (
                p
                for p in SAMPLE_PERSONAS
                if p.get("key", "").lower() == persona_key.lower()
            ),
            None,
        )
        if not matched:
            available = ", ".join(p.get("key", "") for p in SAMPLE_PERSONAS)
            raise ValueError(
                f"No persona with key '{persona_key}'. Available keys: {available}"
            )
        persona = matched
    elif persona_name:
        matched = next(
            (p for p in SAMPLE_PERSONAS if p["name"].lower() == persona_name.lower()),
            None,
        )
        if not matched:
            available = ", ".join(f'"{p["name"]}"' for p in SAMPLE_PERSONAS)
            raise ValueError(
                f"No persona named '{persona_name}'. Available names: {available}"
            )
        persona = matched
    else:
        persona = SAMPLE_PERSONAS[0]

    print(f"Using persona: {persona['name']} (key: {persona.get('key', 'n/a')})")
    conv = await generate_client_conversation(
        client_pseudo_id=f"guardrail-eval-{uuid.uuid4().hex[:8]}",
        client_name=persona["name"],
        persona=persona,
        sections=sections,
        assessment_config=assessment_config,
    )
    return conv, {
        "persona_name": persona["name"],
        "persona_key": persona.get("key", ""),
    }


def _passes_threshold(cat_triggered: bool, cat_key: str, confidence: float) -> bool:
    return cat_triggered and confidence >= LLMAJ_THRESHOLD_MAP[cat_key]


@traceable(name="guardrail-eval-intake", run_type="chain")
async def _evaluate_messages(
    model: ChatOpenAI, conversation: IntakeConversationData
) -> list[_ExchangeEntry]:
    # Runs LLMAJ on each client message with full prior conversation context, stopping at
    # the first trigger that passes the production threshold — matching hard-stop behavior.
    history = conversation.conversation_history
    rows: list[_ExchangeEntry] = []
    for i, exchange in enumerate(history):
        # Opening message (and any trailing caseworker message) has no client response.
        # Include it as a display-only row so the report shows the full conversation.
        if not exchange.answer.strip():
            if exchange.question.strip():
                rows.append(
                    _ExchangeEntry(
                        index=i,
                        section=exchange.section,
                        question=exchange.question,
                        answer="",
                        triggered="",
                        self_harm=_CategoryResult(
                            result="ERROR", confidence=0.0, reasoning=""
                        ),
                        harm_to_others=_CategoryResult(
                            result="ERROR", confidence=0.0, reasoning=""
                        ),
                        prompt_injection=_CategoryResult(
                            result="ERROR", confidence=0.0, reasoning=""
                        ),
                    )
                )
            continue
        context_messages = []
        for prior in history[:i]:
            if prior.question.strip():
                context_messages.append(AIMessage(prior.question))
            if prior.answer.strip():
                context_messages.append(HumanMessage(prior.answer))
        context_messages.append(AIMessage(exchange.question))
        context_messages.append(HumanMessage(exchange.answer))

        try:
            result = await run_llmaj_safety_check(
                model, context_messages, {"callbacks": [tracer]} if tracer else {}
            )
        except Exception as e:
            logger.error("LLMAJ check failed", index=i, error=str(e))
            rows.append(
                _ExchangeEntry(
                    index=i,
                    section=exchange.section,
                    question=exchange.question,
                    answer=exchange.answer,
                    triggered="ERROR",
                    self_harm=_CategoryResult(
                        result="ERROR", confidence=0.0, reasoning=str(e)
                    ),
                    harm_to_others=_CategoryResult(
                        result="ERROR", confidence=0.0, reasoning=""
                    ),
                    prompt_injection=_CategoryResult(
                        result="ERROR", confidence=0.0, reasoning=""
                    ),
                )
            )
            continue

        triggered_list = "|".join(
            filter(
                None,
                [
                    (
                        "llmaj:self-harm"
                        if _passes_threshold(
                            result.self_harm.triggered,
                            "self_harm",
                            result.self_harm.confidence_score,
                        )
                        else ""
                    ),
                    (
                        "llmaj:harm-to-others"
                        if _passes_threshold(
                            result.harm_to_others.triggered,
                            "harm_to_others",
                            result.harm_to_others.confidence_score,
                        )
                        else ""
                    ),
                    (
                        "llmaj:prompt-injection"
                        if _passes_threshold(
                            result.prompt_injection.triggered,
                            "prompt_injection",
                            result.prompt_injection.confidence_score,
                        )
                        else ""
                    ),
                ],
            )
        )
        rows.append(
            _ExchangeEntry(
                index=i,
                section=exchange.section,
                question=exchange.question,
                answer=exchange.answer,
                triggered=triggered_list,
                self_harm=_CategoryResult(
                    result="llmaj:self-harm" if result.self_harm.triggered else "",
                    confidence=result.self_harm.confidence_score,
                    reasoning=result.self_harm.reasoning,
                ),
                harm_to_others=_CategoryResult(
                    result="llmaj:harm-to-others"
                    if result.harm_to_others.triggered
                    else "",
                    confidence=result.harm_to_others.confidence_score,
                    reasoning=result.harm_to_others.reasoning,
                ),
                prompt_injection=_CategoryResult(
                    result="llmaj:prompt-injection"
                    if result.prompt_injection.triggered
                    else "",
                    confidence=result.prompt_injection.confidence_score,
                    reasoning=result.prompt_injection.reasoning,
                ),
            )
        )

        if triggered_list:
            break

    return rows


def _build_report_entry(
    conversation: IntakeConversationData,
    rows: list[_ExchangeEntry],
    attrs: dict,
    mode: str,
) -> ReportEntry:
    # Shapes a conversation + its evaluated rows into the JSON structure the HTML template reads.
    intake_id = (
        conversation.sections_data.intake_id
        if conversation.sections_data
        else conversation.client_pseudo_id
    )
    label = attrs.get("persona_name") or intake_id[:16]
    triggered_count = sum(1 for r in rows if r["triggered"])
    exchanges = list(rows)
    return {
        "id": intake_id,
        "label": label,
        "attrs": attrs,
        "mode": mode,
        "message_count": len(rows),
        "triggered_count": triggered_count,
        "any_triggered": triggered_count > 0,
        "exchanges": exchanges,
    }


def _find_prev_run(
    output_dir: Path, glob_pattern: str, current_prompt: str
) -> tuple[Optional[str], Optional[list], Optional[str]]:
    """Single pass over prior JSON sidecars.

    Returns (most_recent_prompt, most_recent_data, last_changed_prompt):
    - most_recent_prompt: stored in the new sidecar as prev_prompt
    - most_recent_data: used to build regression/fix badges
    - last_changed_prompt: most recent prior prompt != current_prompt (diff baseline)
    """
    most_recent_prompt: Optional[str] = None
    most_recent_data: Optional[list] = None
    last_changed_prompt: Optional[str] = None
    for c in sorted(output_dir.glob(glob_pattern)):
        try:
            raw = json.loads(c.read_text())
            if isinstance(raw, dict) and raw.get("prompt"):
                most_recent_prompt = raw["prompt"]
                most_recent_data = raw.get("data")
                if most_recent_prompt != current_prompt:
                    last_changed_prompt = most_recent_prompt
        except Exception:
            pass
    return most_recent_prompt, most_recent_data, last_changed_prompt


def _get_original_prompt_from_main() -> Optional[str]:
    """Extract the LLMAJ safety prompt from origin/main's prompts.py via git show.

    This allows us to get the previous production prompt to give us a baseline to
    to compare prompt changes and iterations against and display a proper diff in the report
    """
    import subprocess  # stdlib, not worth a top-level import for a dev-only helper

    try:
        result = subprocess.run(
            [
                "git",
                "show",
                "origin/main:apps/@reentry/backend/app/utils/intake/prompts.py",
            ],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent,
        )
        if result.returncode != 0:
            return None
        m = re.search(r'prompt = """\\\n(.*?)\n"""', result.stdout, re.DOTALL)
        return m.group(1) if m else None
    except Exception:
        return None


def _get_git_info() -> dict:
    """Return {hash, branch, url} for the current HEAD, or empty strings on failure."""
    import subprocess

    def _run(*cmd: str) -> str:
        try:
            r = subprocess.run(
                cmd, capture_output=True, text=True, cwd=Path(__file__).parent
            )
            return r.stdout.strip() if r.returncode == 0 else ""
        except Exception:
            return ""

    short_hash = _run("git", "rev-parse", "--short", "HEAD")
    branch = _run("git", "branch", "--show-current")
    remote = _run("git", "remote", "get-url", "origin")

    commit_url = ""
    branch_url = ""
    if remote:
        # Normalise SSH (git@github.com:Org/Repo.git) → HTTPS
        if remote.startswith("git@"):
            remote = re.sub(r"^git@([^:]+):(.+?)(?:\.git)?$", r"https://\1/\2", remote)
        elif remote.endswith(".git"):
            remote = remote[:-4]
        if short_hash:
            full_hash = _run("git", "rev-parse", "HEAD")
            commit_url = f"{remote}/commit/{full_hash}" if full_hash else ""
        if branch:
            branch_url = f"{remote}/tree/{branch}"

    return {
        "hash": short_hash,
        "branch": branch,
        "url": commit_url,
        "branch_url": branch_url,
    }


def _build_prev_data_map(prev_data: Optional[list]) -> Optional[dict]:
    """Build label → exchange_index → triggered string map for JS regression badges."""
    if not prev_data:
        return None
    return {
        entry["label"]: {
            str(ex["index"]): ex.get("triggered", "")
            for ex in entry.get("exchanges", [])
        }
        for entry in prev_data
    }


def _write_html_report_guardrail(
    entries: list[ReportEntry],
    path: Path,
    prompt_override: Optional[str] = None,
    prev_prompt_override: Optional[str] = None,
    prev_prompt_source_override: Optional[str] = None,
    prev_data_override: Optional[list] = None,
    run_label: Optional[str] = None,
) -> None:
    category_fields = json.dumps(list(_CategoryResult.__annotations__.keys()))
    prompt_text = json.dumps(
        prompt_override
        if prompt_override is not None
        else generate_llmaj_safety_prompt().content
    )
    prev_prompt_text = json.dumps(prev_prompt_override)
    prev_prompt_source_text = json.dumps(prev_prompt_source_override)
    prev_data_map_text = json.dumps(_build_prev_data_map(prev_data_override))
    git = _get_git_info()
    run_label_obj = {"text": run_label or "", **git}
    run_label_text = json.dumps(run_label_obj if (run_label or git["hash"]) else None)
    template = _HTML_TEMPLATE_GUARDRAIL.replace("__CATEGORY_FIELDS__", category_fields)
    template = template.replace("__PROMPT__", prompt_text)
    template = template.replace("__PREV_PROMPT__", prev_prompt_text)
    template = template.replace("__PREV_PROMPT_SOURCE__", prev_prompt_source_text)
    template = template.replace("__PREV_DATA_MAP__", prev_data_map_text)
    template = template.replace("__RUN_LABEL__", run_label_text)
    write_html_report(template, entries, str(path))


def _resolve_output_path(
    output_file: Optional[str], mode: str, identifier: Optional[str]
) -> Path:
    if output_file:
        return Path(output_file)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = re.sub(r"[^a-zA-Z0-9]", "", identifier or "synthetic")[:40]
    return Path(f"guardrail_eval_{mode}_{slug}_{timestamp}.html")
