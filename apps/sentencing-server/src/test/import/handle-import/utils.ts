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

import { faker } from "@faker-js/faker";
import { z } from "zod";

import { insightImportSchema } from "~sentencing-server/import/handle-import/models";
import { buildServer } from "~sentencing-server/server";
import {
  caseBody,
  clientBody,
  countiesAndDistrictsBody,
  insightBody,
  offenseBody,
  opportunityBody,
  staffBody,
} from "~sentencing-server/test/import/handle-import/constants";

export async function callHandleImport(
  server: ReturnType<typeof buildServer>,
  data: object,
) {
  return await server.inject({
    method: "POST",
    url: "/handle_import",
    payload: data,
    headers: { authorization: `Bearer token` },
  });
}

export async function callHandleImportCaseData(
  server: ReturnType<typeof buildServer>,
) {
  return await callHandleImport(server, caseBody);
}

export async function callHandleImportClientData(
  server: ReturnType<typeof buildServer>,
) {
  return await callHandleImport(server, clientBody);
}

export async function callHandleImportStaffData(
  server: ReturnType<typeof buildServer>,
) {
  return await callHandleImport(server, staffBody);
}

export async function callHandleImportOpportunityData(
  server: ReturnType<typeof buildServer>,
) {
  return await callHandleImport(server, opportunityBody);
}

export async function callHandleImportInsightData(
  server: ReturnType<typeof buildServer>,
) {
  return await callHandleImport(server, insightBody);
}

export async function callHandleImportOffenseData(
  server: ReturnType<typeof buildServer>,
) {
  return await callHandleImport(server, offenseBody);
}

export async function callHandleImportCountyAndDistrictData(
  server: ReturnType<typeof buildServer>,
) {
  return await callHandleImport(server, countiesAndDistrictsBody);
}

export function createFakeRecidivismSeriesForImport(
  keys: {
    sentence_type?: string;
    sentence_length_bucket_start?: number;
    sentence_length_bucket_end?: number;
  }[],
) {
  return JSON.stringify(
    keys.map((key) => {
      // Need to make sure the months are unique
      const months = faker.helpers.uniqueArray(
        () => faker.number.int({ max: 100 }),
        2,
      );

      return {
        ...key,
        data_points: months.map((month) => ({
          cohort_months: month,
          event_rate: faker.number.float(),
          lower_ci: faker.number.float(),
          upper_ci: faker.number.float(),
        })),
      };
    }) satisfies z.infer<typeof insightImportSchema>["recidivism_series"],
  );
}

export function createFakeDispositionsForImport(
  keys: {
    sentence_type?: string;
    sentence_length_bucket_start?: number;
    sentence_length_bucket_end?: number;
  }[],
) {
  return JSON.stringify(
    keys.map((key) => {
      return {
        ...key,
        percentage: faker.number.float(),
      };
    }) satisfies z.infer<typeof insightImportSchema>["dispositions"],
  );
}
