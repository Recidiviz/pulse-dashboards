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

import { StateCode } from "~@meetings/prisma/client/enums";
import env from "~@meetings/trpc/env";

const SLACK_WEBHOOK_URL = process.env["SLACK_WEBHOOK_URL"];
const SLACK_NOTIFICATIONS_ENABLED =
  process.env["SLACK_NOTIFICATIONS_ENABLED"] === "true";

// Fields the Slack meeting notifications need about a meeting's staff and person.
export const MEETING_NOTIFICATION_SELECT = {
  staffEmail: true,
  client: { select: { pseudonymizedId: true } },
  resident: { select: { pseudonymizedId: true } },
  clientId: true,
  residentId: true,
} as const;

export function buildMeetingNotificationParams(
  meeting: {
    staffEmail: string;
    client: { pseudonymizedId: string } | null;
    resident: { pseudonymizedId: string } | null;
    clientId: bigint | null;
    residentId: bigint | null;
  },
  { meetingId, stateCode }: { meetingId: string; stateCode: StateCode },
) {
  let personType: "client" | "resident" | undefined;
  if (meeting.clientId != null) {
    personType = "client";
  } else if (meeting.residentId != null) {
    personType = "resident";
  }

  return {
    staffEmail: meeting.staffEmail,
    stateCode,
    personPseudoId:
      meeting.client?.pseudonymizedId ??
      meeting.resident?.pseudonymizedId ??
      meetingId,
    meetingId,
    personType,
    personId: (meeting.clientId ?? meeting.residentId)?.toString(),
  };
}

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

type MeetingSlackParams = {
  staffEmail: string;
  stateCode: string;
  personPseudoId: string;
  meetingId: string;
  personType?: "client" | "resident";
  personId?: string;
  errorStep?: "stitching" | "transcription" | "notetaking";
  additionalInfo?: string;
};

export function buildMeetingCompletedMessage({
  staffEmail,
  stateCode,
  personPseudoId,
  meetingId,
  personType,
  personId,
}: MeetingSlackParams): string {
  const lines = [
    "Meeting completed",
    `• Staff: ${staffEmail}`,
    `• State: ${stateCode}`,
    `• Client/Resident Pseudonymized ID: ${personPseudoId}`,
    `• Person Type: ${personType ?? "unknown"}`,
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

export function buildMeetingFailureMessage({
  staffEmail,
  stateCode,
  personPseudoId,
  meetingId,
  personType,
  personId,
  errorStep,
  additionalInfo,
}: MeetingSlackParams): string {
  const lines = [
    `:warning: Meeting processing error`,
    `• Failed step: ${errorStep}`,
    `• Staff: ${staffEmail}`,
    `• State: ${stateCode}`,
    `• Client/Resident Pseudonymized ID: ${personPseudoId}`,
    `• Person Type: ${personType ?? "unknown"}`,
    `• Meeting ID: ${meetingId}`,
  ];

  if (additionalInfo) lines.push(`• Additional info: ${additionalInfo}`);

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
  params: MeetingSlackParams,
): Promise<void> {
  await postSlackMessage(buildMeetingCompletedMessage(params));
}

export async function postMeetingErrorNotification(
  params: MeetingSlackParams,
): Promise<void> {
  await postSlackMessage(buildMeetingFailureMessage(params));
}
