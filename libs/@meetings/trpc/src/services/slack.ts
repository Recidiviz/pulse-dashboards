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

import env from "~@meetings/trpc/env";

const SLACK_WEBHOOK_URL = process.env["SLACK_WEBHOOK_URL"];
const SLACK_NOTIFICATIONS_ENABLED =
  process.env["SLACK_NOTIFICATIONS_ENABLED"] === "true";

function getValidatedWebhookUrl(): string | null {
  if (!SLACK_NOTIFICATIONS_ENABLED || !SLACK_WEBHOOK_URL) return null;

  let parsed: URL;
  try {
    parsed = new URL(SLACK_WEBHOOK_URL);
  } catch {
    console.warn(
      `Configured Slack webhook URL is not a valid URL, skipping: ${SLACK_WEBHOOK_URL}`,
    );
    return null;
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "hooks.slack.com") {
    console.warn(
      `Configured Slack webhook URL is not a valid Slack URL, skipping: ${parsed.hostname}`,
    );
    return null;
  }

  return SLACK_WEBHOOK_URL;
}

async function postSlackMessage(text: string): Promise<void> {
  const webhookUrl = getValidatedWebhookUrl();
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    console.warn("Failed to post Slack notification:", e);
  }
}

const MEETINGS_APP_URL_BY_DEPLOY_ENV: Record<string, string> = {
  production: "https://meet.recidiviz.org",
  staging: "https://meet-staging.recidiviz.org",
};

export function buildMeetingUrl({
  stateCode,
  personType,
  personId,
  meetingId,
}: {
  stateCode: string;
  personType: "client" | "resident";
  personId: string;
  meetingId: string;
}): string | null {
  const baseUrl = MEETINGS_APP_URL_BY_DEPLOY_ENV[env.DEPLOY_ENV];
  if (!baseUrl) return null;
  const segment = personType === "client" ? "clients" : "residents";
  return `${baseUrl}/${segment}/${encodeURIComponent(personId)}/meetings/${encodeURIComponent(meetingId)}?stateCode=${encodeURIComponent(stateCode)}`;
}

type MeetingCompletedParams = {
  staffEmail: string;
  stateCode: string;
  personPseudoId: string;
  meetingId: string;
  personType?: "client" | "resident";
  personId?: string;
};

export function buildMeetingCompletedMessage({
  staffEmail,
  stateCode,
  personPseudoId,
  meetingId,
  personType,
  personId,
}: MeetingCompletedParams): string {
  const lines = [
    "Meeting completed",
    `• Staff: ${staffEmail}`,
    `• State: ${stateCode}`,
    `• Client/Resident ID: ${personPseudoId}`,
    `• Meeting ID: ${meetingId}`,
  ];

  if (personType && personId) {
    const meetingUrl = buildMeetingUrl({
      stateCode,
      personType,
      personId,
      meetingId,
    });
    if (meetingUrl) lines.push(`• <${meetingUrl}|View meeting>`);
  }

  return lines.join("\n");
}

export async function postMeetingCompletedNotification(
  params: MeetingCompletedParams,
): Promise<void> {
  await postSlackMessage(buildMeetingCompletedMessage(params));
}

export async function postMeetingErrorNotification({
  meetingId,
  stateCode,
  errorStep,
}: {
  meetingId: string;
  stateCode: string;
  errorStep: "stitching" | "transcription" | "notetaking";
}): Promise<void> {
  const text = [
    `:warning: Meeting processing error (${errorStep})`,
    `• Meeting ID: ${meetingId}`,
    `• State: ${stateCode}`,
    `• Failed step: ${errorStep}`,
  ].join("\n");

  await postSlackMessage(text);
}
