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

import Base64 from "crypto-js/enc-base64";
import SHA256 from "crypto-js/sha256";
import { GoogleAuth } from "google-auth-library";

import { AuthorizedUserProfile, Permission } from "~@jii/auth";

type AdminPanelUserResponse = {
  stateCode: string;
  district: string;
  allowedApps: Record<"jii" | "staff", boolean>;
  emailAddress: string;
};

export async function checkAdminPanelPermissions(
  userEmail: string,
): Promise<AuthorizedUserProfile | undefined> {
  const targetAudience = process.env["ADMIN_PANEL_IAP_AUDIENCE"];
  const adminPanelApiUrl = process.env["ADMIN_PANEL_API_URL"];

  if (!targetAudience || !adminPanelApiUrl) {
    throw new Error("missing configuration for Admin Panel access");
  }

  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(targetAudience);

  let userHash = Base64.stringify(SHA256(userEmail.toLowerCase()));
  if (userHash.startsWith("/")) {
    userHash = userHash.replace("/", "_");
  }
  const url = `${adminPanelApiUrl}/auth/users/${userHash}`;

  const response = await client.request<AdminPanelUserResponse>({
    url,
    retry: true,
  });

  const { stateCode, district, allowedApps, emailAddress } = response.data;

  if (!allowedApps?.jii) {
    // User does not have access to the JII app
    return undefined;
  }

  const permissions: Permission[] = ["enhanced"];

  if (
    // Do not show live data to test users in ID
    !(stateCode === "US_ID" && emailAddress.endsWith("@recidiviz-test.org"))
  ) {
    permissions.push("live_data");
  }

  return {
    stateCode,
    district,
    permissions,
  };
}
