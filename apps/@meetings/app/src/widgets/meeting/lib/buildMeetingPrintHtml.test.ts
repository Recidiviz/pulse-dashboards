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
  buildMeetingPrintHtml,
  PrintableMeetingDetails,
} from "./buildMeetingPrintHtml";

jest.mock("~@meetings/app/entities/meeting", () =>
  jest.requireActual("~@meetings/app/entities/meeting/lib/formatMeetingDate"),
);

const NOT_APPROVED = {
  isApproved: false,
  approverEmail: null,
  approvedAt: null,
};

const actionItem = (
  overrides: Partial<PrintableMeetingDetails["meetingActionItems"][number]>,
) => ({
  id: "item-1",
  assignee: "client",
  completed: false,
  editedTask: null,
  generatedTask: "Generated task",
  context: null,
  evidenceQuotes: [],
  deleted: false,
  ...overrides,
});

const baseMeetingDetails: PrintableMeetingDetails = {
  staffEmail: "officer@example.com",
  userNotepadNotes: "Staff notepad text",
  caseNote: "SUMMARY: Case note text",
  meetingActionItems: [actionItem({})],
  staffFeedback: {
    whatYouDidWell: ["Used open-ended questions"],
    growthOpportunities: [],
    generatedAt: new Date(2026, 8, 1),
  },
  approvals: { caseNote: NOT_APPROVED, actionItems: NOT_APPROVED },
};

const build = (meetingDetails: Partial<PrintableMeetingDetails> = {}) =>
  buildMeetingPrintHtml({
    person: {
      fullName: "Jane Doe",
      displayPersonExternalId: "12345",
      primaryMetadata: "parole",
    },
    meetingDetails: { ...baseMeetingDetails, ...meetingDetails },
    meetingDate: "September 10, 2026",
    time: "10:00 AM",
    duration: "30 min",
    getAssigneeLabel: (assignee) => `Label for ${assignee}`,
  });

const sectionHtml = (body: string, title: string) => {
  const start = body.indexOf(`<h2>${title}`);
  const end = body.indexOf("</section>", start);
  return body.slice(start, end);
};

describe("buildMeetingPrintHtml", () => {
  it("never includes the transcript, even when meeting details carry one", () => {
    const withTranscript = {
      ...baseMeetingDetails,
      transcription: {
        summary: "Transcript summary text",
        utterances: [{ text: "Transcript utterance text", speaker: "Staff" }],
      },
    } as PrintableMeetingDetails;

    expect(build(withTranscript)).not.toMatch(/transcript/i);
  });

  it("names the staff member who held the meeting", () => {
    expect(build()).toContain("Staff member: officer@example.com");
  });

  it("labels the document and every AI section as AI-generated, but not the staff notes", () => {
    const body = build();

    expect(body).toContain(
      "Each AI-generated section shows whether the appropriate staff member has reviewed and approved it.",
    );
    expect(sectionHtml(body, "Draft Case Note")).toContain("AI-generated");
    expect(sectionHtml(body, "Action Items")).toContain("AI-generated");
    expect(sectionHtml(body, "Staff Feedback")).toContain("AI-generated");
    expect(sectionHtml(body, "Notes")).not.toContain("AI-generated");
  });

  it("shows each section's own review status", () => {
    const body = build({
      approvals: {
        caseNote: {
          isApproved: true,
          approverEmail: "reviewer@example.com",
          approvedAt: new Date(2026, 8, 12),
        },
        actionItems: NOT_APPROVED,
      },
    });

    expect(sectionHtml(body, "Draft Case Note")).toContain(
      "✓ Reviewed by reviewer@example.com on September 12, 2026",
    );
    expect(sectionHtml(body, "Action Items")).toContain("Not yet reviewed");
    expect(sectionHtml(body, "Staff Feedback")).not.toContain("review");
  });

  it("skips the review status for empty sections", () => {
    const body = build({ caseNote: null, meetingActionItems: [] });

    expect(sectionHtml(body, "Draft Case Note")).toContain(
      "No case note available.",
    );
    expect(sectionHtml(body, "Draft Case Note")).not.toContain("reviewed");
    expect(sectionHtml(body, "Action Items")).toContain(
      "No action items for this meeting.",
    );
    expect(sectionHtml(body, "Action Items")).not.toContain("reviewed");
  });

  it("groups action items by assignee and prefers the edited text", () => {
    const body = build({
      meetingActionItems: [
        actionItem({ id: "1", editedTask: "Edited task" }),
        actionItem({ id: "2", assignee: "staff member", completed: true }),
        actionItem({ id: "3", generatedTask: "Second client task" }),
        actionItem({ id: "4", editedTask: "  " }),
      ],
    });
    const section = sectionHtml(body, "Action Items");

    expect(section).toContain(
      "<h3>Label for client</h3><ul><li>Edited task</li><li>Second client task</li></ul>",
    );
    expect(section).toContain(
      "<h3>Label for staff member</h3><ul><li>Generated task (completed)</li></ul>",
    );
  });

  it("leaves out staff feedback when the state has it turned off", () => {
    expect(build({ staffFeedback: null })).not.toContain("Staff Feedback");
  });

  it("escapes user-provided text", () => {
    const body = build({ caseNote: "<b>bold</b> & more" });

    expect(body).toContain("&lt;b&gt;bold&lt;/b&gt; &amp; more");
  });
});
