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

// The copy is the publish modal's in the Calendar Unit Dashboard design,
// except the description. The design says later edits are tracked, but a
// published month is locked until Edit month takes it off the public
// calendar, so the description says that instead. The same copy covers
// a month's first publish and a republish after Edit month.
export const PUBLISH_COPY = {
  /** The header button that opens the dialog. */
  opener: "Review & Publish",
  heading: (monthLabel: string) => `Publish ${monthLabel}`,
  description: (monthLabel: string) =>
    `${monthLabel} goes live on the public calendar for board members, hearing officers and victim services. To change it later, click Edit month, which takes it off the public calendar until you publish again.`,
  confirm:
    "I have reviewed this month's calendar and confirm it is ready to publish to the public site.",
  action: "Publish calendar",
  /** The toast once the publish succeeds. */
  published: (monthLabel: string) => `${monthLabel} is published.`,
};

/** The dialog's message when the publish preview fails to load. */
export const PREVIEW_LOAD_ERROR_TITLE = "We couldn't load the publish preview.";

/**
 * The message for a publish that failed for any reason other than a conflict,
 * a precondition or a missing month, network errors included. The client
 * builds it because a network error carries no server message.
 */
export function publishFailedMessage(monthLabel: string) {
  return `${monthLabel} wasn't published. The public calendar hasn't changed. Try again or contact Recidiviz support.`;
}
