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
  const BATCH_SIZE = 500;
  const importedAt = new Date();

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

  let createBatch: ResidentCreateInput[] = [];
  let updateBatch: BulkUpdateEntries = [];

  const flushCreateBatch = async () => {
    if (createBatch.length === 0) return;
    await prismaClient.resident.createMany({ data: createBatch });
    createBatch = [];
  };

  const flushUpdateBatch = async () => {
    if (updateBatch.length === 0) return;
    await bulkUpdate(
      prismaClient,
      "Resident",
      ["stablePersonExternalId", "stablePersonExternalIdType"],
      updateBatch,
    );
    updateBatch = [];
  };

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
      lastImportedAt: importedAt,
    } satisfies ResidentCreateInput & BulkUpdateEntry;

    if (
      existingStablePersonExternalIdsAndTypes.has(
        `${residentData.stable_person_external_id}+${residentData.stable_person_external_id_type}`,
      )
    ) {
      updateBatch.push(newResident);
      if (updateBatch.length >= BATCH_SIZE) await flushUpdateBatch();
    } else {
      createBatch.push(newResident);
      if (createBatch.length >= BATCH_SIZE) await flushCreateBatch();
    }
  }

  await flushCreateBatch();
  await flushUpdateBatch();

  // Mark residents not present in this import as inactive.
  // Using lastImportedAt avoids passing all IDs as query parameters (which hits DB limits at scale).
  await prismaClient.resident.updateMany({
    where: { lastImportedAt: { lt: importedAt } },
    data: { isActive: false },
  });
}
