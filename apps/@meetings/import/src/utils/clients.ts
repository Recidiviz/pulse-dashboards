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

import { clientImportSchema } from "~@meetings/import/models";
import { ClientCreateInput } from "~@meetings/import/types";
import {
  bulkUpdate,
  type BulkUpdateEntries,
  BulkUpdateEntry,
} from "~@meetings/import/utils/common";
import { PrismaClient } from "~@meetings/prisma/client";

export async function transformAndLoadClientData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof clientImportSchema>>,
) {
  const existingStablePersonExternalIdsAndTypes = new Set(
    (
      await prismaClient.client.findMany({
        select: {
          stablePersonExternalId: true,
          stablePersonExternalIdType: true,
        },
      })
    ).map(
      ({ stablePersonExternalId, stablePersonExternalIdType }) =>
        `${stablePersonExternalId}+${stablePersonExternalIdType}`,
    ),
  );

  const existingStaffIds = new Set(
    (
      await prismaClient.staff.findMany({
        select: {
          staffId: true,
        },
      })
    ).map(({ staffId }) => staffId),
  );

  const newClientsToCreate: ClientCreateInput[] = [];
  const existingClientsToUpdate: BulkUpdateEntries = [];
  const clientToStaff = [];

  for await (const clientData of data) {
    const importedStaffIds = new Set(
      clientData.assigned_staff_ids.filter((staffId) =>
        existingStaffIds.has(staffId),
      ),
    );

    clientToStaff.push(
      ...Array.from(importedStaffIds).map((staffId) => ({
        clientId: clientData.person_id,
        staffId,
      })),
    );

    const newClient = {
      personId: clientData.person_id,
      stablePersonExternalId: clientData.stable_person_external_id,
      stablePersonExternalIdType: clientData.stable_person_external_id_type,
      pseudonymizedId: clientData.pseudonymized_id,
      displayPersonExternalId: clientData.display_person_external_id,
      stateCode: clientData.state_code,
      givenNames: clientData.full_name.given_names,
      middleNames: clientData.full_name.middle_names,
      surname: clientData.full_name.surname,
      suffix: clientData.full_name.name_suffix,
      birthDate: clientData.birthdate,
      supervisionType: clientData.supervision_type,
    } satisfies ClientCreateInput & BulkUpdateEntry;

    if (
      existingStablePersonExternalIdsAndTypes.has(
        `${clientData.stable_person_external_id}+${clientData.stable_person_external_id_type}`,
      )
    ) {
      existingClientsToUpdate.push(newClient);
    } else {
      newClientsToCreate.push(newClient);
    }
  }

  await bulkUpdate(
    prismaClient,
    "Client",
    ["stablePersonExternalId", "stablePersonExternalIdType"],
    existingClientsToUpdate,
  );

  await prismaClient.client.createMany({
    data: newClientsToCreate,
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
