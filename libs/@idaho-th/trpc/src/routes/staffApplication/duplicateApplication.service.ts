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

import {
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  HousingApplicationDocumentType,
  type Prisma,
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import {
  type EligibilityFormFields,
  extractEligibilityParams,
  normalizeEligibilityParams,
} from "~@idaho-th/shared";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import {
  type HousingProvider,
  matchProviders,
} from "~@idaho-th/trpc/routes/housing-common/eligibilityEngine";
import {
  HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  lockHousingApplicationForUpdate,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import {
  preferredProvidersCreate,
  withPreferredProviders,
} from "~@idaho-th/trpc/routes/housing-common/preferredProviders.helpers";
import {
  buildInitialApplicationTimelineEventsCreate,
  recordTimelineEvent,
  withTimelineAnalytics,
} from "~@idaho-th/trpc/routes/timeline/timeline.events";
import { generateUuid } from "~@idaho-th/trpc/utils/common";

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
  buildDuplicateDocumentCreate,
  countApplicationDuplicates,
  type DuplicateSourceDocument,
  findDuplicateSourceApplication,
  findLatestDuplicateSourceDocument,
  isHousingPlanRejectedClosedCase,
  isRevokedClosedCase,
} from "./duplicateApplication.helpers";
import {
  DUPLICATE_APPLICATION_BAD_REQUEST,
  STAFF_APPLICATION_NOT_FOUND,
} from "./staffApplication.constants";
import {
  findEligibleHousingProviders,
  insertHousingApplication,
  parseCreateApplicationFormFields,
  throwStaffApplicationNotFound,
} from "./staffApplication.helpers";
import type {
  CreateHousingApplicationInput,
  DuplicateHousingApplicationInput,
} from "./staffApplication.types";

export async function duplicateHousingApplication(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: DuplicateHousingApplicationInput,
): Promise<{ applicationId: string }> {
  const { applicationId } = input;

  const source = await findDuplicateSourceApplication(
    prisma,
    applicationId,
    staffPseudonymizedId,
  );
  if (source == null) {
    throwStaffApplicationNotFound(
      STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
    );
  }

  // The mutation input is only the application id — the server derives the
  // duplicate's scalars and eligibility from the stored form data, with the
  // preferred providers put back so they stay eligible on the copy.
  const preferredProviderIds = source.preferredProviders.map(
    (row) => row.provider.id,
  );
  const sourceFormData = withPreferredProviders(
    source.formData,
    preferredProviderIds,
  );
  const { clientName, idocNumber, expectedReleaseDate } =
    parseCreateApplicationFormFields(
      sourceFormData as CreateHousingApplicationInput["formData"],
    );

  const normalizedParams = normalizeEligibilityParams(
    extractEligibilityParams(sourceFormData as EligibilityFormFields),
  );
  const rawProviders = await findEligibleHousingProviders(
    prisma,
    normalizedParams,
  );
  const eligibleCreates = matchProviders(
    rawProviders as HousingProvider[],
    normalizedParams,
  ).map(({ provider, location }) => ({
    providerId: provider.id,
    providerLocationId: location.id,
  }));

  const duplicateId = generateUuid();
  const documentsToDuplicate = [
    findLatestDuplicateSourceDocument(
      source.documents,
      HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
    ),
    findLatestDuplicateSourceDocument(
      source.documents,
      HousingApplicationDocumentType.DIGITIZED,
    ),
  ].filter((document): document is DuplicateSourceDocument => document != null);

  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      // Re-checked inside the lock: one case never has two live copies.
      if ((await countApplicationDuplicates(tx, applicationId)) > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: DUPLICATE_APPLICATION_BAD_REQUEST.ALREADY_DUPLICATED,
        });
      }

      if (
        isRevokedClosedCase(source.staffApplication) ||
        isHousingPlanRejectedClosedCase(source.staffApplication)
      ) {
        // 1. The provider's revoke or the rejected home plan already closed
        //    the original; duplicating is the case manager's answer to it.
        await tx.staffHousingApplication.update({
          where: { applicationId },
          data: { status: ApplicationStatus.DONE },
        });
      } else {
        // 2. Close the original: advance to Closed with no closed-outcome,
        //    cascading the provider-application closing behavior, plus its
        //    stage-advanced-to-closed timeline event.
        const context = await findStaffAdvanceStageApplication(
          tx,
          applicationId,
          staffPseudonymizedId,
        );
        requireStaffAdvanceStageApplication(context);
        const fromStage = context.staffApplication.stage;
        const { selectedProviderId } = resolveAdvanceStage(
          context,
          ApplicationStage.CLOSED,
          false,
        );
        await updateHousingApplicationAdvanceStage(
          tx,
          applicationId,
          buildAdvanceStageWriteData({
            targetStage: ApplicationStage.CLOSED,
            selectedProviderId,
            providerApplications: context.providerApplications,
          }),
        );
        await recordTimelineEvent(
          tx,
          buildAdvanceStageTimelineEventArgs({
            applicationId,
            staffPseudonymizedId,
            fromStage,
            targetStage: ApplicationStage.CLOSED,
            closedOutcome: undefined,
          }),
        );
      }

      await insertHousingApplication(tx, {
        id: duplicateId,
        stateCode: IDAHO_TH_STATE_CODE,
        duplicatedFrom: { connect: { id: applicationId } },
        clientName,
        formData: source.formData as Prisma.InputJsonValue,
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
        eligibleProviders: { create: eligibleCreates },
        ...(documentsToDuplicate.length > 0
          ? {
              documents: {
                create: documentsToDuplicate.map((document) =>
                  buildDuplicateDocumentCreate(staffPseudonymizedId, document),
                ),
              },
            }
          : {}),
      });

      return { applicationId: duplicateId };
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}
