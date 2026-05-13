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

import { TRPCError } from "@trpc/server";
import { createHash } from "crypto";
import { GoogleAuth } from "google-auth-library";

import { StateCode } from "~@meetings/prisma/client";
import env from "~@meetings/trpc/env";

function computeUserHash(email: string): string {
  const hash = createHash("sha256")
    .update(email.toLowerCase())
    .digest("base64");
  // The staff server sanitizes leading slashes
  return hash.startsWith("/") ? `_${hash.slice(1)}` : hash;
}

export type ImpersonatedUser = {
  stateCode: StateCode;
};

export async function fetchImpersonatedUser(
  email: string,
): Promise<ImpersonatedUser> {
  const userHash = computeUserHash(email);
  const url = `${env.RECIDIVIZ_DATA_API_URL}/auth/users/${userHash}`;

  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(
    env.GOOGLE_APPLICATION_CREDENTIALS_TARGET_AUDIENCE,
  );
  const response = await client.request<{ stateCode: string }>({ url });

  if (!response.data?.stateCode) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No user found for email: ${email}`,
    });
  }

  const stateCode = response.data.stateCode.toUpperCase();

  if (!Object.values(StateCode).includes(stateCode as StateCode)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code for impersonated user: ${stateCode}`,
    });
  }

  return { stateCode: stateCode as StateCode };
}
