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

import { describe, test } from "vitest";

import { testTRPCClient } from "~@sentencing/server/test/setup";
import {
  fakeStaff
} from "~@sentencing/server/test/setup/seed";
import { testGetStaff } from "~@sentencing/trpc/test/common/utils";


describe("Server", () => {
  // eslint-disable-next-line vitest/expect-expect
  test("should include trpc routes", async () => {
    // If the trpc routes are not properly set up, this query will fail.
    const returnedStaff = await testTRPCClient.staff.getStaff.query({
      pseudonymizedId: fakeStaff.pseudonymizedId,
    });
    
    testGetStaff(returnedStaff)


  });
});
