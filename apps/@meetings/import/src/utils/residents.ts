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

import { residentImportSchema } from "~@meetings/import/models";
import { ResidentCreateInput } from "~@meetings/import/types";
import {
  bulkUpdate,
  type BulkUpdateEntries,
  BulkUpdateEntry,
} from "~@meetings/import/utils/common";
import { PrismaClient } from "~@meetings/prisma/client";

export async function transformAndLoadResidentData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof residentImportSchema>>,
) {
  // Mark all residents as inactive initially
  await prismaClient.resident.updateMany({
    data: { isActive: false },
  });

  const existingStablePersonExternalIdsAndTypes = new Set(
    (
      await prismaClient.resident.findMany({
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

  const newResidentsToCreate: ResidentCreateInput[] = [];
  const existingResidentsToUpdate: BulkUpdateEntries = [];

  for await (const residentData of data) {
    const newResident = {
      personId: residentData.person_id,
      stablePersonExternalId: residentData.stable_person_external_id,
      stablePersonExternalIdType: residentData.stable_person_external_id_type,
      pseudonymizedId: residentData.pseudonymized_id,
      displayPersonExternalId: residentData.display_person_external_id,
      stateCode: residentData.state_code,
      givenNames: residentData.person_name.given_names,
      middleNames: residentData.person_name.middle_names,
      surname: residentData.person_name.surname,
      suffix: residentData.person_name.name_suffix,
      facilityId: residentData.facility_id,
      isActive: true,
    } satisfies ResidentCreateInput & BulkUpdateEntry;

    if (
      existingStablePersonExternalIdsAndTypes.has(
        `${residentData.stable_person_external_id}+${residentData.stable_person_external_id_type}`,
      )
    ) {
      existingResidentsToUpdate.push(newResident);
    } else {
      newResidentsToCreate.push(newResident);
    }
  }

  await bulkUpdate(
    prismaClient,
    "Resident",
    ["stablePersonExternalId", "stablePersonExternalIdType"],
    existingResidentsToUpdate,
  );

  await prismaClient.resident.createMany({
    data: newResidentsToCreate,
  });
}
