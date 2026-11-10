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

import { type Prisma } from "~@idaho-th/prisma/client";
import { ALERT_SELECT } from "~@idaho-th/trpc/routes/alert/alert.helpers";
import { ELIGIBLE_PROVIDER_WITH_CONTACT_SELECT } from "~@idaho-th/trpc/routes/housing-common/eligibleProvider.selects";
import { PREFERRED_PROVIDERS_SELECT } from "~@idaho-th/trpc/routes/housing-common/preferredProviders.helpers";
import { PROVIDER_LOCATION_CORE_SELECT } from "~@idaho-th/trpc/routes/housing-common/providerLocation.selects";
import { COMPLETED_RELEASE_TASK_COUNT_SELECT } from "~@idaho-th/trpc/routes/housing-common/releaseTaskProgress.selects";

export const ELIGIBLE_PROVIDER_DETAIL_SELECT = {
  select: ELIGIBLE_PROVIDER_WITH_CONTACT_SELECT,
} as const;

const HOME_PLAN_FOR_STAFF_APP_INCLUDE = {
  select: {
    type: true,
    selectedProviderId: true,
    releaseDecision: true,
    ...COMPLETED_RELEASE_TASK_COUNT_SELECT,
  },
} as const;

const HOME_PLAN_RELEASE_TASK_COUNT_INCLUDE = {
  select: COMPLETED_RELEASE_TASK_COUNT_SELECT,
} as const;

export function staffApplicationDetailInclude(staffPseudonymizedId: string) {
  return {
    staffApplication: {
      select: {
        staffPseudonymizedId: true,
        stage: true,
        subStage: true,
        status: true,
        closedOutcome: true,
        closedOutcomeNote: true,
        paroleCommissionDecision: true,
      },
    },
    eligibleProviders: ELIGIBLE_PROVIDER_DETAIL_SELECT,
    preferredProviders: PREFERRED_PROVIDERS_SELECT,
    homePlan: HOME_PLAN_FOR_STAFF_APP_INCLUDE,
    providerApplications: {
      select: { providerId: true },
    },
    alerts: {
      where: { staffPseudonymizedId, dismissedAt: null },
      select: ALERT_SELECT,
      orderBy: { createdAt: "desc" },
    },
    _count: { select: { duplicates: true } },
  } satisfies Prisma.HousingApplicationInclude;
}

export function providerApplicationDetailSelect(providerId: string) {
  return {
    id: true,
    clientName: true,
    expectedReleaseDate: true,
    idocNumber: true,
    formData: true,
    preferredProviders: PREFERRED_PROVIDERS_SELECT,
    sentToProvidersAt: true,
    createdAt: true,
    staffApplication: { select: { closedOutcome: true } },
    homePlan: HOME_PLAN_RELEASE_TASK_COUNT_INCLUDE,
    alerts: {
      where: { providerId, dismissedAt: null },
      select: ALERT_SELECT,
      orderBy: { createdAt: "desc" },
    },
    providerApplications: {
      // The organization filter: the caller's own match on this application,
      // never a colleague organization's.
      where: { providerId },
      select: {
        id: true,
        stage: true,
        subStage: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
        providerLocation: {
          select: { id: true, ...PROVIDER_LOCATION_CORE_SELECT },
        },
      },
      take: 1,
    },
  } satisfies Prisma.HousingApplicationSelect;
}
