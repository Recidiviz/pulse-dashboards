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

import { staffImportSchema } from "~@reentry/import/models";
import { StaffCreateInput } from "~@reentry/import/types";
import {
  bulkUpdate,
  type BulkUpdateEntries,
  BulkUpdateEntry,
} from "~@reentry/import/utils/common";
import { PrismaClient } from "~@reentry/prisma/client";

export async function transformAndLoadStaffData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof staffImportSchema>>,
) {
  const existingStableStaffExternalIdsAndTypes = new Set(
    (
      await prismaClient.staff.findMany({
        select: {
          stableStaffExternalId: true,
          stableStaffExternalIdType: true,
        },
      })
    ).map(
      ({ stableStaffExternalId, stableStaffExternalIdType }) =>
        `${stableStaffExternalId}+${stableStaffExternalIdType}`,
    ),
  );

  const existingClientIds = new Set(
    (
      await prismaClient.client.findMany({
        select: { personId: true },
      })
    ).map(({ personId }) => personId),
  );

  const newStaffToCreate: StaffCreateInput[] = [];
  const existingStaffToUpdate: BulkUpdateEntries = [];
  const clientToStaff = [];

  for await (const staffData of data) {
    const importedClientIds = new Set(staffData.client_person_ids).intersection(
      existingClientIds,
    );

    clientToStaff.push(
      ...Array.from(importedClientIds).map((clientId) => ({
        clientId,
        staffId: staffData.staff_id,
      })),
    );

    const newStaff = {
      staffId: staffData.staff_id,
      stableStaffExternalId: staffData.stable_staff_external_id,
      stableStaffExternalIdType: staffData.stable_staff_external_id_type,
      pseudonymizedId: staffData.pseudonymized_id,
      stateCode: staffData.state_code,
      givenNames: staffData.full_name.given_names,
      middleNames: staffData.full_name.middle_names,
      surname: staffData.full_name.surname,
      suffix: staffData.full_name.name_suffix,
      email: staffData.email ?? null,
    } satisfies StaffCreateInput & BulkUpdateEntry;

    if (
      existingStableStaffExternalIdsAndTypes.has(
        `${staffData.stable_staff_external_id}+${staffData.stable_staff_external_id_type}`,
      )
    ) {
      existingStaffToUpdate.push(newStaff);
    } else {
      newStaffToCreate.push(newStaff);
    }
  }

  await bulkUpdate(
    prismaClient,
    "Staff",
    ["stableStaffExternalId", "stableStaffExternalIdType"],
    existingStaffToUpdate,
  );

  await prismaClient.staff.createMany({
    data: newStaffToCreate,
  });

  // Add all of the new connections
  await prismaClient.clientsToStaff.createMany({
    data: clientToStaff,
    skipDuplicates: true,
  });

  // Delete all of old connections between clients and staff
  await prismaClient.clientsToStaff.deleteMany({
    where: {
      NOT: {
        OR: clientToStaff.map((c) => ({
          clientId: c.clientId,
          staffId: c.staffId,
        })),
      },
    },
  });
}
