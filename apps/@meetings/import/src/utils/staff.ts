// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { z } from "zod";

import { staffImportSchema } from "~@meetings/import/models";
import { StaffCreateInput } from "~@meetings/import/types";
import {
  bulkUpdate,
  type BulkUpdateEntries,
  BulkUpdateEntry,
} from "~@meetings/import/utils/common";
import { PrismaClient } from "~@meetings/prisma/client";

export async function transformAndLoadStaffData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof staffImportSchema>>,
) {
  // Mark all staff as inactive initially
  await prismaClient.staff.updateMany({
    data: { isActive: false },
  });

  const existingStableStaffExternalIds = new Set(
    (
      await prismaClient.staff.findMany({
        select: {
          stableStaffExternalId: true,
        },
      })
    ).map(({ stableStaffExternalId }) => stableStaffExternalId),
  );

  const newStaffToCreate: StaffCreateInput[] = [];
  const existingStaffToUpdate: BulkUpdateEntries = [];

  for await (const staffData of data) {
    const newStaff = {
      staffId: staffData.staff_id,
      stableStaffExternalId: staffData.stable_staff_external_id,
      pseudonymizedId: staffData.pseudonymized_id,
      stateCode: staffData.state_code,
      givenNames: staffData.full_name.given_names,
      middleNames: staffData.full_name.middle_names,
      surname: staffData.full_name.surname,
      suffix: staffData.full_name.name_suffix,
      email: staffData.email ?? null,
      isActive: true,
    } satisfies StaffCreateInput & BulkUpdateEntry;

    if (
      existingStableStaffExternalIds.has(staffData.stable_staff_external_id)
    ) {
      existingStaffToUpdate.push(newStaff);
    } else {
      newStaffToCreate.push(newStaff);
    }
  }

  await bulkUpdate(
    prismaClient,
    "Staff",
    ["stableStaffExternalId"],
    existingStaffToUpdate,
  );

  await prismaClient.staff.createMany({
    data: newStaffToCreate,
  });
}
