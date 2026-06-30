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

import { PrismaClient, UsNcRNAWritebackDataCreateInput } from "~@jii/prisma";
import { LoaderFn } from "~data-import-plugin";

import { rnaWritebackSchema } from "../../models";
import {
  bulkUpdate,
  type BulkUpdateEntries,
  BulkUpdateEntry,
} from "../../utils/bulkUpdate";

/**
 * Loads data to the UsNcRNAWriteback table in batches of 500 records at a time,
 * either bulk-updating or bulk-creating records as appropriate.
 * Adapted from similar code in the meetings/reentry apps.
 */
export const transformAndLoadRNAWritebackData: LoaderFn<
  PrismaClient,
  typeof rnaWritebackSchema
> = async (prismaClient, data) => {
  const BATCH_SIZE = 500;
  const importedAt = new Date();

  const existingPseudoIds = new Set(
    (
      await prismaClient.usNcRNAWritebackData.findMany({
        select: {
          pseudonymizedId: true,
        },
      })
    ).map(({ pseudonymizedId }) => pseudonymizedId),
  );

  let createBatch: UsNcRNAWritebackDataCreateInput[] = [];
  let updateBatch: BulkUpdateEntries = [];

  const flushCreateBatch = async () => {
    if (createBatch.length === 0) return;
    await prismaClient.usNcRNAWritebackData.createMany({ data: createBatch });
    createBatch = [];
  };

  const flushUpdateBatch = async () => {
    if (updateBatch.length === 0) return;
    await bulkUpdate(
      prismaClient,
      "UsNcRNAWritebackData",
      ["pseudonymizedId"],
      updateBatch,
    );
    updateBatch = [];
  };

  for await (const d of data) {
    const newRNAData = {
      pseudonymizedId: d.pseudonymized_id,
      opusId: d.opus_id,
      seqNumber: d.seq_number ?? null,
      admitDate: d.admit_date,
      importedAt,
    } satisfies UsNcRNAWritebackDataCreateInput & BulkUpdateEntry;

    if (existingPseudoIds.has(d.pseudonymized_id)) {
      updateBatch.push(newRNAData);
      if (updateBatch.length >= BATCH_SIZE) await flushUpdateBatch();
    } else {
      createBatch.push(newRNAData);
      if (createBatch.length >= BATCH_SIZE) await flushCreateBatch();
    }
  }

  await flushCreateBatch();
  await flushUpdateBatch();
};
