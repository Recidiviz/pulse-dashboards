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

import { type PrismaClient } from "~@jii/prisma";
import { type LoaderContext } from "~data-import-plugin";

import { bulkUpdate, type BulkUpdateEntry } from "./bulkUpdate";
import { requireNonemptyString } from "./requireNonemptyString";

export const DEFAULT_BATCH_SIZE = 500;
/** Keeps prune deletes well below Postgres's cap on parameters. */
export const DELETE_CHUNK_SIZE = 1000;

/** Minimal structural view of the subset of a Prisma model delegate this helper needs. */
export interface BatchImportModel<CreateInput> {
  findMany(args: {
    select: Record<string, boolean>;
  }): Promise<Array<Record<string, unknown>>>;
  createMany(args: { data: CreateInput[] }): Promise<unknown>;
  deleteMany(args: { where: Record<string, unknown> }): Promise<unknown>;
}

/**
 * The row written to the database: a parsed record, stamped with this run's import timestamp.
 * Any other transformation a model needs should happen in its import schema, so that a parsed
 * record is already in the shape its table expects.
 */
export type ImportRow<ImportRecord> = ImportRecord & { importedAt: Date };

export interface BatchImportOptions<ImportRecord extends BulkUpdateEntry> {
  prismaClient: PrismaClient;
  /** The Prisma delegate for the target model, e.g. prismaClient.resident. */
  model: BatchImportModel<ImportRow<ImportRecord>>;
  // Prisma's generated client doesn't expose a model's underlying Postgres table name
  // at runtime off its delegate object, so bulkUpdate's raw SQL needs it supplied directly.
  /** The Postgres table name, usually the model name in PascalCase, e.g. "Resident". */
  tableName: string;
  // BulkUpdateEntry's index signature means `keyof ImportRecord` alone could include
  // `number`, so this needs the `& string` to restrict it to normal object properties.
  /** Column that uniquely identifies a row. */
  idField: keyof ImportRecord & string;
  data: AsyncIterable<ImportRecord>;
  batchSize: number;
  /**
   * Whether to delete rows that this run neither imported nor skipped, once the import completes.
   */
  pruneStale: boolean;
  context: LoaderContext;
}

function requireStringId(input: unknown) {
  try {
    return requireNonemptyString(input);
  } catch {
    throw new Error("Only string ID fields are supported");
  }
}

/**
 * Loads data from a parsed-record generator into a Prisma table in batches, creating or
 * updating each record depending on whether its id already exists in the table. Optionally removes
 * old records once the loading steps are complete.
 * Each parsed record is written as-is, stamped with this run's import timestamp, so any
 * transformation a model needs should happen in its import schema.
 */
export async function runBatchImport<ImportRecord extends BulkUpdateEntry>(
  options: BatchImportOptions<ImportRecord>,
): Promise<void> {
  const {
    prismaClient,
    model,
    tableName,
    idField,
    data,
    batchSize,
    pruneStale,
    context,
  } = options;

  const importedAt = new Date();

  // existing records will be updated, new ones will be created
  const existingIds = new Set(
    (await model.findMany({ select: { [idField]: true } })).map((r) =>
      requireStringId(r[idField]),
    ),
  );

  const importedIds = new Set<string>();

  let createBatch: ImportRow<ImportRecord>[] = [];
  let updateBatch: ImportRow<ImportRecord>[] = [];

  const flushCreateBatch = async () => {
    if (createBatch.length === 0) return;
    await model.createMany({ data: createBatch });
    createBatch = [];
  };

  const flushUpdateBatch = async () => {
    if (updateBatch.length === 0) return;
    await bulkUpdate(prismaClient, tableName, [idField], updateBatch);
    updateBatch = [];
  };

  for await (const record of data) {
    const row: ImportRow<ImportRecord> = { ...record, importedAt };
    const id = requireStringId(row[idField]);
    importedIds.add(id);

    if (existingIds.has(id)) {
      updateBatch.push(row);
      if (updateBatch.length >= batchSize) await flushUpdateBatch();
    } else {
      createBatch.push(row);
      if (createBatch.length >= batchSize) await flushCreateBatch();
    }
  }

  await flushCreateBatch();
  await flushUpdateBatch();

  if (pruneStale) {
    const { skippedRowIds, unidentifiedSkippedRowCount } = context;

    if (unidentifiedSkippedRowCount > 0) {
      // we cannot tell which existing rows these failures correspond to, and so cannot tell a
      // record that has left the population from one whose data was too broken to read.
      // Safer to leave all stale data in place than to overzealously prune it
      console.warn(
        `Not removing any ${tableName} records: ${unidentifiedSkippedRowCount} row(s) lacked a readable ${idField}, so stale records cannot be reliably pruned.`,
      );
      return;
    }

    if (skippedRowIds.size > 0) {
      console.log(
        `Keeping ${skippedRowIds.size} existing ${tableName} record(s) whose incoming data failed to import; their data may now be stale.`,
      );
    }

    // records no longer present in the current import can be dropped from the table, but records
    // whose incoming data failed to parse are kept: their data is now stale, but deleting them
    // would take the record out of the product entirely
    const idsToDelete = [...existingIds].filter(
      (id) => !importedIds.has(id) && !skippedRowIds.has(id),
    );

    // chunks are deleted one at a time so that a large prune doesn't flood the DB connection
    for (let i = 0; i < idsToDelete.length; i += DELETE_CHUNK_SIZE) {
      // eslint-disable-next-line no-await-in-loop -- deliberately serial, see above
      await model.deleteMany({
        where: {
          [idField]: { in: idsToDelete.slice(i, i + DELETE_CHUNK_SIZE) },
        },
      });
    }
  }
}
