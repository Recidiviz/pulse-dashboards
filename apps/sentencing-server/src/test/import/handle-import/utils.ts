import { faker } from "@faker-js/faker";

import { buildServer } from "~sentencing-server/server";
import {
  caseBody,
  clientBody,
  insightBody,
  offenseBody,
  opportunityBody,
  staffBody,
} from "~sentencing-server/test/import/handle-import/constants";

async function callHandleImport(
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

export function createFakeRecidivismSeriesForImport() {
  // Need to make sure the months are unique
  const months = faker.helpers.uniqueArray(
    () => faker.number.int({ max: 100 }),
    2,
  );

  return months.map((month) => {
    return {
      cohort_months: month,
      event_rate: faker.number.float(),
      lower_ci: faker.number.float(),
      upper_ci: faker.number.float(),
    };
  });
}
