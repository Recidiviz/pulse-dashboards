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
  initTRPCClient,
  initWSClient,
  testPrismaClient,
  testServer,
  testTRPCClient,
} from "~@reentry/trpc/test/setup";
import { fakeClient } from "~@reentry/trpc/test/setup/seed";

describe("client router", () => {
  describe("getAddress", () => {
    test("should return null address when not set", async () => {
      const result = await testTRPCClient.clientRecords.getAddress.query({
        clientPseudoId: fakeClient.pseudonymizedId,
      });

      expect(result).toBeNull();
    });

    test("should return client's address when set", async () => {
      const address = "789 Pine Ave, Meridian, ID";

      await testTRPCClient.clientRecords.updateAddress.mutate({
        clientPseudoId: fakeClient.pseudonymizedId,
        address,
      });

      const result = await testTRPCClient.clientRecords.getAddress.query({
        clientPseudoId: fakeClient.pseudonymizedId,
      });

      expect(result).toBe(address);
    });

    test("should throw error when client doesn't exist", async () => {
      const badClientToken = testServer.jwt.sign(
        {
          clientPseudoId: "non-existent-client-pseudo-id",
        },
        { algorithm: "HS256", expiresIn: "5h" },
      );

      const wsClient = initWSClient(badClientToken);
      const badTRPCClient = initTRPCClient(badClientToken, wsClient);

      await expect(
        badTRPCClient.clientRecords.getAddress.query({
          clientPseudoId: "non-existent-client-pseudo-id",
        }),
      ).rejects.toThrow(
        'No client found with ID "non-existent-client-pseudo-id"',
      );
    });
  });
  describe("updateAddress", () => {
    test("should update client address", async () => {
      const address = "123 Main St, Boise, ID";

      await testTRPCClient.clientRecords.updateAddress.mutate({
        clientPseudoId: fakeClient.pseudonymizedId,
        address,
      });

      const client = await testPrismaClient.client.findUnique({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        select: { address: true },
      });

      expect(client?.address).toBe(address);
    });

    test("should throw error if client doesn't exist and update address attempt is made", async () => {
      await expect(
        testTRPCClient.clientRecords.updateAddress.mutate({
          clientPseudoId: "non-existent-client-pseudo-id",
          address: "456 Elm St, Somecity, ST",
        }),
      ).rejects.toThrow(
        'No client found with ID "non-existent-client-pseudo-id"',
      );
    });
  });
});
