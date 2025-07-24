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

import { type PrismaClient } from "~@reentry/prisma/client";

export type BulkUpdateEntry = {
  [key: string]: number | string | boolean | Date;
};
export type BulkUpdateEntries = BulkUpdateEntry[];

const PRISMA_COLUMN_NAME_TO_ENUM_NAME: Record<string, string> = {
  stateCode: "StateCode",
};

/**
 * Helper function to perform a bulk update on a Prisma table.
 * This function constructs a raw SQL query to update multiple rows in a single transaction.
 *
 * Adapted from https://gist.github.com/aalin/ea23b786e3d55329f6257c0f6576418b
 *
 * WARNING: SHOULD NOT BE USED OUTSIDE OF DATA IMPORT SINCE executeRawUnsafe can be susceptible to SQL injection.
 */
export async function bulkUpdate(
  prismaClient: PrismaClient,
  tableName: string,
  idColumnName: string,
  entries: BulkUpdateEntries,
) {
  if (entries.length === 0) {
    return;
  }

  const fields = Object.keys(entries[0]).filter((key) => key !== idColumnName);
  const setSql = fields
    .map((field) => `"${field}" = data."${field}"`)
    .join(", ");

  const valuesSql = entries
    .map((entry) => {
      const values = fields.map((field) => {
        const value = entry[field];
        // Handle enum values for columns listed in PRISMA_COLUMN_NAME_TO_ENUM_NAME
        if (
          field in PRISMA_COLUMN_NAME_TO_ENUM_NAME &&
          typeof value === "string"
        ) {
          // For enum columns, we don't need to wrap the value in quotes
          return `'${value}'::"${PRISMA_COLUMN_NAME_TO_ENUM_NAME[field]}"`;
        } else if (typeof value === "string") {
          // Handle strings and escape single quotes
          return `'${value.replace(/'/g, "''")}'`;
        } else if (value instanceof Date) {
          // Convert Date to ISO 8601 string format
          return `'${value.toISOString()}'::timestamp`;
        }
        // Numbers and booleans are used as-is
        return value;
      });

      return `('${entry[idColumnName]}', ${values.join(", ")})`;
    })
    .join(", ");

  const sql = `
    UPDATE "${tableName}"
    SET ${setSql}
    FROM (VALUES ${valuesSql}) AS data(id, ${fields
      .map((field) => `"${field}"`)
      .join(", ")})
    WHERE "${tableName}"."${idColumnName}"::text = data.id;
  `;

  await prismaClient.$executeRawUnsafe(sql);
}
