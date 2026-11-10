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

import { Prisma } from "~@idaho-th/prisma/client";
import type { EligibilityParams } from "~@idaho-th/shared";
import {
  extractEligibilityParams,
  isRider,
  normalizeEligibilityParams,
} from "~@idaho-th/shared";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import {
  buildEligibilityWhere,
  type HousingProvider,
  matchProviders,
} from "~@idaho-th/trpc/routes/housing-common/eligibilityEngine";
import { isRiderFormData } from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import {
  preferredProvidersReplace,
  splitPreferredProviders,
} from "~@idaho-th/trpc/routes/housing-common/preferredProviders.helpers";
import { parseDateString } from "~@idaho-th/trpc/utils/common";

import {
  ADVANCE_STAGE_BAD_REQUEST,
  RELEASE_FLOW_BAD_REQUEST,
  STAFF_APPLICATION_NOT_FOUND,
} from "./staffApplication.constants";
import {
  HOUSING_APPLICATION_CREATE_INCLUDE,
  HOUSING_APPLICATION_UPDATE_INCLUDE,
  PAROLE_COMMISSION_DECISION_APPLICATION_SELECT,
  STAFF_OWNED_APPLICATION_SELECT,
} from "./staffApplication.selects";
import type {
  CreateHousingApplicationInput,
  DbClient,
  UpdateHousingApplicationInput,
} from "./staffApplication.types";

// The ownership gate for the staff application routes. applicationId is pinned
// to equality so a relaxed filter cannot satisfy the check against a different
// application; staffPseudonymizedId comes from the verified token, not the
// request body.
export function staffOwnedApplicationWhere(
  applicationId: string,
  staffPseudonymizedId: string,
): Prisma.StaffHousingApplicationWhereInput {
  return { applicationId: { equals: applicationId }, staffPseudonymizedId };
}

export async function findStaffOwnedApplication(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
) {
  return client.staffHousingApplication.findFirst({
    where: staffOwnedApplicationWhere(applicationId, staffPseudonymizedId),
    select: STAFF_OWNED_APPLICATION_SELECT,
  });
}

export async function findStaffParoleCommissionDecisionApplication(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
) {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      stateCode: IDAHO_TH_STATE_CODE,
      staffApplication: { staffPseudonymizedId },
    },
    select: PAROLE_COMMISSION_DECISION_APPLICATION_SELECT,
  });
}

/**
 * Reads the release date out of a stored `formData` blob. The column is
 * untyped JSON, so anything other than a string is treated as absent.
 */
export function readStoredHousingNeededDate(
  formData: Prisma.JsonValue,
): string | null {
  if (
    typeof formData !== "object" ||
    formData === null ||
    Array.isArray(formData)
  ) {
    return null;
  }

  const value = formData["tpdHousingNeededDate"];
  return typeof value === "string" ? value : null;
}

/**
 * Returns the stored `formData` blob with `tpdHousingNeededDate` replaced, or
 * null when the column holds something other than an object and there is no
 * blob to patch.
 */
export function patchStoredHousingNeededDate(
  formData: Prisma.JsonValue,
  tpdHousingNeededDate: string | null,
): Prisma.InputJsonValue | null {
  if (
    typeof formData !== "object" ||
    formData === null ||
    Array.isArray(formData)
  ) {
    return null;
  }

  return { ...formData, tpdHousingNeededDate };
}

export async function findEligibleHousingProviders(
  client: DbClient,
  eligibilityParams: EligibilityParams,
) {
  return client.housingProvider.findMany({
    where: buildEligibilityWhere(eligibilityParams),
    include: { locations: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Re-derives the eligible-provider set from formData, the same way
 * createHousingApplication and submitDraftIntakeApplication do, so an
 * application's persisted allowlist can never drift from the form it was
 * computed from.
 */
export async function resolveEligibleProviderCreates(
  client: DbClient,
  formData: CreateHousingApplicationInput["formData"],
) {
  const normalizedParams = normalizeEligibilityParams(
    extractEligibilityParams(formData),
  );
  const rawProviders = await findEligibleHousingProviders(
    client,
    normalizedParams,
  );

  return matchProviders(
    rawProviders as HousingProvider[],
    normalizedParams,
  ).map(({ provider, location }) => ({
    providerId: provider.id,
    providerLocationId: location.id,
  }));
}

export async function replaceDerivedEligibleProviders(
  tx: DbClient,
  applicationId: string,
  eligibleCreates: { providerId: string; providerLocationId: string }[],
) {
  const existing = await tx.eligibleHousingProvider.findMany({
    where: { applicationId: { equals: applicationId } },
    select: {
      providerId: true,
      isSelected: true,
      isManualOverride: true,
    },
  });
  const manualProviderIds = new Set(
    existing.filter((row) => row.isManualOverride).map((row) => row.providerId),
  );
  // Preserves staff's prior tick/untick on a re-derived (non-manual) row —
  // otherwise the delete+recreate below would silently reset it to null.
  const priorSelectionByProviderId = new Map(
    existing
      .filter((row) => !row.isManualOverride)
      .map((row) => [row.providerId, row.isSelected]),
  );

  // applicationId is pinned to equality so this delete cannot widen past the
  // one application, independent of upstream validation; isManualOverride is a
  // hardcoded literal, not user input.
  await tx.eligibleHousingProvider.deleteMany({
    where: {
      applicationId: { equals: applicationId },
      isManualOverride: false,
    },
  });

  const toCreate = eligibleCreates.filter(
    ({ providerId }) => !manualProviderIds.has(providerId),
  );

  if (toCreate.length > 0) {
    await tx.eligibleHousingProvider.createMany({
      data: toCreate.map((create) => ({
        applicationId,
        ...create,
        isSelected: priorSelectionByProviderId.get(create.providerId) ?? null,
      })),
    });
  }
}

export async function insertHousingApplication(
  client: DbClient,
  data: Prisma.HousingApplicationCreateInput,
) {
  return client.housingApplication.create({
    data,
    include: HOUSING_APPLICATION_CREATE_INCLUDE,
  });
}

export async function updateHousingApplicationById(
  client: DbClient,
  applicationId: string,
  data: Prisma.HousingApplicationUpdateInput,
) {
  return client.housingApplication.update({
    where: { id: applicationId },
    // lastActivityAt is the canonical "Last Updated" dashboard timestamp —
    // bumped on every application edit.
    data: { ...data, lastActivityAt: new Date() },
    include: HOUSING_APPLICATION_UPDATE_INCLUDE,
  });
}

export async function deleteHousingApplicationById(
  client: DbClient,
  applicationId: string,
) {
  return client.housingApplication.deleteMany({
    where: { id: applicationId },
  });
}

export function throwStaffApplicationNotFound(
  message: (typeof STAFF_APPLICATION_NOT_FOUND)[keyof typeof STAFF_APPLICATION_NOT_FOUND],
): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export function throwStaffApplicationBadRequest(
  message:
    | (typeof ADVANCE_STAGE_BAD_REQUEST)[keyof typeof ADVANCE_STAGE_BAD_REQUEST]
    | (typeof RELEASE_FLOW_BAD_REQUEST)[keyof typeof RELEASE_FLOW_BAD_REQUEST],
): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

export function parseCreateApplicationFormFields(
  formData: CreateHousingApplicationInput["formData"],
) {
  const clientName = formData.clientFullName ?? "";
  const releaseDateRaw = formData.tpdHousingNeededDate;
  const idocNumber = formData.idocNumber;
  const expectedReleaseDate = parseDateString(releaseDateRaw);

  return { clientName, idocNumber, expectedReleaseDate };
}

function normalizeEligibilityOverrideNote(
  note: string | undefined,
): string | null {
  return note || null;
}

export function buildHousingApplicationUpdatePayload(
  data: UpdateHousingApplicationInput["data"],
): Prisma.HousingApplicationUpdateInput {
  const {
    addEligibleProviders,
    removeEligibleProviderIds,
    expectedReleaseDate,
    formData,
    rawAiResponse,
    ...scalarData
  } = data;

  const updatePayload: Prisma.HousingApplicationUpdateInput = { ...scalarData };

  if (formData !== undefined) {
    const split = splitPreferredProviders(formData);
    updatePayload.formData = split.formData as Prisma.InputJsonValue;
    updatePayload.preferredProviders = preferredProvidersReplace(
      split.preferredProviderIds,
    );
  }
  if (rawAiResponse !== undefined) {
    updatePayload.rawAiResponse =
      rawAiResponse === null
        ? Prisma.JsonNull
        : (rawAiResponse as Prisma.InputJsonValue);
  }
  if (expectedReleaseDate !== undefined) {
    updatePayload.expectedReleaseDate = expectedReleaseDate
      ? parseDateString(expectedReleaseDate)
      : null;
  }
  if (addEligibleProviders?.length || removeEligibleProviderIds?.length) {
    updatePayload.eligibleProviders = {
      ...(addEligibleProviders?.length
        ? {
            create: addEligibleProviders.map(
              ({
                providerId,
                providerLocationId,
                eligibilityOverrideNote,
              }) => ({
                providerId,
                providerLocationId,
                isSelected: true,
                isManualOverride: true,
                eligibilityOverrideNote: normalizeEligibilityOverrideNote(
                  eligibilityOverrideNote,
                ),
              }),
            ),
          }
        : {}),
      ...(removeEligibleProviderIds?.length
        ? { deleteMany: { providerId: { in: removeEligibleProviderIds } } }
        : {}),
    };
  }

  return updatePayload;
}

/**
 * Current Status (Q6) picks the release flow, so once a parole or probation
 * decision is saved it cannot move the case to the other cohort. Comparing
 * cohorts rather than raw values lets an older case with no Q6 fill it in.
 */
export function assertCurrentStatusCohortUnchanged(
  staffApp: {
    paroleCommissionDecision: unknown;
    application: {
      formData: Prisma.JsonValue;
      homePlan: { releaseDecision: unknown } | null;
    };
  },
  nextLegalCurrentStatus: string | null,
): void {
  const hasReleaseDecision =
    staffApp.paroleCommissionDecision != null ||
    staffApp.application.homePlan?.releaseDecision != null;

  if (
    hasReleaseDecision &&
    isRiderFormData(staffApp.application.formData) !==
      isRider(nextLegalCurrentStatus)
  ) {
    throwStaffApplicationBadRequest(
      RELEASE_FLOW_BAD_REQUEST.CURRENT_STATUS_LOCKED,
    );
  }
}
