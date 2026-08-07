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

import { PrismaClient } from "~@jii/prisma";
import { LoaderFn } from "~data-import-plugin";

import { rnaWritebackSchema } from "../../models";
import { DEFAULT_BATCH_SIZE, runBatchImport } from "../../utils/batchImport";

export const BATCH_SIZE = DEFAULT_BATCH_SIZE; // usNcRNA.test.ts imports this

/**
 * Loads data to the UsNcRNAWriteback table in batches of 500 records at a time,
 * either bulk-updating or bulk-creating records as appropriate.
 * Adapted from similar code in the meetings/reentry apps.
 */
export const transformAndLoadRNAWritebackData: LoaderFn<
  PrismaClient,
  typeof rnaWritebackSchema
> = async (prismaClient, data) => {
  await runBatchImport({
    prismaClient,
    model: prismaClient.usNcRNAWritebackData,
    tableName: "UsNcRNAWritebackData",
    idField: "pseudonymizedId",
    batchSize: BATCH_SIZE,
    pruneStale: false,
    data,
  });
};
