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
  HomePlanType,
  type Prisma,
  type PrismaClient,
} from "~@idaho-th/prisma/client";

import { TEST_STAFF_PSEUDONYMIZED_ID } from "./constants";

type HousingApplicationHomePlanInput = Pick<
  Prisma.HousingApplicationHomePlanUncheckedCreateInput,
  "applicationId"
> &
  Partial<Prisma.HousingApplicationHomePlanUncheckedCreateInput>;

export function createHousingApplicationHomePlan(
  prismaClient: PrismaClient,
  { applicationId, ...overrides }: HousingApplicationHomePlanInput,
) {
  return prismaClient.housingApplicationHomePlan.create({
    data: {
      applicationId,
      type: HomePlanType.MANUAL_ADDRESS,
      address: "123 Main St",
      createdByStaffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      ...overrides,
    },
  });
}
