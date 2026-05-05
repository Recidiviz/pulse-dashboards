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

import { MeetingDetails, Person } from "../common/types";
import { humanReadableTitleCase } from "../shared/lib/format";

type Params = {
  person: Person;
  meetingDetails?: MeetingDetails;
  meetingDate: string | null;
  time: string | null;
  duration: string | null;
};
export function usePrintMeetingDetails({
  person,
  meetingDetails,
  meetingDate,
  time,
  duration,
}: Params) {
  return () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.head.innerHTML = `
      <title>Meeting Notes - ${person.fullName}</title>
      <style>
        body { font-family: sans-serif; padding: 32px; }
        h1 { font-size: 24px; }
        h2 { font-size: 20px; margin-top: 40px; }
        h3 { font-size: 18px; margin-top: 8px; font-weight: 600; }
        p { font-size: 16px; color: #333; white-space: pre-wrap; margin-top: 4px; }
      </style>
    `;

    printWindow.document.body.innerHTML = `
      <h1>${person.fullName}</h1>
      <p>ID: ${person.displayPersonExternalId}</p>
      <p>${humanReadableTitleCase(person.primaryMetadata)}</p>
      <h2>Meeting: ${meetingDate}</h2>
      <p>${time}${duration ? ` • ${duration}` : ""}</p>
      <h2>Notes</h2>
      <p>${meetingDetails?.userNotepadNotes || "No notes taken for this meeting."}</p>
      <h3>Action Items</h3>
      <ul>
        ${
          meetingDetails?.actionItems
            ?.map((item) => `<li>${item}</li>`)
            .join("") || "<li>No action items for this meeting.</li>"
        }
      </ul>
      <h3>Critical Updates</h3>
      <ul>
        ${
          meetingDetails?.criticalUpdates
            ?.map((update) => `<li>${update}</li>`)
            .join("") || "<li>No updates for this meeting.</li>"
        }
      </ul>
      <h3>Meeting Summary</h3>
      <ul>
        ${
          meetingDetails?.meetingSummary
            ?.map(
              (summary) => `
          <li style="display: flex; flex-direction: column; gap: 8px;">
            <strong>${summary.title}</strong>
            <ol>
              ${summary.items
                .map(
                  (item) => `
                <li>
                  ${item.timestamp ? `<span>${item.timestamp}</span>` : ""}
                  <div>
                    <p>${item.content}</p>
                    ${item.status !== "Discussed" ? `<span>${item.status}</span>` : ""}
                  </div>
                </li>
              `,
                )
                .join("")}
            </ol>
          </li>
        `,
            )
            .join("") || "<li>No summary for this meeting.</li>"
        }
      </ul>
      <h2>Draft Case Note</h2>
      <p>${meetingDetails?.caseNote || "No case note available."}</p>
    `;

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
}
