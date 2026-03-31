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

const SLACK_WEBHOOK_URL = process.env["SLACK_WEBHOOK_URL"];
const SLACK_NOTIFICATIONS_ENABLED =
  process.env["SLACK_NOTIFICATIONS_ENABLED"] === "true";

export async function postMeetingCreatedNotification({
  staffEmail,
  stateCode,
  personPseudoId,
  meetingId,
}: {
  staffEmail: string;
  stateCode: string;
  personPseudoId: string;
  meetingId: string;
}): Promise<void> {
  if (!SLACK_NOTIFICATIONS_ENABLED || !SLACK_WEBHOOK_URL) return;

  let parsed: URL;
  try {
    parsed = new URL(SLACK_WEBHOOK_URL);
  } catch {
    console.warn(
      `Configured Slack webhook URL is not a valid URL, skipping: ${SLACK_WEBHOOK_URL}`,
    );
    return;
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "hooks.slack.com") {
    console.warn(
      `Configured Slack webhook URL is not a valid Slack URL, skipping: ${parsed.hostname}`,
    );
    return;
  }

  const text = [
    "New meeting created",
    `• Staff: ${staffEmail}`,
    `• State: ${stateCode}`,
    `• Client/Resident ID: ${personPseudoId}`,
    `• Meeting ID: ${meetingId}`,
  ].join("\n");

  await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}
