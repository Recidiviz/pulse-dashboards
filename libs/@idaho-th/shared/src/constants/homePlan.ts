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

/** Rider-only court decision. */
export const ReleaseDecision = {
  PROBATION_GRANTED: "PROBATION_GRANTED",
  PROBATION_DENIED: "PROBATION_DENIED",
} as const;

export type ReleaseDecision =
  (typeof ReleaseDecision)[keyof typeof ReleaseDecision];

/** Termer / Parole Violator release decision. */
export const ParoleCommissionDecision = {
  PAROLE_GRANTED: "PAROLE_GRANTED",
  PAROLE_DENIED: "PAROLE_DENIED",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export type ParoleCommissionDecision =
  (typeof ParoleCommissionDecision)[keyof typeof ParoleCommissionDecision];

export const HomePlanInvestigationResult = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export type HomePlanInvestigationResult =
  (typeof HomePlanInvestigationResult)[keyof typeof HomePlanInvestigationResult];

export const HomePlanApprovalsBadge = {
  PENDING: "PENDING",
  HOUSING_PLAN_APPROVED: "HOUSING_PLAN_APPROVED",
  HOUSING_PLAN_REJECTED: "HOUSING_PLAN_REJECTED",
  RELEASE_DENIED: "RELEASE_DENIED",
} as const;

export type HomePlanApprovalsBadge =
  (typeof HomePlanApprovalsBadge)[keyof typeof HomePlanApprovalsBadge];

export const ReleaseTaskType = {
  RESIDENT_CONFIRMED_FUNDING: "RESIDENT_CONFIRMED_FUNDING",
  FUNDING_SECURED: "FUNDING_SECURED",
  HOUSING_DATE_REQUESTED: "HOUSING_DATE_REQUESTED",
  HOUSING_DATE_PROVIDED: "HOUSING_DATE_PROVIDED",
  BED_CONFIRMED: "BED_CONFIRMED",
  TRANSPORTATION_SECURED: "TRANSPORTATION_SECURED",
  TRANSPORTATION_INSTRUCTIONS: "TRANSPORTATION_INSTRUCTIONS",
} as const;

export type ReleaseTaskType =
  (typeof ReleaseTaskType)[keyof typeof ReleaseTaskType];

export const ReleaseTaskOwnerRole = {
  STAFF: "STAFF",
  PROVIDER: "PROVIDER",
} as const;

export type ReleaseTaskOwnerRole =
  (typeof ReleaseTaskOwnerRole)[keyof typeof ReleaseTaskOwnerRole];

export type ReleaseTaskDef = {
  label: string;
  ownerRole: ReleaseTaskOwnerRole;
  tooltip: string;
};

export const ORDERED_RELEASE_TASK_TYPES = [
  ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING,
  ReleaseTaskType.FUNDING_SECURED,
  ReleaseTaskType.HOUSING_DATE_REQUESTED,
  ReleaseTaskType.HOUSING_DATE_PROVIDED,
  ReleaseTaskType.BED_CONFIRMED,
  ReleaseTaskType.TRANSPORTATION_SECURED,
  ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS,
] as const satisfies readonly ReleaseTaskType[];

export type ActiveReleaseTaskType = (typeof ORDERED_RELEASE_TASK_TYPES)[number];

export type ReleaseTaskDetailType = "text" | "date";

export type ReleaseTaskDetailDef = {
  type: ReleaseTaskDetailType;
  /** When true, the task cannot be completed while its detail is empty. */
  required: boolean;
};

/**
 * Extra information a release task carries. The server input schema and both
 * views derive from this map, so adding a task here is the whole change.
 * Annotated rather than `as const` so `required` stays a boolean, not `false`.
 */
export const RELEASE_TASK_DETAILS: Partial<
  Record<ActiveReleaseTaskType, ReleaseTaskDetailDef>
> = {
  [ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING]: {
    type: "text",
    required: false,
  },
  [ReleaseTaskType.BED_CONFIRMED]: { type: "date", required: false },
  [ReleaseTaskType.TRANSPORTATION_SECURED]: { type: "text", required: false },
  [ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS]: {
    type: "text",
    required: false,
  },
};

export const RELEASE_TASK_DATE_INVALID_ERROR = "Enter a valid date.";

/** True when the task's detail is required and has no value yet. */
export const isRequiredReleaseTaskDetailMissing = (
  taskType: ActiveReleaseTaskType,
  values: { note?: string | null; date?: Date | null } | undefined,
): boolean => {
  const detail = RELEASE_TASK_DETAILS[taskType];
  if (!detail?.required) return false;

  return detail.type === "text" ? !values?.note : values?.date == null;
};

export const RELEASE_TASK_DEFS: Record<ActiveReleaseTaskType, ReleaseTaskDef> =
  {
    [ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING]: {
      label: "Funding Type Confirmed",
      ownerRole: ReleaseTaskOwnerRole.STAFF,
      tooltip:
        "The case manager has confirmed how the client will pay for their housing",
    },
    [ReleaseTaskType.FUNDING_SECURED]: {
      label: "Confirm Funding Has Been Received",
      ownerRole: ReleaseTaskOwnerRole.PROVIDER,
      tooltip:
        "The provider has received the necessary funding for the client's stay",
    },
    [ReleaseTaskType.HOUSING_DATE_REQUESTED]: {
      label: "Release Date Requested",
      ownerRole: ReleaseTaskOwnerRole.STAFF,
      tooltip:
        "The case manager has submitted a request for an updated release date",
    },
    [ReleaseTaskType.HOUSING_DATE_PROVIDED]: {
      label: "Release Date Provided",
      ownerRole: ReleaseTaskOwnerRole.STAFF,
      tooltip: "The case manager has entered the updated release date",
    },
    [ReleaseTaskType.BED_CONFIRMED]: {
      label: "Bed Confirmed",
      ownerRole: ReleaseTaskOwnerRole.PROVIDER,
      tooltip:
        "The provider has confirmed a bed is available for the client on their release date",
    },
    [ReleaseTaskType.TRANSPORTATION_SECURED]: {
      label: "Transportation Secured",
      ownerRole: ReleaseTaskOwnerRole.STAFF,
      tooltip:
        "The case manager has a plan for how the client will get to the facility on their release date",
    },
    [ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS]: {
      label: "Transportation Instructions",
      ownerRole: ReleaseTaskOwnerRole.PROVIDER,
      tooltip:
        "The Provider has shared instructions for how the resident can connect with the Provider. Ex. Meet at XYZ bus station at 1pm on 10/28",
    },
  };
