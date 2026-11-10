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
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
} from "~@idaho-th/prisma/client";

// The Commission can rule before a home plan exists, so the decision opens with
// the Application stage and freezes once the case reaches Release.
export const PAROLE_COMMISSION_DECISION_STAGES = new Set<ApplicationStage>([
  ApplicationStage.APPLICATION,
  ApplicationStage.APPROVALS,
]);

export const STAFF_APPLICATION_NOT_FOUND = {
  STAFF_APPLICATION: "Application not found for this staff member",
} as const;

export const ADVANCE_STAGE_BAD_REQUEST = {
  CASE_CLOSED: "This application is closed and cannot be modified",
  CASE_DRAFT:
    "This application is still a draft and cannot be advanced until submitted",
  NOT_FORWARD: "A case can only be advanced to a later stage",
  HOME_PLAN_REQUIRED:
    "A home plan must be set before advancing to Approvals or Release",
  APPROVALS_REQUIRED:
    "Approvals must be recorded before advancing to the Release stage",
  CLOSED_OUTCOME_NOT_ALLOWED:
    "A closed outcome can only be provided when closing a case",
} as const;

export const RELEASE_FLOW_BAD_REQUEST = {
  PAROLE_DECISION_NOT_FOR_RIDER:
    "A Parole Commission Decision can't be recorded for a Rider",
  PAROLE_DECISION_STAGE:
    "A Parole Commission Decision can only be recorded during the Application or Approvals stage",
  CURRENT_STATUS_LOCKED:
    "Current Status can't change once a parole or probation decision is saved",
} as const;

export const DUPLICATE_APPLICATION_BAD_REQUEST = {
  ALREADY_DUPLICATED: "This application has already been duplicated",
} as const;

/**
 * A case the chosen home plan provider closed by revoking. The case manager
 * can still duplicate it (from either status) or mark it done.
 */
const REVOKED_CLOSED_CASE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.ACTION_NEEDED,
  ApplicationStatus.DONE,
];

export const REVOKED_CLOSED_CASE_WHERE = {
  stage: ApplicationStage.CLOSED,
  subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
  status: { in: REVOKED_CLOSED_CASE_STATUSES },
} as const;

/**
 * A case closed because its home plan was rejected. The case manager can still
 * duplicate it, once, to resend it to other providers. (A denied release closes
 * the same way but has no such follow-up, so it is deliberately left out.)
 */
export const HOUSING_PLAN_REJECTED_CLOSED_CASE_WHERE = {
  stage: ApplicationStage.CLOSED,
  closedOutcome: ClosedOutcome.HOUSING_PLAN_REJECTED,
} as const;

export const STAGE_ORDER: Record<ApplicationStage, number> = {
  [ApplicationStage.DRAFT]: -1,
  [ApplicationStage.APPLICATION]: 0,
  [ApplicationStage.APPROVALS]: 1,
  [ApplicationStage.RELEASE]: 2,
  [ApplicationStage.CLOSED]: 3,
};

export const CLOSED_OUTCOME_TO_SUB_STAGE = {
  [ClosedOutcome.CLIENT_RELEASED]: ApplicationSubStage.RELEASED,
  [ClosedOutcome.RELEASE_DENIED]: ApplicationSubStage.PLAN_REJECTED,
  [ClosedOutcome.HOUSING_PLAN_REJECTED]: ApplicationSubStage.PLAN_REJECTED,
  [ClosedOutcome.APPLICATION_WITHDRAWN]: ApplicationSubStage.CANCELED,
  [ClosedOutcome.OTHER]: ApplicationSubStage.CANCELED,
} as const satisfies Record<ClosedOutcome, ApplicationSubStage>;
