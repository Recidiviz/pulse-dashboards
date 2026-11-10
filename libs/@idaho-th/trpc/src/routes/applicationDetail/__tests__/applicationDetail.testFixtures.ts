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
  type ClosedOutcome,
} from "~@idaho-th/prisma/client";
import type { ProviderLocationCore } from "~@idaho-th/shared";

export const applicationId = "app-1";
export const providerApplicationId = "provider-app-1";
export const staffPseudonymizedId = "staff-abc";

export const testApplication = {
  id: applicationId,
  clientName: "Jhon Doe",
  expectedReleaseDate: new Date("2025-12-31T19:00:00.000Z"),
  idocNumber: null,
  formData: { idocNumber: "123456", clientFullName: "Jhon Doe" },
  sentToProvidersAt: new Date("2026-06-01T00:00:00.000Z"),
  createdAt: new Date("2026-06-10T10:16:59.849Z"),
  eligibleProviders: [] as const,
  preferredProviders: [],
  alerts: [],
  _count: { duplicates: 0 },
};

export const testProviderLocation: ProviderLocationCore = {
  id: "provider-location-1",
  district: "1",
  acceptedGenders: ["MALE"],
  acceptsRiders: true,
  acceptsSexOffenders: false,
  acceptsViolentCriminals: false,
  faithBased: false,
};

export const testProvider = {
  id: "provider-internal-id",
  name: "Test Provider",
};

export const testWorkflow = {
  stage: ApplicationStage.APPLICATION,
  subStage: ApplicationSubStage.PROVIDER_REVIEW,
  status: ApplicationStatus.ACTION_NEEDED,
  updatedAt: new Date("2026-06-10T10:16:59.849Z"),
};

export const testReleaseWorkflow = {
  ...testWorkflow,
  stage: ApplicationStage.RELEASE,
  subStage: ApplicationSubStage.SELECTED,
};

export function buildStaffApplicationDetailRow(
  overrides: {
    staffPseudonymizedId?: string | null;
    closedOutcome?: ClosedOutcome | null;
    closedOutcomeNote?: string | null;
  } = {},
) {
  return {
    ...testApplication,
    formData: { idocNumber: "123456" },
    staffApplication:
      overrides.staffPseudonymizedId === null
        ? null
        : {
            staffPseudonymizedId:
              overrides.staffPseudonymizedId ?? staffPseudonymizedId,
            ...testWorkflow,
            closedOutcome: overrides.closedOutcome ?? null,
            closedOutcomeNote: overrides.closedOutcomeNote ?? null,
          },
    eligibleProviders: [],
  };
}

export function buildProviderApplicationDetailRow(
  overrides: { closedOutcome?: ClosedOutcome | null } = {},
) {
  return {
    ...testApplication,
    formData: { idocNumber: "123456" },
    staffApplication: { closedOutcome: overrides.closedOutcome ?? null },
    homePlan: null,
    providerApplications: [
      {
        id: providerApplicationId,
        ...testWorkflow,
        createdAt: testApplication.createdAt,
        provider: testProvider,
        providerLocation: testProviderLocation,
      },
    ],
  };
}

export function buildStaffJoinedApplicationRow() {
  return {
    ...testApplication,
    staffApplication: {
      staffPseudonymizedId,
      ...testWorkflow,
      closedOutcome: null,
      closedOutcomeNote: null,
    },
    eligibleProviders: [],
  };
}

export function buildProviderJoinedApplicationRow(
  overrides: { closedOutcome?: ClosedOutcome | null } = {},
) {
  return {
    ...testApplication,
    staffApplication: { closedOutcome: overrides.closedOutcome ?? null },
    homePlan: null,
    providerApplications: [
      {
        id: providerApplicationId,
        provider: testProvider,
        providerLocation: testProviderLocation,
        createdAt: testApplication.createdAt,
        ...testWorkflow,
      },
    ],
  };
}
