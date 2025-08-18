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

import { faker } from "@faker-js/faker";
import { BaseMessage } from "@langchain/core/messages";
import { describe, test } from "vitest";

import { getIntakeConfigForState } from "~@reentry/intake-agent";
import { StateCode } from "~@reentry/prisma/client";
import {
  initTRPCClient,
  initWSClient,
  sharedMemorySaver,
  testPrismaClient,
  testServer,
  testTRPCClient,
} from "~@reentry/trpc/test/setup";
import {
  fakeClient,
  fakeIntake,
  fakeStaff,
  intakeId,
} from "~@reentry/trpc/test/setup/seed";

let subscription: ReturnType<typeof testTRPCClient.intake.chat.subscribe>;
const onData = vi.fn();

const getSavedMessages = async (threadId: string): Promise<BaseMessage[]> => {
  const result = await sharedMemorySaver.get({
    configurable: { thread_id: threadId },
  });
  return (result?.channel_values["messages"] || []) as BaseMessage[];
};

const waitForSavedMessages = async (
  threadId: string,
  count: number,
  timeout = 30_000,
): Promise<BaseMessage[]> => {
  await vi.waitUntil(
    async () => {
      const messages = await getSavedMessages(threadId);
      return messages.length === count;
    },
    { timeout },
  );
  return getSavedMessages(threadId);
};

const subscribeToIntakeChat = async (lastEventId?: string) => {
  subscription = testTRPCClient.intake.chat.subscribe(
    { intakeId, ...(lastEventId ? { lastEventId } : {}) },
    {
      onData(data) {
        console.log("New data from server:", data);
        onData(data);
      },
      onError(err) {
        console.error("Subscription error:", err);
      },
      onComplete() {
        console.log("Subscription completed or closed.");
      },
    },
  );
};

describe("intake chat router", () => {
  describe("create", () => {
    test("create for client with existing intake should return existing intake ID", async () => {
      const response = await testTRPCClient.intake.createOrGet.query({
        clientPseudoId: fakeClient.pseudonymizedId,
      });

      expect(response).toEqual({
        id: fakeIntake.id,
        config: fakeIntake.config,
      });
    });

    test("create for client should throw error if client doesn't exist", async () => {
      await expect(
        testTRPCClient.intake.createOrGet.query({
          clientPseudoId: "client-psuedo-id-2",
        }),
      ).rejects.toThrowError("Client with that id was not found");
    });

    test("create for client without existing intake should create new intake", async () => {
      await testPrismaClient.client.create({
        data: {
          stateCode: StateCode.US_ID,
          personId: 2,
          stablePersonExternalId: "client-ext-2",
          stablePersonExternalIdType: "client-ext-type-1",
          displayPersonExternalId: "client-display-ext-2",
          pseudonymizedId: "client-psuedo-id-2",
          givenNames: faker.person.firstName(),
          middleNames: faker.person.firstName(),
          surname: faker.person.lastName(),
          suffix: faker.person.suffix(),
          birthDate: faker.date.birthdate(),
          staff: {
            create: {
              staffId: fakeStaff.staffId,
            },
          },
        },
      });

      const response = await testTRPCClient.intake.createOrGet.query({
        clientPseudoId: "client-psuedo-id-2",
      });

      expect(response).toEqual({
        id: expect.any(String),
        config: getIntakeConfigForState(StateCode.US_ID),
      });
    });
  });

  describe("chat + reply", () => {
    beforeEach(() => {
      onData.mockClear();
    });

    afterEach(() => {
      subscription?.unsubscribe();
    });

    test("welcome message is sent on initial intake", async () => {
      // Subscribe to the intake chat and wait for the welcome message + first question to have been sent
      await subscribeToIntakeChat();
      await vi.waitUntil(() => onData.mock.calls.length >= 2);
      await waitForSavedMessages(intakeId, 2);

      // Should have received a loading message + the welcome message and first question
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            messages: [
              expect.objectContaining({
                content: "Welcome message",
                section: "Personal Information",
                id: expect.any(String),
              }),
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
    });

    test("client messages are processed with appropriate responses from server", async () => {
      // Subscribe to the intake chat and wait for the welcome message + first question to have been sent
      await subscribeToIntakeChat();
      await waitForSavedMessages(intakeId, 2);

      // Send a reply and wait for the response
      await testTRPCClient.intake.reply.mutate({
        intakeId,
        response: "Hello, I am ready to start.",
      });
      await waitForSavedMessages(intakeId, 4);

      // Should have received:
      // 1. A loading message
      // 2. The welcome message and first question
      // 3. A loading message (after the first reply
      // 4. The next question
      expect(onData).toHaveBeenCalledTimes(4);
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            messages: [
              expect.objectContaining({
                content: "Welcome message",
                section: "Personal Information",
                id: expect.any(String),
              }),
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            messages: [
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );

      await testTRPCClient.intake.reply.mutate({
        intakeId,
        response: "My release date is November 25 of this year.",
      });

      await waitForSavedMessages(intakeId, 6);
      // Should have now received:
      // 1. A loading message
      // 2. The next question
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            messages: [
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
    });

    test("client sending a message, disconnecting, and reconnecting should still process the last message before disconnection and continue the conversation", async () => {
      // Simulate:
      // 1. Connecting to the chat
      // 2. Waiting for the welcome message and first question
      // 3. Sending a message
      // 4. Disconnecting
      // 5. The server processing the last response
      // 6. Reconnecting with the last event id
      await subscribeToIntakeChat();
      await waitForSavedMessages(intakeId, 2);
      await testTRPCClient.intake.reply.mutate({
        intakeId,
        response: "My release date is November 25 of this year.",
      });
      subscription.unsubscribe();
      await waitForSavedMessages(intakeId, 4);

      const messages = await getSavedMessages(intakeId);
      const lastEventId = messages[1].id;
      // Simulate a reconnection
      await subscribeToIntakeChat(lastEventId);

      // Should have received:
      // 1. A loading message
      // 2. The welcome message and first question
      // 3. A loading message after the reconnection
      // 4. The cached reply from the bot
      expect(onData).toHaveBeenCalledTimes(4);
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            messages: [
              expect.objectContaining({
                content: "Welcome message",
                section: "Personal Information",
                id: expect.any(String),
              }),
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            messages: [
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
    });

    test("client sending a message should throw error after client disconnects", async () => {
      await subscribeToIntakeChat();
      await waitForSavedMessages(intakeId, 2);

      // Simulate a disconnection
      subscription.unsubscribe();

      await expect(
        testTRPCClient.intake.reply.mutate({
          intakeId,
          response: "I need housing.",
        }),
      ).rejects.toThrow();
    });

    test("client connecting a second time should result in a new welcome message", async () => {
      // Simulate a client connecting to the chat and getting the welcome message
      await subscribeToIntakeChat();
      await waitForSavedMessages(intakeId, 2);

      // Simulate leaving the chat and returning a different time by not passing a lastEventId, then waiting for the new welcome message + next question
      subscription.unsubscribe();
      await subscribeToIntakeChat();
      await waitForSavedMessages(intakeId, 4);

      // Should have received:
      // 1. A loading message
      // 2. The welcome message and first question
      // 3. A loading message after the return
      // 4. The returning welcome message and another question
      expect(onData).toHaveBeenCalledTimes(4);
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            messages: [
              expect.objectContaining({
                content: "Welcome message",
                section: "Personal Information",
                id: expect.any(String),
              }),
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            messages: [
              expect.objectContaining({
                content: "Welcome message",
                section: "Personal Information",
                id: expect.any(String),
              }),
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
    });

    test("intake chat route should throw an error if the client tries to connect to a bad intake id", async () => {
      await expect(
        new Promise<void>((resolve, reject) => {
          testTRPCClient.intake.chat.subscribe(
            { intakeId: "non-existent-intake-id" },
            {
              onData() {
                resolve();
              },
              onError(err) {
                reject(err);
              },
              onComplete() {
                resolve();
              },
            },
          );
        }),
      ).rejects.toThrow(
        `No intake found with ID "non-existent-intake-id" for client "client-pid-1"`,
      );
    });

    test("intake chat route should throw an error if the client tries to connect to a bad pseudo id", async () => {
      const badClientToken = testServer.jwt.sign(
        {
          clientPseudoId: "non-existent-client-pseudo-id",
        },
        { algorithm: "HS256", expiresIn: "5h" },
      );

      const wsClient = initWSClient(badClientToken);
      const testTRPCClient = initTRPCClient(badClientToken, wsClient);

      await expect(
        new Promise<void>((resolve, reject) => {
          testTRPCClient.intake.chat.subscribe(
            { intakeId },
            {
              onData() {
                resolve();
              },
              onError(err) {
                reject(err);
              },
              onComplete() {
                resolve();
              },
            },
          );
        }),
      ).rejects.toThrow(
        `No intake found with ID "intake-1" for client "non-existent-client-pseudo-id"`,
      );
    });

    test("Should handle chat completion", async () => {
      // Make it so that the section will be marked complete after the getting a response
      vi.stubEnv("MOCK_SECTION_COMPLETE", "true");

      // Subscribe to the intake chat and wait for the welcome message + first question to have been sent
      await subscribeToIntakeChat();
      await waitForSavedMessages(intakeId, 2);

      // Send a reply and wait for the response
      await testTRPCClient.intake.reply.mutate({
        intakeId,
        response: "Hello, I am ready to start.",
      });
      await waitForSavedMessages(intakeId, 4);

      // Should have received:
      // 1. A loading message
      // 2. The welcome message and first question
      // 3. A loading message (after the first reply
      // 4. Completion message from the chat
      expect(onData).toHaveBeenCalledTimes(4);
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            status: "active",
            messages: [
              expect.objectContaining({
                content: "Welcome message",
                section: "Personal Information",
                id: expect.any(String),
              }),
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            status: "complete",
            messages: [
              expect.objectContaining({
                content: `Thank you for your time today, ${fakeClient.givenNames} ${fakeClient.surname}. I appreciate you sharing all of this information with me. We have reached the end of our conversation!`,
                section: "Closing Remarks",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );

      // Unsubscribe and re-subscribe to simulate leaving and returning to the chat
      subscription.unsubscribe();
      await subscribeToIntakeChat();
      // Should have received:
      // 1. A loading message
      // 2. Completion message from the chat
      await waitForSavedMessages(intakeId, 5);
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            status: "complete",
            messages: [
              expect.objectContaining({
                content: `Thank you for your time today, ${fakeClient.givenNames} ${fakeClient.surname}. I appreciate you sharing all of this information with me. We have reached the end of our conversation!`,
                section: "Closing Remarks",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
    });

    test("Should handle user ending chat", async () => {
      // Make it so that the section will be marked complete after the getting a response
      vi.stubEnv("MOCK_NEEDS_HELP", "true");

      // Subscribe to the intake chat and wait for the welcome message + first question to have been sent
      await subscribeToIntakeChat();
      await waitForSavedMessages(intakeId, 2);

      // Send a reply and wait for the response
      await testTRPCClient.intake.reply.mutate({
        intakeId,
        response: "Hello, I am ready to start.",
      });
      await waitForSavedMessages(intakeId, 4);

      // Should have received:
      // 1. A loading message
      // 2. The welcome message and first question
      // 3. A loading message (after the first reply
      // 4. User ending message in the chat
      expect(onData).toHaveBeenCalledTimes(4);
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            status: "active",
            messages: [
              expect.objectContaining({
                content: "Welcome message",
                section: "Personal Information",
                id: expect.any(String),
              }),
              expect.objectContaining({
                content: "question",
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
      expect(onData).toHaveBeenCalledWith({ type: "loading" });
      expect(onData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          data: expect.objectContaining({
            type: "response",
            status: "user_ended",
            messages: [
              expect.objectContaining({
                content: `I see! Ending the conversation now.`,
                section: "Personal Information",
                id: expect.any(String),
              }),
            ],
          }),
        }),
      );
    });

    // TODO: Add tests for multiple clients trying to connect to the same intake chat
  });
});
