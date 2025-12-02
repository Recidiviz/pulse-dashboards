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

import Base64 from "crypto-js/enc-base64";
import SHA256 from "crypto-js/sha256";
import { GoogleAuth } from "google-auth-library";

import { AuthorizedUserProfile } from "~@jii/auth";

import { secrets } from "./secrets";

type AdminPanelUserResponse = {
  stateCode: string;
  district: string;
};

export async function checkAdminPanelPermissions(
  userEmail: string,
): Promise<AuthorizedUserProfile | undefined> {
  // Load service account credentials from Secrets Manager
  const credentials = JSON.parse(
    // TODO: Add this value to the secrets file
    await secrets.getLatestValue("JII_FUNCTIONS_SERVICE_ACCOUNT_CREDENTIAL"),
  );

  const auth = new GoogleAuth({ credentials });
  // TODO: Add this value to the secrets file
  const client = await auth.getIdTokenClient(
    await secrets.getLatestValue(
      "JII_FUNCTIONS_SERVICE_ACCOUNT_TARGET_AUDIENCE",
    ),
  );

  let userHash = Base64.stringify(SHA256(userEmail.toLowerCase()));
  if (userHash.startsWith("/")) {
    userHash = userHash.replace("/", "_");
  }
  const url = `${process.env["ADMIN_PANEL_API_URL"]}auth/users/${userHash}`;

  const response = await client.request<AdminPanelUserResponse>({
    url,
    retry: true,
  });

  const { stateCode, district } = response.data;

  return {
    stateCode,
    district,
    allowedStates: [stateCode],
    permissions: ["live_data", "enhanced"],
  };
}
