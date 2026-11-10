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
  type ApplicationStage,
  type ParoleCommissionDecision,
  type ReleaseTaskType,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { formatIsoDate } from "~@idaho-th/trpc/utils/common";

import type { TimelineEventInput } from "./timeline.types";

const STAGE_LABEL: Record<ApplicationStage, string> = {
  DRAFT: "Draft",
  APPLICATION: "Application",
  APPROVALS: "Approvals",
  RELEASE: "Release",
  CLOSED: "Closed",
};

const RELEASE_TASK_LABEL: Record<ReleaseTaskType, string> = {
  RESIDENT_CONFIRMED_FUNDING: "Resident Has Secured Funding",
  FUNDING_SECURED: "Funding Has Been Received",
  HOUSING_DATE_REQUESTED: "Release Date Requested",
  HOUSING_DATE_PROVIDED: "Release Date Provided",
  BED_CONFIRMED: "Bed Confirmed",
  TRANSPORTATION_SECURED: "Transportation Secured",
  TRANSPORTATION_INSTRUCTIONS: "Transportation Instructions",
};

// The completed-task message is the label in sentence case (e.g.
// "Funding Has Been Received" -> "Funding has been received").
function toSentenceCase(label: string): string {
  return label.charAt(0) + label.slice(1).toLowerCase();
}

function releaseTaskDescription(
  taskType: ReleaseTaskType,
  completed: boolean,
): string {
  const label = RELEASE_TASK_LABEL[taskType];
  return completed ? toSentenceCase(label) : `${label} marked incomplete`;
}

const PAROLE_COMMISSION_DECISION_LABEL: Record<
  ParoleCommissionDecision,
  string
> = {
  PAROLE_GRANTED: "Parole granted",
  PAROLE_DENIED: "Parole denied",
  NOT_APPLICABLE: "Not applicable (sentence fully served)",
};

const CLOSED_STAGE_DESCRIPTION = "Stage set to 'Closed'";

type TimelineEventDescriptionBuilder<K extends TimelineEventInput["type"]> = (
  input: Extract<TimelineEventInput, { type: K }>,
) => string;

const TIMELINE_EVENT_DESCRIPTION_BUILDERS: {
  [K in TimelineEventInput["type"]]: TimelineEventDescriptionBuilder<K>;
} = {
  [TimelineEventType.APPLICATION_CREATED]: () =>
    "Application created for client",
  [TimelineEventType.APPLICATION_SENT_TO_PROVIDERS]: () =>
    "Application submitted to providers",
  [TimelineEventType.PROVIDER_CONDITIONALLY_APPROVED]: (input) =>
    `${input.providerName} conditionally approved`,
  [TimelineEventType.PROVIDER_DECLINED]: (input) =>
    `${input.providerName} declined`,
  [TimelineEventType.PROVIDER_REQUESTED_INFO]: (input) =>
    `${input.providerName} requested more information`,
  [TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST]: (input) =>
    `Responded to information request from ${input.providerName}`,
  [TimelineEventType.PROVIDER_SELECTED_AS_HOME_PLAN]: (input) =>
    `Home plan set: ${input.providerName}`,
  [TimelineEventType.PROVIDER_NOT_SELECTED]: () => CLOSED_STAGE_DESCRIPTION,
  [TimelineEventType.PROVIDER_CANCELED]: () => CLOSED_STAGE_DESCRIPTION,
  [TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL]: (input) =>
    `${input.providerName} revoked their conditional approval`,
  [TimelineEventType.HOME_PLAN_ADDRESS_SET]: (input) =>
    `Home plan set: ${input.streetAddress}`,
  [TimelineEventType.EXPECTED_RELEASE_DATE_UPDATED]: (input) =>
    `Release date changed to: ${formatIsoDate(input.expectedReleaseDate)}`,
  [TimelineEventType.STAGE_ADVANCED]: (input) =>
    `Stage set to '${STAGE_LABEL[input.toStage]}'`,
  [TimelineEventType.APPROVALS_HOUSING_PLAN_APPROVED]: () =>
    "Housing plan approved",
  [TimelineEventType.APPROVALS_HOUSING_PLAN_REJECTED]: () =>
    "Housing plan rejected",
  [TimelineEventType.PAROLE_COMMISSION_DECISION_RECORDED]: (input) =>
    `Parole Commission Decision recorded: ${PAROLE_COMMISSION_DECISION_LABEL[input.decision]}`,
  [TimelineEventType.RELEASE_TASK_UPDATED]: (input) =>
    releaseTaskDescription(input.releaseTaskType, input.completed),
  [TimelineEventType.RELEASE_TASK_NOTE_UPDATED]: (input) =>
    `${RELEASE_TASK_LABEL[input.releaseTaskType]} note updated`,
  [TimelineEventType.CASE_CLOSED]: () => CLOSED_STAGE_DESCRIPTION,
  [TimelineEventType.DOCUMENT_UPLOADED]: (input) =>
    input.providerName
      ? `${input.providerName} uploaded ${input.fileName}`
      : `Document ${input.fileName} uploaded`,
  [TimelineEventType.DOCUMENT_DOWNLOADED]: (input) =>
    `Document ${input.fileName} downloaded by ${input.downloadedByRole}`,
};

export function buildTimelineEventDescription(
  input: TimelineEventInput,
): string {
  return TIMELINE_EVENT_DESCRIPTION_BUILDERS[input.type](input as never);
}
