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

import {
  formatMeetingStartDate,
  MeetingDetails,
} from "~@meetings/app/entities/meeting";
import { Person } from "~@meetings/app/shared/api";
import { humanReadableTitleCase } from "~@meetings/app/shared/lib/format";
import { escapeHtml } from "~@meetings/app/shared/lib/print.web";

// The transcript must never be printed
export type PrintableMeetingDetails = Pick<
  MeetingDetails,
  | "staffEmail"
  | "userNotepadNotes"
  | "caseNote"
  | "meetingActionItems"
  | "staffFeedback"
  | "approvals"
>;

type SectionApproval = MeetingDetails["approvals"]["caseNote"];

type Params = {
  person: Pick<
    Person,
    "fullName" | "displayPersonExternalId" | "primaryMetadata"
  >;
  meetingDetails: PrintableMeetingDetails;
  meetingDate: string | null;
  time: string | null;
  duration: string | null;
  getAssigneeLabel: (assignee: string) => string;
};

const AI_TAG = `<span class="tag">AI-generated</span>`;

const AI_NOTICE =
  "This document contains AI-generated content. Each AI-generated section shows whether the appropriate staff member has reviewed and approved it.";

function renderReviewStatus(approval: SectionApproval) {
  if (!approval.isApproved) {
    return `<p class="status">Not yet reviewed</p>`;
  }
  const reviewer = approval.approverEmail
    ? ` by ${escapeHtml(approval.approverEmail)}`
    : "";
  const date = approval.approvedAt
    ? ` on ${formatMeetingStartDate(approval.approvedAt)}`
    : "";
  return `<p class="status">✓ Reviewed${reviewer}${date}</p>`;
}

function renderList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderSection({
  title,
  isAiGenerated,
  status,
  content,
}: {
  title: string;
  isAiGenerated: boolean;
  status?: string;
  content: string;
}) {
  return `
    <section>
      <h2>${title}${isAiGenerated ? AI_TAG : ""}</h2>
      ${status ?? ""}
      ${content}
    </section>
  `;
}

function renderNotes(notes: string | null) {
  return renderSection({
    title: "Notes",
    isAiGenerated: false,
    content: notes
      ? `<p>${escapeHtml(notes)}</p>`
      : `<p class="muted">No notes taken for this meeting.</p>`,
  });
}

function renderCaseNote(caseNote: string | null, approval: SectionApproval) {
  return renderSection({
    title: "Draft Case Note",
    isAiGenerated: true,
    status: caseNote ? renderReviewStatus(approval) : undefined,
    content: caseNote
      ? `<p>${escapeHtml(caseNote)}</p>`
      : `<p class="muted">No case note available.</p>`,
  });
}

function renderActionItems(
  actionItems: PrintableMeetingDetails["meetingActionItems"],
  approval: SectionApproval,
  getAssigneeLabel: (assignee: string) => string,
) {
  const tasksByAssignee = new Map<string, string[]>();
  for (const item of actionItems) {
    const task = (item.editedTask ?? item.generatedTask).trim();
    if (!task) continue;
    const tasks = tasksByAssignee.get(item.assignee) ?? [];
    tasks.push(item.completed ? `${task} (completed)` : task);
    tasksByAssignee.set(item.assignee, tasks);
  }

  const content =
    tasksByAssignee.size === 0
      ? `<p class="muted">No action items for this meeting.</p>`
      : [...tasksByAssignee]
          .map(
            ([assignee, tasks]) =>
              `<h3>${escapeHtml(getAssigneeLabel(assignee))}</h3>${renderList(tasks)}`,
          )
          .join("");

  return renderSection({
    title: "Action Items",
    isAiGenerated: true,
    status: tasksByAssignee.size > 0 ? renderReviewStatus(approval) : undefined,
    content,
  });
}

function renderStaffFeedback(
  staffFeedback: PrintableMeetingDetails["staffFeedback"],
) {
  if (!staffFeedback) return "";

  const renderGroup = (title: string, items: string[], empty: string) =>
    `<h3>${title}</h3>${items.length > 0 ? renderList(items) : `<p class="muted">${empty}</p>`}`;

  return renderSection({
    title: "Staff Feedback",
    isAiGenerated: true,
    content:
      renderGroup(
        "What you did well",
        staffFeedback.whatYouDidWell,
        "No highlights flagged for this meeting.",
      ) +
      renderGroup(
        "Growth opportunities",
        staffFeedback.growthOpportunities,
        "No growth opportunities flagged for this meeting.",
      ),
  });
}

export function buildMeetingPrintHtml({
  person,
  meetingDetails,
  meetingDate,
  time,
  duration,
  getAssigneeLabel,
}: Params) {
  return `
    <h1>${escapeHtml(person.fullName)}</h1>
    <p>ID: ${escapeHtml(person.displayPersonExternalId)}</p>
    <p>${escapeHtml(humanReadableTitleCase(person.primaryMetadata))}</p>
    <h2>Meeting: ${escapeHtml(meetingDate ?? "")}</h2>
    <p>${escapeHtml(time ?? "")}${duration ? ` • ${escapeHtml(duration)}` : ""}</p>
    <p>Staff member: ${escapeHtml(meetingDetails.staffEmail)}</p>
    <p class="notice">${AI_NOTICE}</p>
    ${renderNotes(meetingDetails.userNotepadNotes)}
    ${renderCaseNote(meetingDetails.caseNote, meetingDetails.approvals.caseNote)}
    ${renderActionItems(
      meetingDetails.meetingActionItems,
      meetingDetails.approvals.actionItems,
      getAssigneeLabel,
    )}
    ${renderStaffFeedback(meetingDetails.staffFeedback)}
  `;
}
