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

import { TRPCError } from "@trpc/server";
import { differenceInCalendarDays, isSameDay } from "date-fns";

import {
  AlertType,
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
  type Prisma,
  type PrismaClient,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { deriveApprovalsOutcome } from "~@idaho-th/shared";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import {
  createAlerts,
  supersedeAlerts,
} from "~@idaho-th/trpc/routes/alert/alert.helpers";
import { computeApprovalsWaitStatus } from "~@idaho-th/trpc/routes/homePlan/homePlan.progression";
import { ELIGIBLE_PROVIDER_STAFF_SELECT } from "~@idaho-th/trpc/routes/housing-common/eligibleProvider.selects";
import {
  assertReleaseDateNotInPast,
  assertStaffCaseApplicationStage,
  assertStaffCaseModifiable,
  assertStaffCaseNotClosed,
  handleHousingApplicationWriteError,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import {
  HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  isRiderFormData,
  lockHousingApplicationForUpdate,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import {
  preferredProvidersCreate,
  splitPreferredProviders,
} from "~@idaho-th/trpc/routes/housing-common/preferredProviders.helpers";
import { CLOSED_WITHOUT_PROVIDER_WHERE } from "~@idaho-th/trpc/routes/listingApplication/listingApplication.helpers";
import {
  buildInitialApplicationTimelineEventsCreate,
  recordTimelineEvent,
  withTimelineAnalytics,
} from "~@idaho-th/trpc/routes/timeline/timeline.events";

import {
  buildAdvanceStageTimelineEventArgs,
  findStaffAdvanceStageApplication,
  requireStaffAdvanceStageApplication,
  updateHousingApplicationAdvanceStage,
} from "./advanceStage.helpers";
import {
  buildAdvanceStageWriteData,
  resolveAdvanceStage,
} from "./advanceStage.progression";
import {
  PAROLE_COMMISSION_DECISION_STAGES,
  RELEASE_FLOW_BAD_REQUEST,
  REVOKED_CLOSED_CASE_WHERE,
  STAFF_APPLICATION_NOT_FOUND,
} from "./staffApplication.constants";
import {
  assertCurrentStatusCohortUnchanged,
  buildHousingApplicationUpdatePayload,
  deleteHousingApplicationById,
  findStaffOwnedApplication,
  findStaffParoleCommissionDecisionApplication,
  insertHousingApplication,
  parseCreateApplicationFormFields,
  patchStoredHousingNeededDate,
  readStoredHousingNeededDate,
  replaceDerivedEligibleProviders,
  resolveEligibleProviderCreates,
  throwStaffApplicationBadRequest,
  throwStaffApplicationNotFound,
  updateHousingApplicationById,
} from "./staffApplication.helpers";
import type {
  AcknowledgeApprovalRevokedInput,
  AdvanceApplicationStageInput,
  AdvanceApplicationStageResult,
  CreateHousingApplicationInput,
  DeleteHousingApplicationInput,
  SetParoleCommissionDecisionInput,
  UpdateHousingApplicationInput,
} from "./staffApplication.types";

export async function createHousingApplication(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: CreateHousingApplicationInput,
) {
  const { formData } = input;
  const { clientName, idocNumber, expectedReleaseDate } =
    parseCreateApplicationFormFields(formData);

  const eligibleCreates = await resolveEligibleProviderCreates(
    prisma,
    formData,
  );
  const { formData: storedFormData, preferredProviderIds } =
    splitPreferredProviders(formData);

  return insertHousingApplication(prisma, {
    stateCode: IDAHO_TH_STATE_CODE,
    clientName,
    formData: storedFormData,
    preferredProviders: preferredProvidersCreate(preferredProviderIds),
    idocNumber,
    expectedReleaseDate,
    staffApplication: {
      create: {
        staffPseudonymizedId,
        intakeStatus: ApplicationIntakeStatus.SUBMITTED,
        stage: ApplicationStage.APPLICATION,
        subStage: ApplicationSubStage.PROVIDER_REVIEW,
        status: ApplicationStatus.ACTION_NEEDED,
      },
    },
    timelineEvents: {
      create: buildInitialApplicationTimelineEventsCreate(
        staffPseudonymizedId,
        ApplicationStage.APPLICATION,
      ),
    },
    eligibleProviders: {
      create: eligibleCreates,
    },
  }).catch(handleHousingApplicationWriteError);
}

/**
 * A release-date change supersedes the previous change's alerts, then alerts
 * every provider on the case right now. A provider sent the case later is not
 * told about a change it never witnessed.
 */
async function replaceReleaseDateChangedAlerts(
  tx: Prisma.TransactionClient,
  {
    applicationId,
    staffPseudonymizedId,
    previousDate,
    newDate,
  }: {
    applicationId: string;
    staffPseudonymizedId: string;
    previousDate: Date;
    newDate: Date;
  },
): Promise<void> {
  await supersedeAlerts(tx, {
    type: AlertType.RELEASE_DATE_CHANGED,
    applicationId,
    dismissedByPseudonymizedId: staffPseudonymizedId,
  });

  const activeMatches = await tx.providerHousingApplication.findMany({
    where: { applicationId, NOT: CLOSED_WITHOUT_PROVIDER_WHERE },
    select: { providerId: true },
  });

  await createAlerts(tx, {
    type: AlertType.RELEASE_DATE_CHANGED,
    applicationId,
    recipients: activeMatches,
    metadata: {
      deltaDays: differenceInCalendarDays(newDate, previousDate),
    },
  });
}

export async function updateHousingApplication(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: UpdateHousingApplicationInput,
) {
  const { id, data } = input;

  const owned = await findStaffOwnedApplication(
    prisma,
    id,
    staffPseudonymizedId,
  );
  if (!owned) return null;

  const updatedApplication = await withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, id);

      // Re-read inside the lock: a concurrent advanceStage (or another save)
      // may have committed stage/release-date/formData changes while this
      // request waited on the lock, and validation must see that, not the
      // snapshot read before the lock.
      const staffApp = await findStaffOwnedApplication(
        tx,
        id,
        staffPseudonymizedId,
      );
      if (!staffApp) {
        throwStaffApplicationNotFound(
          STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
        );
      }

      assertStaffCaseModifiable(staffApp.stage);
      assertReleaseDateNotInPast(data, {
        expectedReleaseDate: staffApp.application.expectedReleaseDate,
        tpdHousingNeededDate: readStoredHousingNeededDate(
          staffApp.application.formData,
        ),
      });

      if (
        data.addEligibleProviders?.length ||
        data.removeEligibleProviderIds?.length ||
        data.formData
      ) {
        assertStaffCaseApplicationStage(staffApp.stage);
      }

      if (data.formData) {
        assertCurrentStatusCohortUnchanged(
          staffApp,
          data.formData.legalCurrentStatus,
        );
      }

      const updatePayload = buildHousingApplicationUpdatePayload(data);

      if (
        data.expectedReleaseDate !== undefined &&
        data.formData === undefined
      ) {
        const patchedFormData = patchStoredHousingNeededDate(
          staffApp.application.formData,
          data.expectedReleaseDate || null,
        );
        if (patchedFormData !== null) {
          updatePayload.formData = patchedFormData;
        }
      }

      const updatedExpectedReleaseDate =
        updatePayload.expectedReleaseDate instanceof Date
          ? updatePayload.expectedReleaseDate
          : null;

      const previousExpectedReleaseDate =
        staffApp.application.expectedReleaseDate;
      if (
        updatedExpectedReleaseDate != null &&
        previousExpectedReleaseDate != null &&
        !isSameDay(updatedExpectedReleaseDate, previousExpectedReleaseDate)
      ) {
        await replaceReleaseDateChangedAlerts(tx, {
          applicationId: id,
          staffPseudonymizedId,
          previousDate: previousExpectedReleaseDate,
          newDate: updatedExpectedReleaseDate,
        });
      }

      // formData is the sole source of eligibility inputs, so a changed formData
      // must re-derive the eligible-provider allowlist that sendApplicationToProviders
      // reads — otherwise the persisted allowlist can silently diverge from the
      // form it was supposedly computed from.
      const eligibleCreates = data.formData
        ? await resolveEligibleProviderCreates(tx, data.formData)
        : null;

      if (eligibleCreates != null) {
        await replaceDerivedEligibleProviders(tx, id, eligibleCreates);
      }

      const updatedApplication = await updateHousingApplicationById(
        tx,
        id,
        updatePayload,
      );

      if (updatedExpectedReleaseDate != null) {
        await recordTimelineEvent(tx, {
          applicationId: id,
          actor: {
            role: TimelineActorRole.STAFF,
            pseudonymizedId: staffPseudonymizedId,
          },
          type: TimelineEventType.EXPECTED_RELEASE_DATE_UPDATED,
          expectedReleaseDate: updatedExpectedReleaseDate
            .toISOString()
            .slice(0, 10),
        });
      }

      return updatedApplication;
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  ).catch(handleHousingApplicationWriteError);
  return updatedApplication;
}

export async function advanceApplicationStage(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: AdvanceApplicationStageInput,
): Promise<AdvanceApplicationStageResult> {
  const { applicationId, targetStage, closedOutcome, closedOutcomeNote } =
    input;

  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      const housingApp = await findStaffAdvanceStageApplication(
        tx,
        applicationId,
        staffPseudonymizedId,
      );
      requireStaffAdvanceStageApplication(housingApp);

      const fromStage = housingApp.staffApplication.stage;
      const { selectedProviderId } = resolveAdvanceStage(
        housingApp,
        targetStage,
        closedOutcome != null,
      );

      const updated = await updateHousingApplicationAdvanceStage(
        tx,
        applicationId,
        buildAdvanceStageWriteData({
          targetStage,
          closedOutcome,
          closedOutcomeNote,
          selectedProviderId,
          providerApplications: housingApp.providerApplications,
          paroleCommissionDecision:
            housingApp.staffApplication.paroleCommissionDecision,
          releaseDecision: housingApp.homePlan?.releaseDecision ?? null,
        }),
      );

      await recordTimelineEvent(
        tx,
        buildAdvanceStageTimelineEventArgs({
          applicationId,
          staffPseudonymizedId,
          fromStage,
          targetStage,
          closedOutcome,
        }),
      );

      const { staffApplication } = updated;
      if (staffApplication == null) {
        throwStaffApplicationNotFound(
          STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
        );
      }

      return { applicationId, ...staffApplication };
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}

/**
 * "Mark as done" on a case the home plan provider closed by revoking. Only
 * moves the status, and records no timeline event: it is triage, not a change
 * to the case.
 */
export async function acknowledgeApprovalRevoked(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: AcknowledgeApprovalRevokedInput,
): Promise<{ applicationId: string }> {
  // The ownership and state checks live in the where clause, so the check and
  // the write cannot race.
  const { count } = await prisma.staffHousingApplication.updateMany({
    where: {
      applicationId: input.applicationId,
      staffPseudonymizedId,
      stage: REVOKED_CLOSED_CASE_WHERE.stage,
      subStage: REVOKED_CLOSED_CASE_WHERE.subStage,
      status: ApplicationStatus.ACTION_NEEDED,
    },
    data: { status: ApplicationStatus.DONE },
  });

  if (count === 0) {
    throwStaffApplicationNotFound(
      STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
    );
  }

  return { applicationId: input.applicationId };
}

export async function deleteHousingApplication(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: DeleteHousingApplicationInput,
) {
  const owned = await findStaffOwnedApplication(
    prisma,
    input.id,
    staffPseudonymizedId,
  );
  if (!owned) return { count: 0 };

  // Intentionally allows DRAFT: staff may discard an unsubmitted draft.
  // Only CLOSED applications cannot be deleted.
  assertStaffCaseNotClosed(owned.stage);

  return deleteHousingApplicationById(prisma, input.id);
}

export async function toggleEligibleProviderSelection(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: {
    applicationId: string;
    providers: { providerId: string; isSelected: boolean | null }[];
  },
) {
  const { applicationId, providers } = input;
  const owned = await findStaffOwnedApplication(
    prisma,
    applicationId,
    staffPseudonymizedId,
  );

  if (!owned) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not authorized to modify this application",
    });
  }

  assertStaffCaseApplicationStage(owned.stage);

  return prisma.$transaction(
    providers.map(({ providerId, isSelected }) =>
      prisma.eligibleHousingProvider.update({
        where: {
          applicationId_providerId: {
            applicationId,
            providerId,
          },
        },
        data: { isSelected },
        select: ELIGIBLE_PROVIDER_STAFF_SELECT,
      }),
    ),
  );
}

/**
 * Records the Parole Commission Decision for a Termer/PV case and runs the
 * release gate: a denial closes the case (and every open provider application),
 * a cleared decision with a cleared home plan investigation advances it to
 * Release, and anything else only stores the value.
 */
export async function setParoleCommissionDecision(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: SetParoleCommissionDecisionInput,
): Promise<{ applicationId: string; stage: ApplicationStage }> {
  const { applicationId, decision } = input;

  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      const housingApp = await findStaffParoleCommissionDecisionApplication(
        tx,
        applicationId,
        staffPseudonymizedId,
      );

      if (housingApp?.staffApplication == null) {
        throwStaffApplicationNotFound(
          STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
        );
      }

      const fromStage = housingApp.staffApplication.stage;
      if (!PAROLE_COMMISSION_DECISION_STAGES.has(fromStage)) {
        throwStaffApplicationBadRequest(
          RELEASE_FLOW_BAD_REQUEST.PAROLE_DECISION_STAGE,
        );
      }

      if (isRiderFormData(housingApp.formData)) {
        throwStaffApplicationBadRequest(
          RELEASE_FLOW_BAD_REQUEST.PAROLE_DECISION_NOT_FOR_RIDER,
        );
      }

      // A resend from a stale tab or a retry changes nothing, so it records nothing.
      if (decision === housingApp.staffApplication.paroleCommissionDecision) {
        return { applicationId, stage: fromStage };
      }

      const outcome = deriveApprovalsOutcome({
        isRider: false,
        hasHomePlan: housingApp.homePlan != null,
        paroleCommissionDecision: decision,
        releaseDecision: null,
        homePlanInvestigation:
          housingApp.homePlan?.homePlanInvestigation ?? null,
      });

      const actor = {
        role: TimelineActorRole.STAFF,
        pseudonymizedId: staffPseudonymizedId,
      } as const;

      // Recorded before any close: no event but CASE_CLOSED lands on a closed case.
      await recordTimelineEvent(tx, {
        applicationId,
        actor,
        type: TimelineEventType.PAROLE_COMMISSION_DECISION_RECORDED,
        decision,
        cmOnly: true,
      });

      await tx.housingApplication.update({
        where: { id: applicationId },
        data: {
          lastActivityAt: new Date(),
          staffApplication: {
            update: {
              paroleCommissionDecision: decision,
              // In Application the case still waits on providers, so its
              // status is theirs to set.
              ...(outcome.type === "WAIT" &&
              fromStage === ApplicationStage.APPROVALS
                ? {
                    status: computeApprovalsWaitStatus({
                      paroleCommissionDecision: decision,
                      releaseDecision: null,
                    }),
                  }
                : {}),
            },
          },
          ...(outcome.type === "ADVANCE"
            ? {
                homePlan: {
                  update: {
                    approvalsAt: new Date(),
                    approvalsByStaffPseudonymizedId: staffPseudonymizedId,
                  },
                },
              }
            : {}),
        },
      });

      if (outcome.type === "WAIT") {
        return { applicationId, stage: fromStage };
      }

      const targetStage =
        outcome.type === "ADVANCE"
          ? ApplicationStage.RELEASE
          : ApplicationStage.CLOSED;
      const closedOutcome =
        outcome.type === "CLOSE" ? ClosedOutcome.RELEASE_DENIED : undefined;

      await updateHousingApplicationAdvanceStage(
        tx,
        applicationId,
        buildAdvanceStageWriteData({
          targetStage,
          closedOutcome,
          selectedProviderId: housingApp.homePlan?.selectedProviderId ?? null,
          providerApplications: housingApp.providerApplications,
        }),
      );

      // Matches setHomePlanApprovals: the last decision in records the approval.
      if (outcome.type === "ADVANCE") {
        await recordTimelineEvent(tx, {
          applicationId,
          actor,
          type: TimelineEventType.APPROVALS_HOUSING_PLAN_APPROVED,
        });
      }

      await recordTimelineEvent(
        tx,
        buildAdvanceStageTimelineEventArgs({
          applicationId,
          staffPseudonymizedId,
          fromStage,
          targetStage,
          closedOutcome,
        }),
      );

      return { applicationId, stage: targetStage };
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}
