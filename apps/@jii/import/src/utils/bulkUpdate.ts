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

export type BulkUpdateEntry = {
  [key: string]:
    | number
    | string
    | boolean
    | Date
    | null
    | bigint
    | string[]
    | Record<string, unknown>;
};
export type BulkUpdateEntries = BulkUpdateEntry[];

/**
 * Helper function to perform a bulk update on a Prisma table.
 * This function constructs a raw SQL query to update multiple rows in a single transaction.
 *
 * Taken from the meetings and reentry import apps.
 *
 * WARNING: SHOULD NOT BE USED OUTSIDE OF DATA IMPORT SINCE executeRawUnsafe can be susceptible to SQL injection.
 */
export async function bulkUpdate(
  prismaClient: PrismaClient,
  tableName: string,
  idColumnNames: string[],
  entries: BulkUpdateEntries,
) {
  if (entries.length === 0) {
    return;
  }

  const fields = Object.keys(entries[0]).filter(
    (key) => !idColumnNames.includes(key),
  );
  const setSql = fields
    .map((field) => `"${field}" = data."${field}"`)
    .join(", ");

  const valuesSql = entries
    .map((entry) => {
      const values = fields.map((field) => {
        const value = entry[field];
        if (Array.isArray(value)) {
          // Only string arrays are supported; other element types require a
          // different PostgreSQL cast and should be added explicitly if needed.
          if (value.some((v) => typeof v !== "string")) {
            throw new Error(
              `bulkUpdate only supports string[] arrays, got non-string element in field "${field}"`,
            );
          }
          const escaped = value.map((v) => `'${v.replace(/'/g, "''")}'`);
          return `ARRAY[${escaped.join(", ")}]::text[]`;
        } else if (typeof value === "string") {
          // Handle strings and escape single quotes
          return `'${value.replace(/'/g, "''")}'`;
        } else if (value instanceof Date) {
          // Convert Date to ISO 8601 string format
          return `'${value.toISOString()}'::timestamp`;
        } else if (value === null) {
          return "NULL";
        } else if (typeof value === "object") {
          // escape single quotes in JSON strings
          return `'${JSON.stringify(value).replace(/'/g, "''")}'::json`;
        }
        // Others are used as-is
        return value;
      });

      return `(${idColumnNames.map((idCol) => `'${entry[idCol]}'`).join(", ")}, ${values.join(", ")})`;
    })
    .join(", ");

  const sql = `
    UPDATE "${tableName}"
    SET ${setSql}
    FROM (VALUES ${valuesSql}) AS data(${idColumnNames.join(", ")}, ${fields
      .map((field) => `"${field}"`)
      .join(", ")})
    WHERE ${idColumnNames
      .map((idCol) => `"${tableName}"."${idCol}"::text = data.${idCol}`)
      .join(" AND ")};
  `;

  await prismaClient.$executeRawUnsafe(sql);
}
