// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { authorizedUserProfileSchema, getAuth0Config } from "./configs";

describe("auth0 client config", () => {
  test("staging tenant", () => {
    expect(getAuth0Config("staging")).toMatchInlineSnapshot(`
      {
        "audience": "https://jii-api-staging.recidiviz.org",
        "client_id": "9SXcwNaSRiRv6zGuYY2pgPUFH8zMZF2O",
        "domain": "login-staging.opportunities.app",
      }
    `);
  });

  test("prod tenant", () => {
    expect(getAuth0Config("production")).toMatchInlineSnapshot(`
      {
        "audience": "https://jii-api.recidiviz.org",
        "client_id": "zODqQ6NV9NHwfbrr8vHmK2pwF9c4GSPU",
        "domain": "login.opportunities.app",
      }
    `);
  });

  test("demo tenant", () => {
    expect(getAuth0Config("demo")).toMatchInlineSnapshot(`
      {
        "audience": "https://jii-api-staging.recidiviz.org",
        "client_id": "fwgl9sl9sSyrPR8pda6ghv8dGJKGpsDC",
        "domain": "login-staging.opportunities.app",
      }
    `);
  });

  test("invalid tenant", () => {
    expect(getAuth0Config("any-other-value")).toMatchInlineSnapshot(`
      {
        "audience": "",
        "client_id": "",
        "domain": "",
      }
    `);
  });
});

describe("user metadata schema", () => {
  test("for JII users", () => {
    expect(
      authorizedUserProfileSchema.parse({
        stateCode: "US_ME",
        externalId: "123456",
        pseudonymizedId: "asnvawepeawhfeuawoghuil",
        permissions: ["live_data"],
      }),
    ).toMatchInlineSnapshot(`
      {
        "externalId": "123456",
        "permissions": [
          "live_data",
        ],
        "pseudonymizedId": "asnvawepeawhfeuawoghuil",
        "stateCode": "US_ME",
      }
    `);
  });

  test("all IDs must be present", () => {
    expect(() =>
      authorizedUserProfileSchema.parse({
        stateCode: "US_ME",
        externalId: "123456",
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [ZodError: [
        {
          "code": "custom",
          "message": "externalId and pseudonymizedId must both be present",
          "path": []
        }
      ]]
    `);

    expect(() =>
      authorizedUserProfileSchema.parse({
        stateCode: "US_ME",
        pseudonymizedId: "adfasdfasdfase",
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [ZodError: [
        {
          "code": "custom",
          "message": "externalId and pseudonymizedId must both be present",
          "path": []
        }
      ]]
    `);
  });

  test("for Recidiviz users", () => {
    expect(
      authorizedUserProfileSchema.parse({
        stateCode: "RECIDIVIZ",
        allowedStates: ["US_ME"],
        permissions: ["enhanced", "live_data"],
      }),
    ).toMatchInlineSnapshot(`
      {
        "allowedStates": [
          "US_ME",
        ],
        "permissions": [
          "enhanced",
          "live_data",
        ],
        "stateCode": "RECIDIVIZ",
      }
    `);
  });

  test("ignores unknown permissions", () => {
    expect(
      authorizedUserProfileSchema.parse({
        stateCode: "RECIDIVIZ",
        allowedStates: ["US_ME"],
        permissions: ["enhanced", "some_new_thing"],
      }).permissions,
    ).toEqual(["enhanced"]);
  });
});
