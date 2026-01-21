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

import { userId } from "../../test/context";
import { testPrismaClient } from "../../test/prisma";
import type { AuthorizedUserContext } from "../firebaseAuth";
import { baseProcedure } from "../init";

// the real procedure depends on third party services such as Firestore
// to create a context for authorized users; this just mocks that result
// for a standardized test user
export const firebaseAuthedProcedure = baseProcedure.use((opts) => {
  return opts.next({
    ctx: {
      userId,
      userProfile: {
        stateCode: "US_XX",
      },
      stateCode: "US_XX",
      prisma: testPrismaClient,
    } satisfies AuthorizedUserContext,
  });
});
