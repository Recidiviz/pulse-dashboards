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
  type Prisma,
  type PrismaClient,
  StateCode,
} from "~@idaho-th/prisma/client";

import { TEST_DATES, TEST_STAFF_PSEUDONYMIZED_ID } from "./constants";

type HousingApplicationInput =
  Partial<Prisma.HousingApplicationUncheckedCreateInput>;

export function createHousingApplication(
  prismaClient: PrismaClient,
  overrides: HousingApplicationInput = {},
) {
  return prismaClient.housingApplication.create({
    data: {
      stateCode: StateCode.US_ID,
      clientName: "Test Client",
      formData: {},
      sentToProvidersAt: TEST_DATES.SENT_TO_PROVIDERS,
      ...overrides,
    },
  });
}

type StaffHousingApplicationInput = Pick<
  Prisma.StaffHousingApplicationUncheckedCreateInput,
  "applicationId"
> &
  Partial<Prisma.StaffHousingApplicationUncheckedCreateInput>;

export function createStaffHousingApplication(
  prismaClient: PrismaClient,
  { applicationId, ...overrides }: StaffHousingApplicationInput,
) {
  return prismaClient.staffHousingApplication.create({
    data: {
      applicationId,
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      stage: ApplicationStage.APPLICATION,
      status: ApplicationStatus.WAITING,
      ...overrides,
    },
  });
}

type ProviderHousingApplicationInput = Pick<
  Prisma.ProviderHousingApplicationUncheckedCreateInput,
  "applicationId" | "providerId" | "providerLocationId"
> &
  Partial<Prisma.ProviderHousingApplicationUncheckedCreateInput>;

export function createProviderHousingApplication(
  prismaClient: PrismaClient,
  {
    applicationId,
    providerId,
    providerLocationId,
    ...overrides
  }: ProviderHousingApplicationInput,
) {
  return prismaClient.providerHousingApplication.create({
    data: {
      applicationId,
      providerId,
      providerLocationId,
      stage: ApplicationStage.APPLICATION,
      status: ApplicationStatus.ACTION_NEEDED,
      ...overrides,
    },
  });
}
