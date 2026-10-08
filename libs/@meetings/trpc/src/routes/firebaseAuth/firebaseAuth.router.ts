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

import firebaseAdmin from "firebase-admin";

import { auth0Procedure, router } from "~@meetings/trpc/init";
import { firebaseApp } from "~@meetings/trpc/routes/firebaseAuth/firebaseAdmin";

/**
 * The JII integration for NE 120-Day Check-In requires the meetings application to pass
 * a valid firebase token with custom claims to the JII server.
 */
export const firebaseAuthRouter = router({
  getFirebaseToken: auth0Procedure.query(
    async ({ ctx: { user, stateCode } }) => {
      const isImpersonating = !!user.impersonatedBy;
      // JII's permissions logic expects the literal "RECIDIVIZ" for a recidiviz
      // user's state code, unless impersonating.
      const claimStateCode =
        isImpersonating || !user.isRecidivizUser ? stateCode : "RECIDIVIZ";

      const firebaseToken = await firebaseAdmin
        .auth(firebaseApp())
        .createCustomToken(user.email, {
          // "app" field must match the JII AuthorizedStaffAppUserProfile schema
          app: "meetings",
          stateCode: claimStateCode,
          recidivizAllowedStates: (user.allowedStates ?? []).map((s) =>
            s.toUpperCase(),
          ),
          impersonator: isImpersonating,
        });

      return { firebaseToken };
    },
  ),
});
