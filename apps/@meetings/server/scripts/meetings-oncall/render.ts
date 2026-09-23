// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

/** Renders the oncall dashboard page. Pure string building — no I/O. */

import { NotetakingPipelineRun } from "~@meetings/prisma/client";
import { REPROCESS_STEPS } from "~@meetings/server/scripts/meetings-oncall/actions";
import {
  DashboardMeeting,
  DashboardRow,
  FetchFilters,
} from "~@meetings/server/scripts/meetings-oncall/data";
import {
  cloudLoggingUrl,
  gcsObjectUrl,
  sentryIssueSearchUrl,
} from "~@meetings/server/scripts/meetings-oncall/links";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(status: string): string {
  if (status === "COMPLETED" || status === "SUCCESS") return "ok";
  if (status.endsWith("_ERROR") || status === "FAILURE") return "error";
  if (status === "PARTIAL_FAILURE") return "warn";
  if (status === "NOT_STARTED") return "idle";
  return "pending";
}

function renderAudioCell(meeting: DashboardMeeting): string {
  if (meeting.audioDeletedAt) {
    return `<span class="muted">deleted ${meeting.audioDeletedAt.toISOString().slice(0, 10)}</span>`;
  }
  if (!meeting.finalRecordingGCSPath) {
    return `<span class="muted">—</span>`;
  }
  const url = gcsObjectUrl(
    meeting.recordingsGCSBucket,
    meeting.finalRecordingGCSPath,
  );
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">final audio</a>`;
}

/**
 * No transcription job id is persisted anywhere — transcription is a synchronous
 * SDK call. The whole provider response is stored though, so the provider's own
 * request id can be recovered from it: AssemblyAI puts it at `id`, Deepgram at
 * `metadata.request_id`.
 */
function renderTranscriptionCell(meeting: DashboardMeeting): string {
  if (meeting.transcriptDeletedAt) {
    return `<span class="muted">deleted ${meeting.transcriptDeletedAt.toISOString().slice(0, 10)}</span>`;
  }
  if (meeting.transcriptions.length === 0) {
    return `<span class="muted">—</span>`;
  }

  return meeting.transcriptions
    .map((transcription) => {
      const confidence =
        transcription.confidence === null
          ? ""
          : ` (${transcription.confidence.toFixed(2)})`;
      const label = escapeHtml(`${transcription.provider}${confidence}`);
      const transcriptObject = transcription.transcriptObject;

      if (typeof transcriptObject !== "object" || transcriptObject === null) {
        return label;
      }

      const assemblyAiId = (transcriptObject as { id?: unknown }).id;
      if (typeof assemblyAiId === "string") {
        const url = `https://www.assemblyai.com/app/transcripts/${encodeURIComponent(assemblyAiId)}`;
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label}</a>`;
      }

      const requestId = (
        transcriptObject as { metadata?: { request_id?: unknown } }
      ).metadata?.request_id;
      if (typeof requestId === "string") {
        return `${label}<br /><code>${escapeHtml(requestId)}</code>`;
      }

      return label;
    })
    .join("<br />");
}

function renderNotetakingCell(
  pipelineRun: NotetakingPipelineRun | undefined,
): string {
  if (!pipelineRun) {
    return `<span class="muted">—</span>`;
  }
  const status = `<span class="pill ${statusClass(pipelineRun.status)}">${escapeHtml(pipelineRun.status)}</span>`;
  if (!pipelineRun.langsmithTraceId) {
    return `${status}<br /><span class="muted">no trace id</span>`;
  }
  // Rendered as text rather than a link: building a LangSmith run URL needs the
  // org and project ids, which we don't have here yet.
  return `${status}<br /><code>${escapeHtml(pipelineRun.langsmithTraceId)}</code>`;
}

/**
 * NotetakingPipelineRun.errorDetails is the only error payload the schema
 * persists for any pipeline stage, so show it verbatim when present.
 */
function renderErrorDetails(
  pipelineRun: NotetakingPipelineRun | undefined,
): string {
  if (!pipelineRun?.errorDetails) {
    return "";
  }
  const text =
    typeof pipelineRun.errorDetails === "string"
      ? pipelineRun.errorDetails
      : JSON.stringify(pipelineRun.errorDetails, null, 2);
  return `<div class="diag-block">
  <div class="diag-title">Notetaking errorDetails</div>
  <pre class="log">${escapeHtml(text)}</pre>
</div>`;
}

function renderActionsCell({ stateCode, meeting }: DashboardRow): string {
  const attrs = `data-state="${escapeHtml(stateCode)}" data-meeting="${escapeHtml(meeting.id)}"`;
  const buttons = REPROCESS_STEPS.map(
    (step) =>
      `<button class="btn" ${attrs} data-step="${step}" onclick="reprocess(this)">${step}</button>`,
  ).join("");

  return `<div class="actions">
  <div class="btn-row">${buttons}</div>
  <div class="btn-row">
    <input type="file" accept="audio/*" ${attrs} onchange="stageUpload(this)" />
    <button class="btn primary" ${attrs} onclick="uploadAndReprocess(this)">upload + reprocess</button>
  </div>
  <pre class="log" id="log-${escapeHtml(meeting.id)}" hidden></pre>
</div>`;
}

/**
 * The diagnostics drawer. The GCS listing is fetched on demand rather than on
 * page load: it is one API call per meeting, and most rows never get expanded.
 */
function renderDiagnosticsRow(
  row: DashboardRow,
  configuration: string,
): string {
  const { stateCode, meeting, pipelineRun } = row;
  const logsUrl = cloudLoggingUrl({
    configuration,
    meetingId: meeting.id,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
  });

  const links = [
    `<a href="${escapeHtml(sentryIssueSearchUrl(meeting.id))}" target="_blank" rel="noreferrer">Sentry (meetingId tag)</a>`,
    logsUrl
      ? `<a href="${escapeHtml(logsUrl)}" target="_blank" rel="noreferrer">Cloud Logging (around this meeting)</a>`
      : "",
  ]
    .filter(Boolean)
    .join(" &middot; ");

  return `<tr class="diag-row" id="diag-${escapeHtml(meeting.id)}" hidden>
  <td colspan="12">
    <div class="diag-links">${links}</div>
    ${renderErrorDetails(pipelineRun)}
    <div class="diag-block">
      <div class="diag-title">
        Recordings folder
        <button class="btn" data-state="${escapeHtml(stateCode)}" data-meeting="${escapeHtml(meeting.id)}" onclick="loadDiagnosis(this)">inspect GCS</button>
      </div>
      <div id="gcs-${escapeHtml(meeting.id)}" class="muted">Not loaded.</div>
    </div>
  </td>
</tr>`;
}

function renderRow(row: DashboardRow, configuration: string): string {
  const { stateCode, meeting, pipelineRun } = row;
  const person = meeting.client ?? meeting.resident;
  // Discriminated on the foreign keys rather than with `isResident`, since the
  // person `select` omits the name fields that helper's types require.
  let personType = "—";
  if (meeting.residentId) {
    personType = "Resident";
  } else if (meeting.clientId) {
    personType = "Client";
  }
  const meetingType = meeting.meetingTypeCategory
    ? `${meeting.meetingType ?? "—"} (${meeting.meetingTypeCategory})`
    : meeting.meetingType ?? "—";

  return `<tr>
  <td>
    <button class="btn expand" onclick="toggleDiagnostics(this, '${escapeHtml(meeting.id)}')" title="Show diagnostics">+</button>
    <code>${escapeHtml(meeting.id)}</code>
  </td>
  <td>${escapeHtml(stateCode)}</td>
  <td class="nowrap">${meeting.startTime.toISOString().replace("T", " ").slice(0, 16)}</td>
  <td>${escapeHtml(meeting.staffEmail)}</td>
  <td>${personType}</td>
  <td><code>${escapeHtml(person?.pseudonymizedId ?? "—")}</code></td>
  <td>${escapeHtml(meetingType)}</td>
  <td><span class="pill ${statusClass(meeting.postMeetingProcessingStatus)}">${escapeHtml(meeting.postMeetingProcessingStatus)}</span></td>
  <td>${renderAudioCell(meeting)}</td>
  <td>${renderTranscriptionCell(meeting)}</td>
  <td>${renderNotetakingCell(pipelineRun)}</td>
  <td>${renderActionsCell(row)}</td>
</tr>
${renderDiagnosticsRow(row, configuration)}`;
}

const STYLES = `
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #666; margin: 0 0 4px; }
  .filters { margin: 0 0 16px; }
  .filters input { font: inherit; padding: 4px 6px; width: 22ch; }
  .notice { background: #fff4e5; border-left: 3px solid #e08600; padding: 8px 12px; margin: 0 0 16px; }
  .notice.danger { background: #fdeaea; border-left-color: #c62828; }
  .table-wrap { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border-bottom: 1px solid #ddd; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; white-space: nowrap; }
  code { font-size: 12px; word-break: break-all; }
  .muted { color: #999; }
  .nowrap { white-space: nowrap; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; white-space: nowrap; }
  .pill.ok { background: #d8f0d8; color: #1a5c1a; }
  .pill.error { background: #f8d7d7; color: #8c1c1c; }
  .pill.warn, .pill.pending { background: #fdefc8; color: #7a5300; }
  .pill.idle { background: #eee; color: #555; }
  .actions { min-width: 260px; }
  .btn-row { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-bottom: 4px; }
  .btn { font: inherit; font-size: 12px; padding: 3px 8px; cursor: pointer; border: 1px solid #bbb; border-radius: 4px; background: #fafafa; }
  .btn:hover:not(:disabled) { background: #eee; }
  .btn:disabled { opacity: .5; cursor: progress; }
  .btn.primary { border-color: #2a6ebb; color: #2a6ebb; }
  input[type="file"] { font-size: 11px; max-width: 150px; }
  .btn.expand { padding: 0 5px; font-family: monospace; line-height: 1.4; }
  .diag-row > td { background: #fafafa; }
  .diag-links { margin-bottom: 8px; font-size: 12px; }
  .diag-block { margin-bottom: 10px; }
  .diag-title { font-size: 12px; text-transform: uppercase; letter-spacing: .03em; color: #666; margin-bottom: 4px; display: flex; gap: 8px; align-items: center; }
  .finding { font-size: 12px; padding: 4px 8px; border-left: 3px solid #bbb; margin-bottom: 3px; }
  .finding.error { border-left-color: #c62828; background: #fdeaea; }
  .finding.warn { border-left-color: #e08600; background: #fff4e5; }
  .finding.info { border-left-color: #888; background: #f0f0f0; }
  table.objects { width: auto; font-size: 12px; margin-top: 6px; }
  table.objects th, table.objects td { padding: 3px 10px 3px 0; border: none; }
  table.objects tr.not-audio td { color: #c62828; }
  table.objects tr.empty td { font-weight: 600; color: #c62828; }
  .log { font-size: 11px; white-space: pre-wrap; word-break: break-word; background: #f3f3f3; padding: 6px; margin: 4px 0 0; border-radius: 4px; max-height: 160px; overflow: auto; }
  @media (prefers-color-scheme: dark) {
    body { background: #1a1a1a; color: #e6e6e6; }
    th { background: #262626; }
    th, td { border-bottom-color: #383838; }
    .notice { background: #33270f; }
    .notice.danger { background: #3a1f1f; }
    .btn { background: #2a2a2a; border-color: #555; color: #e6e6e6; }
    .btn:hover:not(:disabled) { background: #333; }
    .log { background: #232323; }
    .diag-row > td { background: #202020; }
    .finding.error { background: #3a1f1f; }
    .finding.warn { background: #33270f; }
    .finding.info { background: #262626; }
  }
`;

/**
 * Client-side behavior. Every request carries the per-run token so that other
 * local processes can't drive this server.
 */
function clientScript(token: string): string {
  return `
const TOKEN = ${JSON.stringify(token)};
const staged = new Map();

function logFor(el) {
  const log = document.getElementById("log-" + el.dataset.meeting);
  log.hidden = false;
  return log;
}

function setBusy(el, busy) {
  el.closest(".actions").querySelectorAll("button").forEach((b) => { b.disabled = busy; });
}

async function post(path, body, headers) {
  const res = await fetch(path, {
    method: "POST",
    headers: Object.assign({ "x-oncall-token": TOKEN }, headers || {}),
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return text;
}

async function reprocess(el, gcsPath) {
  const { state, meeting, step } = el.dataset;
  const what = gcsPath ? step + " with uploaded audio" : step;
  if (!gcsPath && !confirm("Re-run " + what + " for " + meeting + " (" + state + ")?")) return;
  const log = logFor(el);
  setBusy(el, true);
  log.textContent = "Running " + what + "…";
  try {
    log.textContent = await post("/api/reprocess", JSON.stringify({
      stateCode: state, meetingId: meeting, step, gcsPath,
    }), { "content-type": "application/json" });
  } catch (e) {
    log.textContent = "❌ " + e.message;
  } finally {
    setBusy(el, false);
  }
}

function stageUpload(input) {
  if (input.files.length) staged.set(input.dataset.meeting, input.files[0]);
}

async function uploadAndReprocess(el) {
  const { state, meeting } = el.dataset;
  const file = staged.get(meeting);
  if (!file) { alert("Choose an audio file first."); return; }
  if (!confirm("Upload " + file.name + " and re-run transcription for " + meeting + "?\\n\\nThis overwrites the meeting's finalRecordingGCSPath.")) return;

  const log = logFor(el);
  setBusy(el, true);
  log.textContent = "Uploading " + file.name + " (" + Math.round(file.size / 1024) + " KB)…";
  try {
    const query = new URLSearchParams({ stateCode: state, meetingId: meeting, filename: file.name });
    const uploaded = JSON.parse(await post("/api/upload?" + query, file, {
      "content-type": "application/octet-stream",
    }));
    log.textContent = "Uploaded to " + uploaded.gcsPath + "\\nQueuing transcription…";
    // Reprocessing from an uploaded file always resumes at transcription: the
    // upload replaces the already-stitched final recording.
    log.textContent += "\\n" + await post("/api/reprocess", JSON.stringify({
      stateCode: state, meetingId: meeting, step: "transcription", gcsPath: uploaded.gcsPath,
    }), { "content-type": "application/json" });
  } catch (e) {
    log.textContent = "❌ " + e.message;
  } finally {
    setBusy(el, false);
  }
}

function toggleDiagnostics(button, meetingId) {
  const row = document.getElementById("diag-" + meetingId);
  row.hidden = !row.hidden;
  button.textContent = row.hidden ? "+" : "\u2212";
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + units[i];
}

async function loadDiagnosis(button) {
  const { state, meeting } = button.dataset;
  const target = document.getElementById("gcs-" + meeting);
  button.disabled = true;
  target.textContent = "Listing objects\u2026";
  try {
    const query = new URLSearchParams({ stateCode: state, meetingId: meeting });
    const res = await fetch("/api/diagnose?" + query, { headers: { "x-oncall-token": TOKEN } });
    const text = await res.text();
    if (!res.ok) throw new Error(text || res.statusText);
    const data = JSON.parse(text);

    const findings = data.findings.map((f) =>
      '<div class="finding ' + f.level + '">' + escapeText(f.message) + "</div>"
    ).join("");

    const rows = data.objects.map((o) => {
      const cls = o.size === 0 ? 'empty' : (o.isAudio ? '' : 'not-audio');
      return '<tr class="' + cls + '"><td><a href="' + objectUrl(data.bucket, o.name) +
        '" target="_blank" rel="noreferrer">' + escapeText(o.basename) + '</a></td><td>' +
        formatBytes(o.size) + '</td><td>' + escapeText(o.contentType || '\u2014') +
        '</td><td>' + escapeText((o.updated || '').replace('T', ' ').slice(0, 16)) + '</td></tr>';
    }).join('');

    target.innerHTML = findings +
      '<div class="muted" style="font-size:12px;margin-top:6px">gs://' + escapeText(data.bucket) + "/" + escapeText(data.folderPath) + "/</div>" +
      (data.objects.length
        ? '<table class="objects"><thead><tr><th>Object</th><th>Size</th><th>Content type</th><th>Updated</th></tr></thead><tbody>' + rows + "</tbody></table>"
        : "");
  } catch (e) {
    target.textContent = "\u274c " + e.message;
  } finally {
    button.disabled = false;
  }
}

function escapeText(value) {
  const el = document.createElement("span");
  el.textContent = String(value);
  return el.innerHTML;
}

function objectUrl(bucket, name) {
  const path = name.split("/").map(encodeURIComponent).join("/");
  return "https://console.cloud.google.com/storage/browser/_details/" + encodeURIComponent(bucket) + "/" + path;
}

function applyFilters(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const params = new URLSearchParams({ t: TOKEN });
  for (const [key, value] of form.entries()) {
    if (String(value).trim()) params.set(key, String(value).trim());
  }
  window.location.search = params;
}
`;
}

export function renderHtml(options: {
  rows: DashboardRow[];
  configuration: string;
  skippedStates: string[];
  filters: FetchFilters;
  token: string;
  stateCount: number;
}): string {
  const { rows, configuration, skippedStates, filters, token, stateCount } =
    options;

  const skippedNotice = skippedStates.length
    ? `<p class="notice">Could not reach: ${escapeHtml(skippedStates.join(", "))}. Is the Cloud SQL proxy running?</p>`
    : "";

  const prodWarning =
    configuration === "production"
      ? `<p class="notice danger"><strong>Production.</strong> Reprocess and upload actions affect real meetings.</p>`
      : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Meetings Oncall — ${escapeHtml(configuration)}</title>
<style>${STYLES}</style>
</head>
<body>
<h1>Meetings Oncall Dashboard</h1>
<p class="meta">
  ${escapeHtml(configuration)} &middot; ${rows.length} meeting(s) across
  ${stateCount} state(s) &middot; loaded ${new Date().toISOString()}
</p>
<form class="filters" onsubmit="applyFilters(event)">
  <input name="limit" type="number" min="1" max="500" placeholder="limit" value="${filters.limit}" style="width:8ch" />
  <input name="meetingId" placeholder="meeting id" value="${escapeHtml(filters.meetingId ?? "")}" />
  <input name="user" placeholder="creator email" value="${escapeHtml(filters.user ?? "")}" />
  <button class="btn" type="submit">apply</button>
</form>
${prodWarning}
${skippedNotice}
<div class="table-wrap">
<table>
<thead>
<tr>
  <th>Meeting ID</th><th>State</th><th>Start (UTC)</th><th>Creator</th>
  <th>Person</th><th>Pseudonymized ID</th><th>Meeting type</th><th>Status</th>
  <th>Audio</th><th>Transcription</th><th>Notetaking</th><th>Reprocess</th>
</tr>
</thead>
<tbody>
${rows.length ? rows.map((row) => renderRow(row, configuration)).join("\n") : `<tr><td colspan="12" class="muted">No meetings matched.</td></tr>`}
</tbody>
</table>
</div>
<script>${clientScript(token)}</script>
</body>
</html>
`;
}
