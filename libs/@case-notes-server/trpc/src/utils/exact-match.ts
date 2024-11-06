// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { BigQuery } from "@google-cloud/bigquery";
import _ from "lodash";
import { z } from "zod";

import { EXCLUDE_FILTER_CONDITIONS } from "~@case-notes-server/trpc/common/constants";
import { IncludeFilterConditions } from "~@case-notes-server/trpc/common/types";

const exactMatchSchema = z
  .array(
    z.object({
      id: z.string(),
      note_date: z.string().nullable(),
      note_title: z.string().nullable(),
      note_body: z.string().nullable(),
      note_type: z.string().nullable(),
      note_mode: z.string().nullable(),
    }),
  )
  .transform((results) => {
    return results.map((result) => {
      return {
        documentId: result.id,
        date: result.note_date ? new Date(result.note_date) : undefined,
        contactMode: result.note_mode ?? undefined,
        type: result.note_type ?? undefined,
        title: result.note_title ?? undefined,
        preview: result.note_body?.substring(0, 250),
        fullText: result.note_body ?? undefined,
      };
    });
  });

const SEARCHABLE_FIELDS = [
  "external_id",
  "note_body",
  "note_date",
  "note_id",
  "note_mode",
  "note_title",
  "note_type",
  "state_code",
];

const MAX_RESULTS = 50;

function formatFilterConditions(
  includeFilterConditions: IncludeFilterConditions,
) {
  const formattedConditions = [];

  formattedConditions.push(
    ..._.map(includeFilterConditions, (values, field) => {
      if (values.length === 0) {
        return undefined;
      }
      const valuesAsString = values.map((value) => `"${value}"`).join(", ");
      return `${field} IN (${valuesAsString})`;
    }),
  );

  formattedConditions.push(
    ..._.map(EXCLUDE_FILTER_CONDITIONS, (values, field) => {
      if (values.length === 0) {
        return undefined;
      }
      const valuesAsString = values.map((value) => `"${value}"`).join(", ");
      return `${field} NOT IN (${valuesAsString})`;
    }),
  );

  const definedFormattedConditions = formattedConditions.filter(
    (v) => v !== undefined,
  );

  return definedFormattedConditions.length
    ? definedFormattedConditions.join(" AND ")
    : undefined;
}

function extractCaseNotesResults(searchResults: unknown[]) {
  return exactMatchSchema.parse(searchResults);
}

type Options = {
  query: string;
  projectId: string;
  tableAddress: string;
  includeFilterConditions: IncludeFilterConditions;
};

export async function exactMatchSearch(options: Options) {
  const { query, projectId, tableAddress, includeFilterConditions } = options;

  // Adjust matching behavior based on query term length. Short terms should be treated
  // as full-word matches. e.g. "UA" should not match "graduation" or "February".
  const finalQuery = query.length <= 3 ? `\\b${query}\\b` : query;

  const bigQueryClient = new BigQuery({
    projectId,
  });

  const filter = formatFilterConditions(includeFilterConditions);
  const filterString = filter ? `${filter} AND` : "";

  const regex = SEARCHABLE_FIELDS.map((field) => {
    return `regexp_contains(lower(${field}), lower(r"${finalQuery}"))`;
  }).join(" OR ");

  const queryString = `SELECT * FROM \`${tableAddress}\` WHERE ${filterString} (${regex}) LIMIT ${MAX_RESULTS}`;

  const [results] = await bigQueryClient.query(queryString);

  return { results: extractCaseNotesResults(results), queryString };
}
