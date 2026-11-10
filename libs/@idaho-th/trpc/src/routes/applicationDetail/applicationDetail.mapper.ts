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

import { ClosedOutcome, type Prisma } from "~@idaho-th/prisma/client";
import { computeReleaseTaskProgress } from "~@idaho-th/shared";
import { toVisibleAlerts } from "~@idaho-th/trpc/routes/alert/alert.helpers";
import { toEligibleProviderWithContact } from "~@idaho-th/trpc/routes/housing-common/eligibleProvider.selects";
import {
  HOUSING_APPLICATION_NOT_FOUND,
  throwHousingApplicationNotFound,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import { requireProviderOwnedApplication } from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import type {
  HousingApplicationDetailFields,
  WorkflowRecordCore,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.types";
import { withPreferredProviders } from "~@idaho-th/trpc/routes/housing-common/preferredProviders.helpers";
import { toProviderVisibleAlerts } from "~@idaho-th/trpc/routes/listingApplication/listingApplication.helpers";

import type {
  ApplicationDetailCore,
  ProviderApplicationDetail,
  ProviderApplicationDetailRow,
  ProviderVisibleClosedOutcome,
  StaffApplicationDetail,
  StaffApplicationDetailRow,
} from "./applicationDetail.types";

// Reasons the case manager selected that are withheld from providers.
export const PRIVATE_CLOSED_OUTCOMES = [
  ClosedOutcome.APPLICATION_WITHDRAWN,
  ClosedOutcome.RELEASE_DENIED,
  ClosedOutcome.HOUSING_PLAN_REJECTED,
] as const;

function isPrivateClosedOutcome(
  closedOutcome: ClosedOutcome,
): closedOutcome is (typeof PRIVATE_CLOSED_OUTCOMES)[number] {
  return (PRIVATE_CLOSED_OUTCOMES as readonly ClosedOutcome[]).includes(
    closedOutcome,
  );
}

function mapClosedOutcomeForProvider(
  closedOutcome: ClosedOutcome | null,
): ProviderVisibleClosedOutcome | null {
  if (closedOutcome === null) {
    return null;
  }

  return isPrivateClosedOutcome(closedOutcome) ? "CLOSED" : closedOutcome;
}

function resolveIdocNumber(
  columnValue: string | null,
  formData: Prisma.JsonValue,
): string | null {
  if (columnValue != null && columnValue.length > 0) {
    return columnValue;
  }

  if (
    formData === null ||
    typeof formData !== "object" ||
    Array.isArray(formData)
  ) {
    return null;
  }

  const formIdoc = (formData as Record<string, unknown>)["idocNumber"];
  if (typeof formIdoc !== "string") {
    return null;
  }

  const trimmed = formIdoc.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapApplicationDetailCore(
  application: HousingApplicationDetailFields,
  record: WorkflowRecordCore,
  completedReleaseTaskCount: number | undefined,
  preferredProviders: { id: string; name: string }[],
): ApplicationDetailCore {
  return {
    id: application.id,
    clientName: application.clientName,
    expectedReleaseDate: application.expectedReleaseDate,
    idocNumber: resolveIdocNumber(application.idocNumber, application.formData),
    formData: withPreferredProviders(
      application.formData,
      preferredProviders.map((provider) => provider.id),
    ),
    sentToProvidersAt: application.sentToProvidersAt,
    createdAt: application.createdAt,
    stage: record.stage,
    subStage: record.subStage,
    status: record.status,
    releaseTaskProgress: computeReleaseTaskProgress(
      record.stage,
      completedReleaseTaskCount,
    ),
    preferredProviders,
  };
}

export function mapStaffApplicationDetailFromRow(
  context: StaffApplicationDetailRow,
): StaffApplicationDetail {
  const staffApplication = context.staffApplication;
  if (staffApplication != null) {
    return {
      ...mapApplicationDetailCore(
        context,
        staffApplication,
        context.homePlan?._count.releaseTasks,
        context.preferredProviders.map((row) => row.provider),
      ),
      eligibleProviders: context.eligibleProviders.map(
        toEligibleProviderWithContact,
      ),
      // Pick fields explicitly: context.homePlan now includes _count.releaseTasks,
      // used only for computing releaseTaskProgress above. Don't leak _count to the client.
      homePlan: context.homePlan
        ? {
            type: context.homePlan.type,
            selectedProviderId: context.homePlan.selectedProviderId,
            releaseDecision: context.homePlan.releaseDecision,
          }
        : null,
      providerApplications: context.providerApplications,
      hasDuplicate: context._count.duplicates > 0,
      closedOutcome: staffApplication.closedOutcome,
      closedOutcomeNote: staffApplication.closedOutcomeNote,
      paroleCommissionDecision: staffApplication.paroleCommissionDecision,
      alerts: toVisibleAlerts(context.alerts),
    };
  }

  throwHousingApplicationNotFound(
    HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
  );
}

export function mapProviderApplicationDetailFromRow(
  context: ProviderApplicationDetailRow,
): ProviderApplicationDetail {
  const providerApplication = requireProviderOwnedApplication(
    context.providerApplications,
  );

  return {
    ...mapApplicationDetailCore(
      context,
      providerApplication,
      context.homePlan?._count.releaseTasks,
      context.preferredProviders.map((row) => row.provider),
    ),
    providerApplicationId: providerApplication.id,
    updatedAt: providerApplication.updatedAt,
    provider: providerApplication.provider,
    providerLocation: providerApplication.providerLocation,
    closedOutcome: mapClosedOutcomeForProvider(
      context.staffApplication?.closedOutcome ?? null,
    ),
    alerts: toProviderVisibleAlerts(providerApplication, context.alerts),
  };
}
