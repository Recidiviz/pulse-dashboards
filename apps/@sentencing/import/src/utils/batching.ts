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

import _ from "lodash";

import { Prisma, PrismaClient, StateCode } from "~@sentencing/prisma/client";

/** Number of rows read from an import file and written together. */
export const DEFAULT_BATCH_SIZE = 1000;

// Stays under the Postgres limit of 65,535 bind parameters per statement, and
// low enough that Prisma never splits a createMany into several inserts inside
// a transaction.
const MAX_PARAMS_PER_STATEMENT = 30_000;

// Prisma keeps its most recent queries in memory, values included, so smaller
// statements keep the import's memory use bounded.
const MAX_ROWS_PER_STATEMENT = 1000;

/** Groups the rows of an import file into arrays of up to batchSize rows. */
export async function* inBatches<T>(
  data: AsyncIterable<T>,
  batchSize = DEFAULT_BATCH_SIZE,
): AsyncGenerator<T[]> {
  let batch: T[] = [];
  for await (const row of data) {
    batch.push(row);
    if (batch.length >= batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) yield batch;
}

/** Splits rows into chunks small enough to write in one statement. */
export function chunkForStatement<T>(rows: T[], paramsPerRow: number): T[][] {
  return _.chunk(
    rows,
    Math.max(
      1,
      Math.min(
        MAX_ROWS_PER_STATEMENT,
        Math.floor(MAX_PARAMS_PER_STATEMENT / paramsPerRow),
      ),
    ),
  );
}

/**
 * Keeps the last row for each key, so a later row in the file wins. A bulk
 * statement can't write the same row twice.
 */
export function lastRowPerKey<T>(rows: T[], key: (row: T) => string): T[] {
  return [...new Map(rows.map((row) => [key(row), row])).values()];
}

const quote = (column: string) => Prisma.raw(`"${column}"`);

const valuesList = (rows: Record<string, unknown>[], columns: string[]) =>
  Prisma.join(
    rows.map(
      (row) =>
        Prisma.sql`(${Prisma.join(columns.map((column) => row[column] ?? null))})`,
    ),
  );

/**
 * Returns the columns of the first row, which every statement writes. Throws if
 * another row has different keys, since its extra fields would not be written.
 */
function columnsOf(rows: Record<string, unknown>[]) {
  const columns = Object.keys(rows[0]);
  for (const row of rows) {
    const mismatched = _.xor(Object.keys(row), columns);
    if (mismatched.length > 0) {
      throw new Error(
        `Every row must have the same columns. Mismatched: ${mismatched.join(", ")}`,
      );
    }
  }
  return columns;
}

type BulkUpsertOptions = {
  table: string;
  /**
   * Every row must have the same keys, which become the inserted columns. Leave
   * a value undefined or null to insert NULL.
   */
  rows: Record<string, unknown>[];
  /** Columns of the unique constraint that identifies an existing row. */
  conflictColumns: string[];
  /** Columns written on insert but never overwritten, such as generated ids. */
  insertOnlyColumns?: string[];
  /** Columns that keep their current value when the new one is null. */
  keepExistingWhenNull?: string[];
  /**
   * Custom update expressions by column, written in terms of EXCLUDED (the new
   * row) and the table name (the existing row). Only for trusted, static SQL.
   */
  updateExpressions?: Record<string, string>;
  /** Columns to return for every inserted or updated row. */
  returning?: string[];
};

/**
 * Inserts rows, or updates them when they already exist, with one
 * INSERT ... ON CONFLICT statement per chunk. Prisma has no bulk upsert.
 *
 * Values are passed as untyped parameters, so Postgres converts each one to the
 * column's type, enums and arrays included.
 */
export async function bulkUpsert<T = Record<string, unknown>>(
  prismaClient: PrismaClient,
  {
    table,
    rows,
    conflictColumns,
    insertOnlyColumns = [],
    keepExistingWhenNull = [],
    updateExpressions = {},
    returning = [],
  }: BulkUpsertOptions,
): Promise<T[]> {
  if (rows.length === 0) return [];

  const columns = columnsOf(rows);
  const setClauses = columns
    .filter(
      (column) =>
        !conflictColumns.includes(column) &&
        !insertOnlyColumns.includes(column),
    )
    .map((column) => {
      if (updateExpressions[column]) {
        return `"${column}" = ${updateExpressions[column]}`;
      }
      if (keepExistingWhenNull.includes(column)) {
        return `"${column}" = COALESCE(EXCLUDED."${column}", "${table}"."${column}")`;
      }
      return `"${column}" = EXCLUDED."${column}"`;
    });
  const onConflict =
    setClauses.length > 0
      ? `DO UPDATE SET ${setClauses.join(", ")}`
      : "DO NOTHING";

  const results: T[] = [];
  for (const chunk of chunkForStatement(rows, columns.length)) {
    const query = Prisma.sql`
      INSERT INTO ${quote(table)} (${Prisma.join(columns.map(quote))})
      VALUES ${valuesList(chunk, columns)}
      ON CONFLICT (${Prisma.join(conflictColumns.map(quote))}) ${Prisma.raw(onConflict)}
      ${returning.length > 0 ? Prisma.sql`RETURNING ${Prisma.join(returning.map(quote))}` : Prisma.empty}`;

    if (returning.length > 0) {
      // eslint-disable-next-line no-await-in-loop -- one statement at a time keeps load on the database low
      results.push(...(await prismaClient.$queryRaw<T[]>(query)));
    } else {
      // eslint-disable-next-line no-await-in-loop -- one statement at a time keeps load on the database low
      await prismaClient.$executeRaw(query);
    }
  }
  return results;
}

/**
 * Sets text columns on existing rows, matched by keyColumn, with one
 * UPDATE ... FROM (VALUES ...) statement per chunk. Rows that don't match are
 * ignored.
 *
 * The values are compared and assigned as text, so this is only for text
 * columns, such as the external ids that link staff, clients, and cases.
 */
export async function bulkUpdateText(
  prismaClient: PrismaClient,
  {
    table,
    keyColumn,
    rows,
  }: {
    table: string;
    keyColumn: string;
    /** Each row holds the key plus the columns to set. */
    rows: Record<string, string | null>[];
  },
) {
  if (rows.length === 0) return;

  const columns = columnsOf(rows);
  const setClause = columns
    .filter((column) => column !== keyColumn)
    .map((column) => `"${column}" = v."${column}"`)
    .join(", ");

  for (const chunk of chunkForStatement(rows, columns.length)) {
    // eslint-disable-next-line no-await-in-loop -- one statement at a time keeps load on the database low
    await prismaClient.$executeRaw`
      UPDATE ${quote(table)} AS t SET ${Prisma.raw(setClause)}
      FROM (VALUES ${valuesList(chunk, columns)}) AS v(${Prisma.join(columns.map(quote))})
      WHERE t.${quote(keyColumn)} = v.${quote(keyColumn)}`;
  }
}

/**
 * Returns the ids of the named counties or districts, creating any that don't
 * exist yet. Names are unique and case-insensitive, so the cache is keyed by
 * the lowercased name and can be shared across batches.
 */
export async function getOrCreateIdsByName(
  prismaClient: PrismaClient,
  model: "county" | "district",
  entries: { stateCode: StateCode; name: string }[],
  cache: Map<string, string>,
) {
  const missing = lastRowPerKey(
    entries.filter(({ name }) => !cache.has(name.toLowerCase())),
    ({ name }) => name.toLowerCase(),
  );
  if (missing.length === 0) return cache;

  const names = missing.map(({ name }) => name);
  // Prisma's delegates don't share a callable type, so each model is spelled out.
  if (model === "county") {
    await prismaClient.county.createMany({
      data: missing,
      skipDuplicates: true,
    });
    const found = await prismaClient.county.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true },
    });
    found.forEach(({ id, name }) => cache.set(name.toLowerCase(), id));
  } else {
    await prismaClient.district.createMany({
      data: missing,
      skipDuplicates: true,
    });
    const found = await prismaClient.district.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true },
    });
    found.forEach(({ id, name }) => cache.set(name.toLowerCase(), id));
  }
  return cache;
}
