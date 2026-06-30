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

import { PrismaClient, ResidentCreateInput } from "~@jii/prisma";
import { LoaderFn } from "~data-import-plugin";
import { FullName } from "~datatypes";

import { residentSchema } from "../../models";
import {
  bulkUpdate,
  type BulkUpdateEntries,
  BulkUpdateEntry,
} from "../../utils/bulkUpdate";

export const BATCH_SIZE = 500;

// we'll use this to make sure no fields are missing when we spread the name blobs
const personNameDefaults: Record<keyof FullName, null> = {
  givenNames: null,
  middleNames: null,
  surname: null,
};

export const residentHandler: LoaderFn<
  PrismaClient,
  typeof residentSchema
> = async (prismaClient, data) => {
  const importTimestamp = new Date();

  // existing residents will be updated, new ones will be created
  const existingResidentIds = new Set(
    (
      await prismaClient.resident.findMany({
        select: { pseudonymizedId: true },
      })
    ).map((r) => r.pseudonymizedId),
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
      ["pseudonymizedId"],
      updateBatch,
    );
    updateBatch = [];
  };

  for await (const d of data) {
    const {
      personName,
      // we don't actually have to include state code in the import,
      // data has already been segmented by state
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      stateCode,
      ...passthroughFields
    } = d;

    // because we're spreading this into columns in the SQL query,
    // we have to make sure there are no missing fields, or we may get
    // a SQL syntax error in bulkUpdate
    const personNameData = { ...personNameDefaults, ...personName };

    const newResidentData = {
      ...passthroughFields,
      ...personNameData,
      importedAt: importTimestamp,
    } satisfies ResidentCreateInput & BulkUpdateEntry;

    if (existingResidentIds.has(d.pseudonymizedId)) {
      updateBatch.push(newResidentData);
    } else {
      createBatch.push(newResidentData);
    }

    if (createBatch.length >= BATCH_SIZE) {
      await flushCreateBatch();
    }
    if (updateBatch.length >= BATCH_SIZE) {
      await flushUpdateBatch();
    }
  }

  await flushCreateBatch();
  await flushUpdateBatch();

  // residents no longer active can be dropped from the table
  await prismaClient.resident.deleteMany({
    where: { importedAt: { lt: importTimestamp } },
  });
};
