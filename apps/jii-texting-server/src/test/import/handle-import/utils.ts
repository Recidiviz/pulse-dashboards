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

import { buildServer } from "~jii-texting-server/server";
import { importPersonRequestBody } from "~jii-texting-server/test/import/handle-import/constants";

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

export async function callHandleImportPersonData(
  server: ReturnType<typeof buildServer>,
) {
  return await callHandleImport(server, importPersonRequestBody);
}
