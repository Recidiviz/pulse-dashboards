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

import { BaseMessage } from "@langchain/core/messages";

import { parseAddress } from "~@reentry/trpc/routes/intake-chat/utils";
import {
  initTRPCClient,
  initWSClient,
  sharedMemorySaver,
  testPrismaClient,
  testServer,
  testTRPCClient,
} from "~@reentry/trpc/test/setup";
import { fakeClient, intakeId } from "~@reentry/trpc/test/setup/seed";

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

      await testTRPCClient.clientRecords.updateAddressStartAssessment.mutate({
        clientPseudoId: fakeClient.pseudonymizedId,
        address,
        intakeId: "test-intake-id",
      });

      const result = await testTRPCClient.clientRecords.getAddress.query({
        clientPseudoId: fakeClient.pseudonymizedId,
      });

      expect(result).toBe(address);
    });

    test("should throw error when client doesn't exist", async () => {
      const badClientToken = testServer.jwt.regular.sign(
        {
          clientPseudoId: "non-existent-client-pseudo-id",
          sub: "non-existent-client-pseudo-id",
          token_type: "client",
          login_timestamp: Date.now() / 1000,
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
  describe("updateAddressStartAssessment", () => {
    test("should update client address", async () => {
      const address = "123 Main St, Boise, ID";

      await testTRPCClient.clientRecords.updateAddressStartAssessment.mutate({
        clientPseudoId: fakeClient.pseudonymizedId,
        address,
        intakeId: "test-intake-id",
      });

      const client = await testPrismaClient.client.findUnique({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        select: { address: true },
      });

      expect(client?.address).toBe(address);
    });

    test("should throw error if client doesn't exist and update address attempt is made", async () => {
      await expect(
        testTRPCClient.clientRecords.updateAddressStartAssessment.mutate({
          clientPseudoId: "non-existent-client-pseudo-id",
          address: "456 Elm St, Somecity, ST",
          intakeId: "test-intake-id",
        }),
      ).rejects.toThrow(
        'No client found with ID "non-existent-client-pseudo-id"',
      );
    });

    test("should trigger assessment generation when chat history exists", async () => {
      const chatHistoryMock = [
        { role: "caseworker", content: "Welcome message" },
        { role: "client", content: "Some reply" },
      ] as unknown as BaseMessage[];

      await sharedMemorySaver.put(
        { configurable: { thread_id: intakeId } },
        // @ts-expect-error only partial checkpoint needed for testing
        {
          channel_values: {
            messages: chatHistoryMock,
          },
          ts: new Date().toISOString(),
        },
        {},
      );

      const result =
        await testTRPCClient.clientRecords.updateAddressStartAssessment.mutate({
          clientPseudoId: fakeClient.pseudonymizedId,
          address: "123 Main St, Boise, ID",
          intakeId,
        });

      expect(result).toEqual({
        intakeId,
        assessmentResponse: {
          assessmentId: "assessment-123",
          actionPlanId: "action-plan-456",
        },
        address: parseAddress("123 Main St, Boise, ID"),
      });
    });

    test("should not update database if address parsing fails", async () => {
      const invalidAddress = "InvalidAddress"; // Missing comma-separated parts
      const originalClient = await testPrismaClient.client.findUnique({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        select: { address: true },
      });

      expect(originalClient?.address).toBeNull();

      await expect(
        testTRPCClient.clientRecords.updateAddressStartAssessment.mutate({
          clientPseudoId: fakeClient.pseudonymizedId,
          address: invalidAddress,
          intakeId: "test-intake-id",
        }),
      ).rejects.toThrow(
        "Invalid address format. Expected at least 2 parts (city, state), got 1.",
      );

      // Verify database was not updated
      const clientAfter = await testPrismaClient.client.findUnique({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        select: { address: true },
      });

      expect(clientAfter?.address).toBe(originalClient?.address);
    });

    test("should update database if address parsing passes", async () => {
      const validAddress = "C/O John Smith, 123 Main St, Apt. 2, Boise, ID";
      const originalClient = await testPrismaClient.client.findUnique({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        select: { address: true },
      });

      expect(originalClient?.address).toBeNull();

      await expect(
        testTRPCClient.clientRecords.updateAddressStartAssessment.mutate({
          clientPseudoId: fakeClient.pseudonymizedId,
          address: validAddress,
          intakeId: "test-intake-id",
        }),
      ).resolves.not.toThrow();

      // Verify database was successfully updated
      const clientAfter = await testPrismaClient.client.findUnique({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        select: { address: true },
      });

      expect(clientAfter?.address).toBe(validAddress);
    });
  });
});
