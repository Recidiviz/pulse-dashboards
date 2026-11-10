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

export type ApplicationStatus =
  | "ACTION_NEEDED"
  | "WAITING"
  | "WAITING_ON_PAROLE_BOARD"
  | "WAITING_ON_PP"
  | "AWAITING_RELEASE"
  | "DONE";

export type ApplicationSubStage =
  (typeof APPLICATION_SUB_STAGE)[keyof typeof APPLICATION_SUB_STAGE];

export type ApplicationStage =
  (typeof APPLICATION_STAGE)[keyof typeof APPLICATION_STAGE];

export const APPLICATION_STAGE = {
  DRAFT: "DRAFT",
  APPLICATION: "APPLICATION",
  APPROVALS: "APPROVALS",
  RELEASE: "RELEASE",
  CLOSED: "CLOSED",
} as const;

export const STAGES_WITHOUT_SUBSTAGE = new Set<string>([
  APPLICATION_STAGE.DRAFT,
  APPLICATION_STAGE.APPROVALS,
  APPLICATION_STAGE.CLOSED,
]);

export const APPLICATION_SUB_STAGE = {
  PROVIDER_REVIEW: "PROVIDER_REVIEW",
  OFFERS_RECEIVED: "OFFERS_RECEIVED",
  CONDITIONALLY_APPROVED: "CONDITIONALLY_APPROVED",
  INFO_NEEDED: "INFO_NEEDED",
  DECLINED: "DECLINED",
  RELEASED: "RELEASED",
  PLAN_REJECTED: "PLAN_REJECTED",
  CANCELED: "CANCELED",
  SELECTED: "SELECTED",
  NOT_SELECTED: "NOT_SELECTED",
  CONDITIONAL_APPROVAL_REVOKED: "CONDITIONAL_APPROVAL_REVOKED",
} as const;

export const APPLICATION_SUB_STAGE_LABELS: Record<ApplicationSubStage, string> =
  {
    [APPLICATION_SUB_STAGE.PROVIDER_REVIEW]: "Provider Review",
    [APPLICATION_SUB_STAGE.OFFERS_RECEIVED]: "Offers Received",
    [APPLICATION_SUB_STAGE.INFO_NEEDED]: "Info Needed",
    [APPLICATION_SUB_STAGE.DECLINED]: "Declined",
    [APPLICATION_SUB_STAGE.RELEASED]: "Released",
    [APPLICATION_SUB_STAGE.PLAN_REJECTED]: "Plan Rejected",
    [APPLICATION_SUB_STAGE.CANCELED]: "Canceled",
    [APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED]: "Conditionally Approved",
    [APPLICATION_SUB_STAGE.SELECTED]: "Selected",
    [APPLICATION_SUB_STAGE.NOT_SELECTED]: "Not Selected",
    [APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED]:
      "Conditional Approval Revoked",
  };

export const HOUSING_APPLICATION_STATUS = {
  PENDING: "PENDING",
  ACTION_REQUIRED: "ACTION_REQUIRED",
  COMPLETE: "COMPLETE",
} as const;

export const APPLICATION_STATUS = {
  ACTION_NEEDED: "ACTION_NEEDED",
  WAITING: "WAITING",
  WAITING_ON_PAROLE_BOARD: "WAITING_ON_PAROLE_BOARD",
  WAITING_ON_PP: "WAITING_ON_PP",
  AWAITING_RELEASE: "AWAITING_RELEASE",
  DONE: "DONE",
} as const;

export const ApplicationIntakeStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
} as const;

export type ApplicationIntakeStatus =
  (typeof ApplicationIntakeStatus)[keyof typeof ApplicationIntakeStatus];

export const PROVIDER_RESPONSE_TYPE = {
  CONDITIONALLY_APPROVE: "CONDITIONALLY_APPROVE",
  DECLINE: "DECLINE",
  INFO_NEEDED: "INFO_NEEDED",
  REVOKE_CONDITIONAL_APPROVAL: "REVOKE_CONDITIONAL_APPROVAL",
} as const;

export type ProviderResponseType =
  (typeof PROVIDER_RESPONSE_TYPE)[keyof typeof PROVIDER_RESPONSE_TYPE];

export const PROVIDER_RESPONSE_STATUS_MESSAGE = {
  [PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE]:
    "Conditional approval submitted",
  [PROVIDER_RESPONSE_TYPE.DECLINE]: "Application declined",
  [PROVIDER_RESPONSE_TYPE.INFO_NEEDED]: "Information request submitted",
  [PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL]:
    "Conditional approval revoked",
} as const satisfies Record<ProviderResponseType, string>;

export const INFO_REQUEST_MESSAGE_MAX_LENGTH = 2000;

export const CLOSED_OUTCOME_NOTE_MAX_LENGTH = 2000;

export const ELIGIBILITY_OVERRIDE_NOTE_MAX_LENGTH = 1000;

export const HOME_PLAN_ADDRESS_MAX_LENGTH = 500;

export const RELEASE_TASK_NOTE_MAX_LENGTH = 280;

/**
 * "Last Updated" column state for the dashboard, per PRD §4:
 * - NEW_UPDATES: another user acted on this application's timeline after the
 *   current viewer last opened the client's modal.
 * - NO_UPDATES_30D: no action has been taken on this application by any user
 *   in the past 30 days.
 */
export const APPLICATION_LAST_UPDATED_STATUS = {
  NEW_UPDATES: "NEW_UPDATES",
  NO_UPDATES_30D: "NO_UPDATES_30D",
} as const;

export type ApplicationLastUpdatedStatus =
  (typeof APPLICATION_LAST_UPDATED_STATUS)[keyof typeof APPLICATION_LAST_UPDATED_STATUS];

export const DEFAULT_NEW_HOUSING_APPLICATION = {
  stage: APPLICATION_STAGE.APPLICATION,
  subStage: APPLICATION_SUB_STAGE.PROVIDER_REVIEW,
  status: HOUSING_APPLICATION_STATUS.PENDING,
  responses: 0,
} as const;
