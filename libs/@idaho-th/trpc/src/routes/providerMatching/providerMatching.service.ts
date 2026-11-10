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
  AlertType,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  Prisma,
  type PrismaClient,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { normalizeEligibilityParams } from "~@idaho-th/shared";
import { createAlerts } from "~@idaho-th/trpc/routes/alert/alert.helpers";
import {
  type HousingProvider,
  matchProviders,
} from "~@idaho-th/trpc/routes/housing-common/eligibilityEngine";
import { assertStaffCaseApplicationStage } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import { PREFERRED_PROVIDERS_MAX } from "~@idaho-th/trpc/routes/housing-common/housingApplication.form.schema";
import {
  HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  lockHousingApplicationForUpdate,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import type {
  GetProvidersInput,
  GetProvidersWithEligibilityInput,
  SendToProvidersInput,
} from "~@idaho-th/trpc/routes/providerMatching/providerMatching.types";
import {
  recordTimelineEvent,
  withTimelineAnalytics,
} from "~@idaho-th/trpc/routes/timeline/timeline.events";
import { buildSearchArg } from "~@idaho-th/trpc/utils/search";

// Only the organization's own columns: email moved to HousingProviderUser.
const PROVIDER_SEARCHABLE_FIELDS = ["name"] as const;

function buildProviderSearchWhere(
  search: NonNullable<GetProvidersInput["search"]>,
): NonNullable<GetProvidersInput["search"]> {
  const searchArg = buildSearchArg(search, PROVIDER_SEARCHABLE_FIELDS);
  if (!searchArg) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "search must filter on an allowed provider field",
    });
  }
  return searchArg;
}

export async function getHousingProviderNameOptions(
  prisma: PrismaClient,
): Promise<string[]> {
  const rows = await prisma.housingProvider.findMany({
    select: { name: true },
    where: { name: { not: "" } },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => row.name.trim()).filter((name) => name.length > 0);
}

/**
 * Resolves extracted provider names to provider IDs by exact match — the
 * canonical name list fed to the model was built moments earlier from live
 * provider names, so the model's response is either an exact match or (after
 * a rename race) unresolvable and dropped. Names shared by multiple
 * providers resolve to the lowest ID (same tie-break as the AI's canonical
 * name list and the form dropdown).
 */
export async function resolveProviderIdsByExactName(
  prisma: PrismaClient,
  names: readonly string[],
): Promise<string[]> {
  const wanted = names.filter((name) => name.length > 0);
  if (wanted.length === 0) return [];

  const rows = await prisma.housingProvider.findMany({
    where: { name: { in: wanted } },
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  const idByName = new Map<string, string>();
  for (const row of rows) {
    if (!idByName.has(row.name)) idByName.set(row.name, row.id);
  }

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const name of wanted) {
    if (ids.length >= PREFERRED_PROVIDERS_MAX) break;
    const id = idByName.get(name);
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

export async function getProvidersWithEligibility(
  prisma: PrismaClient,
  input: GetProvidersWithEligibilityInput,
) {
  const { search, eligibilityParams } = input;
  const normalizedParams = normalizeEligibilityParams(eligibilityParams);
  const preferredProviders = normalizedParams.preferredProviders;

  const providersList = await prisma.housingProvider.findMany({
    where: search ? buildProviderSearchWhere(search) : undefined,
    include: { locations: true },
    orderBy: { name: "asc" },
  });

  const matches = matchProviders(
    providersList as HousingProvider[],
    normalizedParams,
  );

  const providers = matches.map(({ provider, location }) => ({
    id: provider.id,
    name: provider.name,
    isPreferred: preferredProviders.includes(provider.id),
    providerLocation: location,
  }));

  return { providers };
}

export async function getProviders(
  prisma: PrismaClient,
  input: GetProvidersInput = {},
): Promise<{ id: string; name: string }[]> {
  const {
    search,
    distinct = ["name" as Prisma.HousingProviderScalarFieldEnum],
  } = input;
  return prisma.housingProvider.findMany({
    distinct: distinct,
    where: search ? buildProviderSearchWhere(search) : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function sendApplicationToProviders(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: SendToProvidersInput,
): Promise<void> {
  const { applicationId, providerIds } = input;

  await withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      const owned = await tx.staffHousingApplication.findFirst({
        where: {
          applicationId: { equals: applicationId },
          staffPseudonymizedId,
        },
        select: { id: true, stage: true },
      });

      if (!owned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to send this application",
        });
      }

      assertStaffCaseApplicationStage(owned.stage);

      const application = await tx.housingApplication.findUnique({
        where: { id: applicationId },
        select: { sentToProvidersAt: true },
      });

      const eligible = await tx.eligibleHousingProvider.findMany({
        where: {
          applicationId: { equals: applicationId },
          providerId: { in: providerIds },
        },
        select: { providerId: true, providerLocationId: true },
      });

      if (eligible.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No eligible providers found for the selected provider IDs",
        });
      }

      // A CM may legitimately send to further providers while the case is
      // still in Application, so this filters per provider rather than
      // rejecting the whole call once sentToProvidersAt is set. A repeat of an
      // identical send resolves to nothing here and leaves the record alone.
      const alreadySent = await tx.providerHousingApplication.findMany({
        where: {
          applicationId: { equals: applicationId },
          providerId: { in: eligible.map(({ providerId }) => providerId) },
        },
        select: { providerId: true },
      });
      const alreadySentProviderIds = new Set(
        alreadySent.map(({ providerId }) => providerId),
      );
      const newlySent = eligible.filter(
        ({ providerId }) => !alreadySentProviderIds.has(providerId),
      );

      // Clearing covers every provider the caller sent, not just the newly
      // sent ones: a re-ticked provider that was already sent would otherwise
      // keep isSelected set with no way to clear it.
      await tx.eligibleHousingProvider.updateMany({
        where: {
          applicationId: { equals: applicationId },
          providerId: { in: eligible.map(({ providerId }) => providerId) },
        },
        data: { isSelected: false },
      });

      if (newlySent.length === 0) {
        return;
      }

      const newlySentProviderIds = newlySent.map(
        ({ providerId }) => providerId,
      );

      await tx.providerHousingApplication.createMany({
        data: newlySent.map(({ providerId, providerLocationId }) => ({
          applicationId,
          providerId,
          providerLocationId,
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
          status: ApplicationStatus.ACTION_NEEDED,
        })),
        skipDuplicates: true,
      });

      await createAlerts(tx, {
        type: AlertType.NEW_APPLICATION,
        applicationId,
        recipients: newlySentProviderIds.map((providerId) => ({ providerId })),
      });

      const now = new Date();
      await tx.housingApplication.update({
        where: { id: applicationId },
        // sentToProvidersAt marks the first send and is read as a flag
        // everywhere; a later send to additional providers must not move it.
        // lastActivityAt is the canonical "Last Updated" dashboard timestamp.
        data: {
          sentToProvidersAt: application?.sentToProvidersAt ?? now,
          lastActivityAt: now,
        },
      });

      await tx.staffHousingApplication.update({
        where: { applicationId, staffPseudonymizedId },
        data: {
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
          status: ApplicationStatus.WAITING,
        },
      });

      await recordTimelineEvent(tx, {
        applicationId,
        actor: {
          role: TimelineActorRole.STAFF,
          pseudonymizedId: staffPseudonymizedId,
        },
        type: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
        providerCount: newlySent.length,
        providerIds: newlySentProviderIds,
      });
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}
