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

import { tokenAuthResponseSchema } from "~@jii/auth";

import { segment } from "../../../../analytics/segment";
import { getFirebaseToken } from "../../../../auth/getFirebaseToken";
import { checkDemoResidentsRoster } from "../../../../auth/roster";
import { baseProcedure } from "../../../../procedures/init";
import {
  checkRecidivizEmployeeRoster,
  lookupResident,
  securusTestIdentity,
} from "./rosters";
import { decryptToken, verifyToken } from "./tokenHandlers";

// there is a one-off token for this endpoint only,
// so it's not really worth involving the common server plugin or middleware.
// all of the verification logic just lives with this route
export const edovoToken = baseProcedure.query(async ({ ctx: { req } }) => {
  const { decryptedToken, encryptedToken } = await decryptToken(req);
  const payload = await verifyToken(decryptedToken);

  let firebaseToken: string;
  let isRecidiviz = false;

  // the order of these checks is important; earlier ones
  // are intentionally chosen to supersede later ones that address edge cases

  // we start with these dedicated test accounts so collisions don't result in
  // escalation of privilege (because their IDs are just numbers that resemble real data)
  let userProfile = await securusTestIdentity(payload);
  if (!userProfile) {
    userProfile = await lookupResident(payload);
  }
  if (!userProfile) {
    userProfile = await checkRecidivizEmployeeRoster(payload);
    isRecidiviz = !!userProfile;
  }
  if (!userProfile) {
    const demoUserMatch = await checkDemoResidentsRoster(
      payload.facility_state,
      payload.inmate_id,
    );
    if (demoUserMatch) {
      userProfile = demoUserMatch;
    }
  }

  if (userProfile) {
    firebaseToken = await getFirebaseToken(
      `${payload.facility_state}_${payload.inmate_id}`,
      userProfile,
    );

    segment.track("backend_edovo_login_succeeded", {
      isRecidiviz,
      isDemoUser: !userProfile.permissions?.includes("live_data"),
      pseudonymizedId: userProfile.pseudonymizedId,
      stateCode: userProfile.stateCode,
      encryptedEdovoToken: encryptedToken,
    });
    segment.flush();

    return tokenAuthResponseSchema.parse({
      firebaseToken,
      user: userProfile,
      language: payload.language,
    });
  } else {
    segment.track("backend_edovo_login_denied", {
      isRecidiviz: isRecidiviz,
      stateCode: payload.facility_state,
      encryptedEdovoToken: encryptedToken,
    });
    segment.flush();
    throw new TRPCError({ code: "FORBIDDEN" });
  }
});
