import { buildServer } from "~sentencing-server/server";
import {
  encodedCaseJsonPayload,
  encodedClientJsonPayload,
  encodedStaffJsonPayload,
} from "~sentencing-server/test/import/constants";

async function callTriggerImport(
  server: ReturnType<typeof buildServer>,
  data: string,
) {
  return await server.inject({
    method: "POST",
    url: "/trigger_import",
    payload: { message: { data } },
  });
}

export async function callImportCaseData(
  server: ReturnType<typeof buildServer>,
) {
  return await callTriggerImport(server, encodedCaseJsonPayload);
}

export async function callImportClientData(
  server: ReturnType<typeof buildServer>,
) {
  return await callTriggerImport(server, encodedClientJsonPayload);
}

export async function callImportStaffData(
  server: ReturnType<typeof buildServer>,
) {
  return await callTriggerImport(server, encodedStaffJsonPayload);
}
