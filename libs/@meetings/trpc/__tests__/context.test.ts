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

import {
  initFastifyAndSetUser,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import { fakeStaff } from "~@meetings/trpc/test/setup/seed";

describe("auth", () => {
  test("invalid state code", async () => {
    await initFastifyAndSetUser({
      "https://dashboard.recidiviz.org/app_metadata": {
        // @ts-expect-error testing invalid state code
        stateCode: "US_OZ",
        pseudonymizedId: fakeStaff[0].pseudonymizedId,
      },
    });
    // arbitrary endpoint to test auth context
    await expect(
      testTRPCClient.v1.staff.getClients.query(),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCClientError: Unsupported state code provided in auth0 app_metadata: US_OZ]`,
    );
  });

  test("mismatched state", async () => {
    await initFastifyAndSetUser({
      "https://dashboard.recidiviz.org/app_metadata": {
        // auth header is hardcoded to request US_NE
        stateCode: "US_TN",
        pseudonymizedId: fakeStaff[0].pseudonymizedId,
      },
    });
    // arbitrary endpoint to test auth context
    await expect(
      testTRPCClient.v1.staff.getClients.query(),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCClientError: User with state code US_TN cannot request data about state: US_NE]`,
    );
  });

  test("missing pseudonymizedId", async () => {
    await initFastifyAndSetUser({
      "https://dashboard.recidiviz.org/app_metadata": {
        stateCode: "US_NE",
      },
    });
    // arbitrary endpoint to test auth context
    await expect(
      testTRPCClient.v1.staff.getClients.query(),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCClientError: Missing pseudonymizedId for user]`,
    );
  });

  test("recidiviz not allowed state", async () => {
    await initFastifyAndSetUser({
      "https://dashboard.recidiviz.org/app_metadata": {
        stateCode: "recidiviz",
        // auth header is hardcoded to request US_NE
        allowedStates: ["US_TN"],
      },
    });
    // arbitrary endpoint to test auth context
    await expect(
      testTRPCClient.v1.staff.getClients.query(),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCClientError: Recidiviz user cannot request data about state: US_NE. File a go/access request for access]`,
    );
  });
});
