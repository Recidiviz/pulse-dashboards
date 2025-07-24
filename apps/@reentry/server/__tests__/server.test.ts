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

import jwt from "jsonwebtoken";
import { describe, expect, test } from "vitest";

import { testPrismaClient, testServer } from "~@reentry/server/test/setup";
import { fakeClient } from "~@reentry/server/test/setup/seed";

describe("search", () => {
  describe("/get-intake-token", () => {
    test("should return a token when provided with a real client with an enabled intake", async () => {
      const response = await testServer.inject({
        method: "GET",
        url: "/get-intake-token",
        query: {
          stateCode: "US_ID",
          givenNames: fakeClient.givenNames,
          surname: fakeClient.surname,
          birthDay: fakeClient.birthDate.getDate().toString(),
          birthMonth: (fakeClient.birthDate.getMonth() + 1).toString(),
          birthYear: fakeClient.birthDate.getFullYear().toString(),
        },
      });

      const token = response.body;

      expect(token).toBeDefined();

      if (!process.env["AUTH0_INTAKE_PRIVATE_KEY"]) {
        throw new Error("AUTH0_INTAKE_PRIVATE_KEY is not set");
      }

      const decoded = jwt.verify(
        token,
        process.env["AUTH0_INTAKE_PRIVATE_KEY"],
      );

      expect(decoded).toBeDefined();
      expect(decoded).toEqual({
        pseudonymizedId: fakeClient.pseudonymizedId,
        iat: expect.any(Number),
      });
    });

    test("should return an error when intake is disabled for a client", async () => {
      await testPrismaClient.client.update({
        where: {
          personId: fakeClient.personId,
        },
        data: {
          intakeEnabled: false,
        },
      });

      const response = await testServer.inject({
        method: "GET",
        url: "/get-intake-token",
        query: {
          stateCode: "US_ID",
          givenNames: fakeClient.givenNames,
          surname: fakeClient.surname,
          birthDay: fakeClient.birthDate.getDate().toString(),
          birthMonth: (fakeClient.birthDate.getMonth() + 1).toString(),
          birthYear: fakeClient.birthDate.getFullYear().toString(),
        },
      });

      expect(response.statusCode).toBe(403);
    });

    test("should return an error when provided with a nonexistent client", async () => {
      const response = await testServer.inject({
        method: "GET",
        url: "/get-intake-token",
        query: {
          stateCode: "US_ID",
          givenNames: fakeClient.givenNames,
          surname: fakeClient.surname,
          birthDay: fakeClient.birthDate.getDate().toString(),
          birthMonth: (fakeClient.birthDate.getMonth() + 1).toString(),
          // Give the wrong year
          birthYear: (fakeClient.birthDate.getFullYear() + 1).toString(),
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
