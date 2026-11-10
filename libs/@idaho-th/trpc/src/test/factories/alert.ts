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
  AlertType,
  type Prisma,
  type PrismaClient,
} from "~@idaho-th/prisma/client";

type AlertInput = Pick<Prisma.AlertUncheckedCreateInput, "applicationId"> &
  Partial<Prisma.AlertUncheckedCreateInput>;

/**
 * Writes an alert directly. Pass exactly one recipient (`providerId` or
 * `staffPseudonymizedId`); the database rejects a row with zero or two.
 */
export function createAlert(
  prismaClient: PrismaClient,
  { applicationId, ...overrides }: AlertInput,
) {
  return prismaClient.alert.create({
    data: {
      applicationId,
      type: AlertType.SELECTED_AS_HOME_PLAN,
      ...overrides,
    },
  });
}
