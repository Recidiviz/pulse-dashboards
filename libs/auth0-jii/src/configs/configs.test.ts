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

import { getAuth0Config, metadataSchema } from "./configs";

describe("auth0 client config", () => {
  test("staging tenant", () => {
    expect(getAuth0Config("staging")).toMatchInlineSnapshot(`
      {
        "audience": "https://jii-api-staging.recidiviz.org",
        "client_id": "9SXcwNaSRiRv6zGuYY2pgPUFH8zMZF2O",
        "domain": "recidiviz-jii-staging.us.auth0.com",
      }
    `);
  });

  test("prod tenant", () => {
    expect(getAuth0Config("production")).toMatchInlineSnapshot(`
      {
        "audience": "https://jii-api.recidiviz.org",
        "client_id": "zODqQ6NV9NHwfbrr8vHmK2pwF9c4GSPU",
        "domain": "recidiviz-jii.us.auth0.com",
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
    expect(metadataSchema.parse({ stateCode: "US_ME" })).toMatchInlineSnapshot(`
      {
        "stateCode": "US_ME",
      }
    `);
  });

  test("for Recidiviz users", () => {
    expect(
      metadataSchema.parse({
        stateCode: "RECIDIVIZ",
        allowedStates: ["US_ME"],
        permissions: ["enhanced"],
      }),
    ).toMatchInlineSnapshot(`
      {
        "allowedStates": [
          "US_ME",
        ],
        "permissions": [
          "enhanced",
        ],
        "stateCode": "RECIDIVIZ",
      }
    `);
  });
});
