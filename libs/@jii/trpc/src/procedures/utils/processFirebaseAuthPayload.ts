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
import { z, ZodTypeAny } from "zod";

import { verifyFirebaseIdToken } from "~server-setup-plugin";

import { jwtSchema } from "../../auth/utils";
import { TRPCFastifyRequest } from "../../context";

export async function processFirebaseAuthPayload<Schema extends ZodTypeAny>(
  req: TRPCFastifyRequest,
  userProfileSchema: Schema,
): Promise<{ userId: string; userProfile: z.infer<Schema> }> {
  const authPayload = await verifyFirebaseIdToken(req);

  try {
    const userId = jwtSchema.parse(authPayload).sub;
    const userProfile = userProfileSchema.parse(authPayload);

    return { userId, userProfile };
  } catch (e) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Auth token missing required claims",
      cause: e,
    });
  }
}
