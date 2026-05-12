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
import { ProgramFromSheet, programFromSheetSchema } from "./schema";
import { US_AR_CONFIG } from "./stateConfigs/US_AR";
import { US_CO_CONFIG } from "./stateConfigs/US_CO";
import { US_MA_CONFIG } from "./stateConfigs/US_MA";
import type { ProgramsConfig } from "./types";

async function fetchProgramsForConfig(
  config: ProgramsConfig,
): Promise<ProgramFromSheet[]> {
  if (process.env["IS_OFFLINE"]) {
    return config.fixtures;
  }

  const spreadsheetId = process.env[config.spreadsheetEnvVar];

  if (!spreadsheetId) {
    throw new Error(`${config.spreadsheetEnvVar} is not set`);
  }

  const rows = await getSheetData(spreadsheetId, config.sheetRange);
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
// Each state gets its own cached fetcher so their caches are independent.
const cachedFetchersByState = Object.fromEntries(
  Object.entries(PROGRAMS_CONFIG).map(([stateCode, config]) => [
    stateCode,
    createCachedCall(() => fetchProgramsForConfig(config), 60),
  ]),
);

export function fetchProgramsForState(
  stateCode: string,
): Promise<ProgramFromSheet[]> {
  const fetcher = cachedFetchersByState[stateCode];
  if (!fetcher) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No programs configured for ${stateCode}`,
    });
  }
  return fetcher();
}
