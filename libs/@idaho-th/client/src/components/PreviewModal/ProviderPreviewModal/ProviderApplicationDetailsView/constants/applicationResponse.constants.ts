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
  APPLICATION_STAGE,
  APPLICATION_SUB_STAGE,
  PROVIDER_RESPONSE_TYPE,
  type ProviderResponseType,
} from "~@idaho-th/shared";

import type { ApplicationClosedOutcome } from "../../../../../interfaces/common";
import type { SubmittedStatusBadgeVariant } from "../components/ApplicationResponseSelector.styles";

export const PROVIDER_APPLICATION_SUB_STAGE = {
  CONDITIONALLY_APPROVED: "CONDITIONALLY_APPROVED",
  SELECTED: "SELECTED",
} as const;

export type ProviderApplicationSubStage =
  | (typeof APPLICATION_SUB_STAGE)[keyof typeof APPLICATION_SUB_STAGE]
  | (typeof PROVIDER_APPLICATION_SUB_STAGE)[keyof typeof PROVIDER_APPLICATION_SUB_STAGE];

export type SubmittedStatusConfig = {
  badge: string;
  variant: SubmittedStatusBadgeVariant;
  centered?: boolean;
  compact?: boolean;
  footnote?: string;
};

export const SUBMITTED_STATUS: Record<string, SubmittedStatusConfig> = {
  [PROVIDER_APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED]: {
    badge: "Conditionally Approved",
    variant: "success",
  },
  [PROVIDER_APPLICATION_SUB_STAGE.SELECTED]: {
    badge: "Selected as Home Plan",
    variant: "homePlanSelected",
  },
  [APPLICATION_SUB_STAGE.INFO_NEEDED]: {
    badge: "Info Requested",
    variant: "info",
  },
  [APPLICATION_SUB_STAGE.DECLINED]: {
    badge: "Declined",
    variant: "attention",
    centered: true,
    compact: true,
  },
  [APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED]: {
    badge: "Approval Canceled",
    variant: "attention",
    centered: true,
    compact: true,
  },
  [APPLICATION_SUB_STAGE.CANCELED]: {
    badge: "Application Canceled",
    variant: "attention",
    centered: true,
    compact: true,
    footnote: "The client no longer needs housing and/or has other plans",
  },
  [APPLICATION_SUB_STAGE.RELEASED]: {
    badge: "Released",
    variant: "success",
    centered: true,
    compact: true,
    footnote:
      "This case is now closed, and the client is being released to your care. For any follow-ups, contact the Case Manager directly.",
  },
  [APPLICATION_SUB_STAGE.NOT_SELECTED]: {
    badge: "Provider Not Selected",
    variant: "attention",
    centered: true,
    compact: true,
    footnote: "The client selected a different home plan.",
  },
};

const CLOSED_FOOTNOTE =
  "This case was closed for an unspecified reason. Please contact the Case Manager directly if you have questions.";

const REVOKED_CLOSED_FOOTNOTE =
  "This case is now closed because you revoked the conditional approval. For any follow-ups, contact the Case Manager directly.";

export function getSubmittedStatus(
  subStage: string | null | undefined,
  closedOutcome: ApplicationClosedOutcome | undefined,
  isClosed = false,
): SubmittedStatusConfig {
  const defaultStatus = {
    badge: "Closed",
    variant: "info" as const,
    centered: true,
    compact: true,
    footnote: CLOSED_FOOTNOTE,
  };
  if (!subStage) return defaultStatus;

  if (
    subStage === APPLICATION_SUB_STAGE.CANCELED &&
    closedOutcome === "OTHER"
  ) {
    return defaultStatus;
  }

  if (subStage === APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED) {
    const revokedStatus = SUBMITTED_STATUS[subStage];
    return isClosed
      ? { ...revokedStatus, footnote: REVOKED_CLOSED_FOOTNOTE }
      : revokedStatus;
  }

  return SUBMITTED_STATUS[subStage] ?? defaultStatus;
}

export const SUBMITTED_RESPONSE_SUB_STAGES = new Set<string>([
  PROVIDER_APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED,
  PROVIDER_APPLICATION_SUB_STAGE.SELECTED,
  APPLICATION_SUB_STAGE.INFO_NEEDED,
  APPLICATION_SUB_STAGE.DECLINED,
  APPLICATION_SUB_STAGE.NOT_SELECTED,
  APPLICATION_SUB_STAGE.CANCELED,
  APPLICATION_SUB_STAGE.RELEASED,
  APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED,
]);

export const RESPONSES_WITH_CHANGE_SUB_STAGES = new Set<string>([
  APPLICATION_SUB_STAGE.INFO_NEEDED,
  APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED,
]);

/** Stages in which a home plan provider may still revoke. */
export const HOME_PLAN_REVOKABLE_STAGES = new Set<string>([
  APPLICATION_STAGE.APPROVALS,
]);

export const LOCKED_SUB_STAGES = new Set<string>([
  PROVIDER_APPLICATION_SUB_STAGE.SELECTED,
  APPLICATION_SUB_STAGE.NOT_SELECTED,
  APPLICATION_SUB_STAGE.CANCELED,
]);

export const SUB_STAGE_TO_RESPONSE_TYPE: Partial<
  Record<string, ProviderResponseType>
> = {
  [PROVIDER_APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED]:
    PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
  [APPLICATION_SUB_STAGE.INFO_NEEDED]: PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
  [PROVIDER_APPLICATION_SUB_STAGE.SELECTED]:
    PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
};
