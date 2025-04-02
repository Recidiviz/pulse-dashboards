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

import _ from "lodash";
import { describe, expect, test } from "vitest";

import { testTRPCClient } from "~@sentencing/server/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeStaff,
} from "~@sentencing/server/test/setup/seed";

describe("Server", () => {
  test("should include trpc routes", async () => {
    // If the trpc routes are not properly set up, this query will fail.
    const returnedStaff = await testTRPCClient.staff.getStaff.query({
      pseudonymizedId: fakeStaff.pseudonymizedId,
    });

    expect(returnedStaff).toEqual({
      ..._.omit(fakeStaff, "externalId"),
      cases: [
        {
          ..._.pick(fakeCase, [
            "id",
            "externalId",
            "dueDate",
            "reportType",
            "status",
            "offense",
            "isCancelled",
          ]),
          client: _.pick(fakeClient, ["fullName", "externalId"]),
        },
      ],
    });
  });
});
