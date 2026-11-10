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
  type ParoleCommissionDecision,
  type Prisma,
  type ReleaseDecision,
} from "~@idaho-th/prisma/client";
import { deriveApprovalsOutcome } from "~@idaho-th/shared";
import {
  ALL_RELEASE_TASKS_INCOMPLETE,
  computeApprovalsWaitStatus,
  computeReleaseStageStatuses,
} from "~@idaho-th/trpc/routes/homePlan/homePlan.progression";
import { isRiderFormData } from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";

import {
  ADVANCE_STAGE_BAD_REQUEST,
  CLOSED_OUTCOME_TO_SUB_STAGE,
  STAGE_ORDER,
} from "./staffApplication.constants";
import { throwStaffApplicationBadRequest } from "./staffApplication.helpers";
import type { AdvanceStageApplicationRowWithStaff } from "./staffApplication.types";

export function isStrictlyForward(
  current: ApplicationStage,
  target: ApplicationStage,
): boolean {
  return STAGE_ORDER[target] > STAGE_ORDER[current];
}

export function resolveAdvanceStage(
  context: AdvanceStageApplicationRowWithStaff,
  targetStage: ApplicationStage,
  hasClosedOutcome: boolean,
): { selectedProviderId: string | null } {
  const currentStage = context.staffApplication.stage;

  if (currentStage === ApplicationStage.CLOSED) {
    throwStaffApplicationBadRequest(ADVANCE_STAGE_BAD_REQUEST.CASE_CLOSED);
  }

  if (currentStage === ApplicationStage.DRAFT) {
    throwStaffApplicationBadRequest(ADVANCE_STAGE_BAD_REQUEST.CASE_DRAFT);
  }

  if (!isStrictlyForward(currentStage, targetStage)) {
    throwStaffApplicationBadRequest(ADVANCE_STAGE_BAD_REQUEST.NOT_FORWARD);
  }

  if (
    (targetStage === ApplicationStage.APPROVALS ||
      targetStage === ApplicationStage.RELEASE) &&
    context.homePlan == null
  ) {
    throwStaffApplicationBadRequest(
      ADVANCE_STAGE_BAD_REQUEST.HOME_PLAN_REQUIRED,
    );
  }

  // Nothing in the UI advances straight to Release any more — the Approvals-to-
  // Release shortcut goes through setHomePlanApprovals — so this only closes the
  // hole where a direct API call could park a case in Release with no approvals.
  if (
    targetStage === ApplicationStage.RELEASE &&
    deriveApprovalsOutcome({
      isRider: isRiderFormData(context.formData),
      hasHomePlan: context.homePlan != null,
      paroleCommissionDecision:
        context.staffApplication.paroleCommissionDecision,
      releaseDecision: context.homePlan?.releaseDecision ?? null,
      homePlanInvestigation: context.homePlan?.homePlanInvestigation ?? null,
    }).type !== "ADVANCE"
  ) {
    throwStaffApplicationBadRequest(
      ADVANCE_STAGE_BAD_REQUEST.APPROVALS_REQUIRED,
    );
  }

  if (hasClosedOutcome && targetStage !== ApplicationStage.CLOSED) {
    throwStaffApplicationBadRequest(
      ADVANCE_STAGE_BAD_REQUEST.CLOSED_OUTCOME_NOT_ALLOWED,
    );
  }

  return { selectedProviderId: context.homePlan?.selectedProviderId ?? null };
}

export function mapClosedOutcomeToSubStage(
  outcome: ClosedOutcome | null | undefined,
): ApplicationSubStage {
  if (outcome == null) {
    return ApplicationSubStage.CANCELED;
  }
  return CLOSED_OUTCOME_TO_SUB_STAGE[outcome];
}

function resolveClosedCaseProviderSubStage(
  subStage: ApplicationSubStage,
): ApplicationSubStage {
  if (subStage === ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED) {
    return ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED;
  }
  return ApplicationSubStage.CANCELED;
}

export type AdvanceStageProviderApplication = {
  id: string;
  providerId: string;
  stage: ApplicationStage;
  subStage: ApplicationSubStage;
};

export type BuildAdvanceStageWriteDataArgs = {
  targetStage: ApplicationStage;
  closedOutcome?: ClosedOutcome;
  closedOutcomeNote?: string;
  selectedProviderId: string | null;
  providerApplications: AdvanceStageProviderApplication[];
  // The release-side decisions already recorded, for the Approvals wait status.
  paroleCommissionDecision?: ParoleCommissionDecision | null;
  releaseDecision?: ReleaseDecision | null;
};

function findSelectedProviderApplicationId(
  providerApplications: AdvanceStageProviderApplication[],
  selectedProviderId: string | null,
): string | null {
  if (selectedProviderId == null) {
    return null;
  }
  return (
    providerApplications.find((row) => row.providerId === selectedProviderId)
      ?.id ?? null
  );
}

function buildSelectedProviderUpdate(
  selectedProviderApplicationId: string | null,
  data: Prisma.ProviderHousingApplicationUpdateInput,
): Prisma.HousingApplicationUpdateInput["providerApplications"] {
  if (selectedProviderApplicationId == null) {
    return undefined;
  }
  return {
    update: [{ where: { id: selectedProviderApplicationId }, data }],
  };
}

export function buildAdvanceStageWriteData({
  targetStage,
  closedOutcome,
  closedOutcomeNote,
  selectedProviderId,
  providerApplications,
  paroleCommissionDecision = null,
  releaseDecision = null,
}: BuildAdvanceStageWriteDataArgs): Prisma.HousingApplicationUpdateInput {
  const selectedProviderApplicationId = findSelectedProviderApplicationId(
    providerApplications,
    selectedProviderId,
  );

  if (targetStage === ApplicationStage.APPROVALS) {
    // Both parties wait on an external stakeholder during Approvals (PRD §2.3).
    return {
      staffApplication: {
        update: {
          stage: ApplicationStage.APPROVALS,
          status: computeApprovalsWaitStatus({
            paroleCommissionDecision,
            releaseDecision,
          }),
        },
      },
      providerApplications: buildSelectedProviderUpdate(
        selectedProviderApplicationId,
        {
          stage: ApplicationStage.APPROVALS,
          status: ApplicationStatus.WAITING,
        },
      ),
    };
  }

  if (targetStage === ApplicationStage.RELEASE) {
    const { staffStatus, selectedProviderStatus } = computeReleaseStageStatuses(
      ALL_RELEASE_TASKS_INCOMPLETE,
    );
    return {
      staffApplication: {
        update: {
          stage: ApplicationStage.RELEASE,
          status: staffStatus,
        },
      },
      providerApplications: buildSelectedProviderUpdate(
        selectedProviderApplicationId,
        {
          stage: ApplicationStage.RELEASE,
          status: selectedProviderStatus,
        },
      ),
    };
  }

  if (targetStage !== ApplicationStage.CLOSED) {
    throw new Error(`Unhandled targetStage: ${targetStage}`);
  }

  const closedSubStage = mapClosedOutcomeToSubStage(closedOutcome);

  // Only the home-plan provider the client actually released to is RELEASED;
  // every other still-open provider application is CANCELED, except one that
  // revoked, which keeps its revoke. Providers already CLOSED keep the
  // sub-stage they were closed with — re-closing them here would resurrect
  // (e.g.) a CANCELED provider as RELEASED.
  const releasedProviderApplicationId =
    closedSubStage === ApplicationSubStage.RELEASED
      ? selectedProviderApplicationId
      : null;

  const providerUpdates = providerApplications
    .filter((row) => row.stage !== ApplicationStage.CLOSED)
    .map((row) => ({
      where: { id: row.id },
      data: {
        stage: ApplicationStage.CLOSED,
        subStage:
          row.id === releasedProviderApplicationId
            ? ApplicationSubStage.RELEASED
            : resolveClosedCaseProviderSubStage(row.subStage),
        status: ApplicationStatus.DONE,
      },
    }));

  return {
    staffApplication: {
      update: {
        stage: ApplicationStage.CLOSED,
        subStage: closedSubStage,
        status: ApplicationStatus.DONE,
        closedOutcome: closedOutcome ?? null,
        closedOutcomeNote:
          closedOutcome === ClosedOutcome.OTHER
            ? closedOutcomeNote ?? null
            : null,
      },
    },
    ...(providerUpdates.length === 0
      ? {}
      : { providerApplications: { update: providerUpdates } }),
  };
}
