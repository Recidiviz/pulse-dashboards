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

import { captureException } from "@sentry/node";
import { TRPCError } from "@trpc/server";

import { createCachedCall } from "../../../../helpers/createCachedCall";
import { getSheetData } from "../../../../helpers/googleSheets";
import { processProgram } from "./processProgram";
import { ProgramFromSheet, programFromSheetSchema } from "./schema";
import { US_AR_CONFIG } from "./stateConfigs/US_AR";
import { US_CO_CONFIG } from "./stateConfigs/US_CO";
import { US_MA_CONFIG } from "./stateConfigs/US_MA";
import type { ProcessedProgram, ProgramsSource } from "./types";

/** Reads one language's rows, dropping any that fail validation. */
async function fetchRows(
  spreadsheetEnvVar: string,
  { range, fixtures }: ProgramsSource,
): Promise<ProgramFromSheet[]> {
  if (process.env["IS_OFFLINE"]) {
    return fixtures;
  }

  const spreadsheetId = process.env[spreadsheetEnvVar];

  if (!spreadsheetId) {
    throw new Error(`${spreadsheetEnvVar} is not set`);
  }

  const rows = await getSheetData(spreadsheetId, range);
  return rows.flatMap((row) => {
    const result = programFromSheetSchema.safeParse(row);
    if (result.error) {
      captureException(result.error);
      return [];
    }
    return [result.data];
  });
}

const PROGRAMS_CONFIG = {
  US_AR: US_AR_CONFIG,
  US_CO: US_CO_CONFIG,
  US_MA: US_MA_CONFIG,
};

// Google Sheets rate limits are per-minute, so we use a TTL of 1 minute
// to avoid throttling while still ensuring reasonably fresh data.
// Each state and language gets its own cached fetcher so their caches are independent.
const cachedFetchers = Object.fromEntries(
  Object.entries(PROGRAMS_CONFIG).flatMap(([stateCode, config]) =>
    Object.entries(config.sources).map(([language, source]) => [
      `${stateCode}:${language}`,
      createCachedCall(() => fetchRows(config.spreadsheetEnvVar, source), 60),
    ]),
  ),
);

/**
 * Programs for a state, in `language` where we have it. Keys always come from the
 * English tab, so a translation only ever supplies display copy
 */
export async function fetchProgramsForState(
  stateCode: string,
  language = "en",
): Promise<ProcessedProgram[]> {
  const fetchEnglish = cachedFetchers[`${stateCode}:en`];
  if (!fetchEnglish) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No programs configured for ${stateCode}`,
    });
  }
  const englishRows = await fetchEnglish();

  // browsers report region codes, so "es-US" and "es-MX" both read the ES tab
  const [baseLanguage] = language.split("-");

  const fetchTranslated = cachedFetchers[`${stateCode}:${baseLanguage}`];

  // English or an unsupported language won't have translation
  if (baseLanguage === "en" || !fetchTranslated) {
    return englishRows.map((row) => processProgram(row));
  }

  const translatedRows = await fetchTranslated().catch((error) => {
    captureException(error);
    return [];
  });
  const translatedByProgramId = new Map(
    translatedRows.map((row) => [row.programId, row]),
  );

  return englishRows.map((row) =>
    processProgram(row, translatedByProgramId.get(row.programId)),
  );
}
