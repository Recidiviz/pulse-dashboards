import { faker } from "@faker-js/faker";

import { buildServer } from "~sentencing-server/server";
import {
  casePayloadMessage,
  clientPayloadMessage,
  insightPayloadMessage,
  opportunityPayloadMessage,
  staffPayloadMessage,
} from "~sentencing-server/test/import/constants";

async function callTriggerImport(
  server: ReturnType<typeof buildServer>,
  data: object,
) {
  return await server.inject({
    method: "POST",
    url: "/trigger_import",
    payload: { message: data },
    headers: { authorization: `Bearer token` },
  });
}

export async function callImportCaseData(
  server: ReturnType<typeof buildServer>,
) {
  return await callTriggerImport(server, casePayloadMessage);
}

export async function callImportClientData(
  server: ReturnType<typeof buildServer>,
) {
  return await callTriggerImport(server, clientPayloadMessage);
}

export async function callImportStaffData(
  server: ReturnType<typeof buildServer>,
) {
  return await callTriggerImport(server, staffPayloadMessage);
}

export async function callImportOpportunityData(
  server: ReturnType<typeof buildServer>,
) {
  return await callTriggerImport(server, opportunityPayloadMessage);
}

export async function callImportInsightData(
  server: ReturnType<typeof buildServer>,
) {
  return await callTriggerImport(server, insightPayloadMessage);
}

export function arrayToJsonLines(arr: object[]) {
  return arr.map((obj) => JSON.stringify(obj)).join("\n");
}

export function createFakeRecidivismSeries() {
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
