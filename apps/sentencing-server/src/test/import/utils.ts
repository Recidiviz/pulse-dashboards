import { buildServer } from "~sentencing-server/server";
import {
  casePayloadMessage,
  clientPayloadMessage,
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

export function arrayToJsonLines(arr: object[]) {
  return arr.map((obj) => JSON.stringify(obj)).join("\n");
}
