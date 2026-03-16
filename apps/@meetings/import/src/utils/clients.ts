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
  const BATCH_SIZE = 500;
  const importedAt = new Date();

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

  let createBatch: ClientCreateInput[] = [];
  let updateBatch: BulkUpdateEntries = [];

  const flushCreateBatch = async () => {
    if (createBatch.length === 0) return;
    await prismaClient.client.createMany({ data: createBatch });
    createBatch = [];
  };

  const flushUpdateBatch = async () => {
    if (updateBatch.length === 0) return;
    await bulkUpdate(
      prismaClient,
      "Client",
      ["stablePersonExternalId", "stablePersonExternalIdType"],
      updateBatch,
    );
    updateBatch = [];
  };

  for await (const clientData of data) {
    const newClient = {
      personId: clientData.person_id,
      stablePersonExternalId: clientData.stable_person_external_id,
      stablePersonExternalIdType: clientData.stable_person_external_id_type,
      pseudonymizedId: clientData.pseudonymized_id,
      displayPersonExternalId: clientData.display_person_external_id,
      stateCode: clientData.state_code,
      givenNames: clientData.person_name.given_names,
      middleNames: clientData.person_name.middle_names,
      surname: clientData.person_name.surname,
      suffix: clientData.person_name.name_suffix,
      supervisionType: clientData.supervision_type,
      staffEmails: clientData.officer_emails ?? ([] as string[]),
      isActive: true,
      lastImportedAt: importedAt,
    } satisfies ClientCreateInput & BulkUpdateEntry;

    if (
      existingStablePersonExternalIdsAndTypes.has(
        `${clientData.stable_person_external_id}+${clientData.stable_person_external_id_type}`,
      )
    ) {
      updateBatch.push(newClient);
      if (updateBatch.length >= BATCH_SIZE) await flushUpdateBatch();
    } else {
      createBatch.push(newClient);
      if (createBatch.length >= BATCH_SIZE) await flushCreateBatch();
    }
  }

  await flushCreateBatch();
  await flushUpdateBatch();

  // Mark clients not present in this import as inactive.
  // Using lastImportedAt avoids passing all IDs as query parameters (which hits DB limits at scale).
  await prismaClient.client.updateMany({
    where: { lastImportedAt: { lt: importedAt } },
    data: { isActive: false },
  });
}
