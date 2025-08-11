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

import { describe, expect, test } from "vitest";

import {
  setGetPayloadImp,
  testPrismaClient,
  testServer,
  verifier,
} from "~@reentry/server/test/setup";
import { fakeClient } from "~@reentry/server/test/setup/seed";

describe("server", () => {
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

      const privateKey = process.env["INTAKE_PRIVATE_JWT_KEY"];

      if (!privateKey) {
        throw new Error("INTAKE_PRIVATE_JWT_KEY is not set");
      }

      const decoded = await verifier(token);

      expect(decoded).toBeDefined();
      expect(decoded).toEqual({
        exp: expect.any(Number),
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

  // Tests for the prehandler using the /toggle-enable-intake endpoint as an sample route
  describe("Authenticate request prehandler", () => {
    describe("auth fails", () => {
      test("should throw error if there is no token", async () => {
        setGetPayloadImp(
          vi.fn().mockReturnValue({
            email_verified: true,
            email: "test-handle-import-email@fake.com",
          }),
        );

        const response = await testServer.inject({
          method: "POST",
          url: `/toggle-enable-intake/${fakeClient.stateCode}`,
          payload: {
            clientPseudoId: fakeClient.pseudonymizedId,
            enable: true,
          },
        });

        expect(response).toMatchObject({
          statusCode: 401,
          statusMessage: "Unauthorized",
        });
      });

      test("should throw error if email is not verified", async () => {
        setGetPayloadImp(
          vi.fn().mockReturnValue({
            email_verified: false,
            email: "test-handle-import-email@fake.com",
          }),
        );

        const response = await testServer.inject({
          method: "POST",
          url: `/toggle-enable-intake/${fakeClient.stateCode}`,
          payload: {
            clientPseudoId: fakeClient.pseudonymizedId,
            enable: true,
          },
          headers: { authorization: `Bearer token` },
        });

        expect(response).toMatchObject({
          statusCode: 401,
          statusMessage: "Unauthorized",
        });
      });

      test("should throw error if there is no email", async () => {
        setGetPayloadImp(
          vi.fn().mockReturnValue({
            email_verified: true,
            email: undefined,
          }),
        );

        const response = await testServer.inject({
          method: "POST",
          url: `/toggle-enable-intake/${fakeClient.stateCode}`,
          payload: {
            clientPseudoId: fakeClient.pseudonymizedId,
            enable: true,
          },
          headers: { authorization: `Bearer token` },
        });

        expect(response).toMatchObject({
          statusCode: 401,
          statusMessage: "Unauthorized",
        });
      });

      test("should throw error if email doesn't match expected", async () => {
        setGetPayloadImp(
          vi.fn().mockReturnValue({
            email_verified: true,
            email: "not-the-right-email@gmail.com",
          }),
        );

        const response = await testServer.inject({
          method: "POST",
          url: `/toggle-enable-intake/${fakeClient.stateCode}`,
          payload: {
            clientPseudoId: fakeClient.pseudonymizedId,
            enable: true,
          },
          headers: { authorization: `Bearer token` },
        });

        expect(response).toMatchObject({
          statusCode: 401,
          statusMessage: "Unauthorized",
        });
      });
    });

    describe("auth works", () => {
      beforeAll(() => {
        setGetPayloadImp(
          vi.fn().mockReturnValue({
            email_verified: true,
            email: "test-handle-import-email@fake.com",
          }),
        );
      });

      test("should throw error if state code is invalid", async () => {
        const response = await testServer.inject({
          method: "POST",
          url: "/toggle-enable-intake/INVALID_STATE_CODE",
          payload: {
            clientPseudoId: fakeClient.pseudonymizedId,
            enable: true,
          },
          headers: { authorization: `Bearer token` },
        });

        expect(response).toMatchObject({
          statusCode: 400,
          statusMessage: "Bad Request",
        });
      });
    });
  });

  describe("/toggle-enable-intake", () => {
    beforeAll(() => {
      setGetPayloadImp(
        vi.fn().mockReturnValue({
          email_verified: true,
          email: "test-handle-import-email@fake.com",
        }),
      );
    });

    test("should throw error if client is not found", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: `/toggle-enable-intake/${fakeClient.stateCode}`,
        payload: {
          clientPseudoId: "nonexistent-client-pseudo-id",
          enable: true,
        },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
      });
    });

    test("should work if all information is valid", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: `/toggle-enable-intake/${fakeClient.stateCode}`,
        payload: {
          clientPseudoId: fakeClient.pseudonymizedId,
          enable: false,
        },
        headers: { authorization: `Bearer token` },
      });

      expect(response.statusCode).toBe(200);

      const updatedClient = await testPrismaClient.client.findUnique({
        where: {
          pseudonymizedId: fakeClient.pseudonymizedId,
        },
      });

      expect(updatedClient).toMatchObject({
        intakeEnabled: false,
      });
    });
  });

  describe("/get-intake-for-client", () => {
    beforeAll(() => {
      setGetPayloadImp(
        vi.fn().mockReturnValue({
          email_verified: true,
          email: "test-handle-import-email@fake.com",
        }),
      );
    });

    test("should throw error if intake is not found", async () => {
      const response = await testServer.inject({
        method: "GET",
        url: `/get-intake-for-client/${fakeClient.stateCode}`,
        query: {
          clientPseudoId: "nonexistent-client-pseudo-id",
        },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
      });
    });

    test("should work if intake is found", async () => {
      const response = await testServer.inject({
        method: "GET",
        url: `/get-intake-for-client/${fakeClient.stateCode}`,
        query: {
          clientPseudoId: fakeClient.pseudonymizedId,
        },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 200,
        statusMessage: "OK",
      });

      expect(JSON.parse(response.body)).toEqual({
        id: "intake-1",
        startDate: expect.any(String),
        endDate: null,
        config: expect.objectContaining({
          role: "social worker",
          sections: [
            {
              requiredInformation: "something or the other",
              title: "Personal Information",
            },
          ],
        }),
        messages: [
          expect.objectContaining({
            content: "Hello, world!",
            section: "Section 1",
            id: "message-1",
          }),
        ],
      });
    });
  });
});
