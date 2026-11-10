// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { describe, expect, it } from "vitest";

import { MessageSenderType, ThreadStatus } from "~@idaho-th/prisma/client";
import { INFO_REQUEST_MESSAGE_MAX_LENGTH } from "~@idaho-th/shared";
import {
  providerCaller,
  staffCaller,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import { seedProviderUserWithHousingProviders } from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  openProviderInfoRequest,
  PROVIDER_REQUEST_BODY,
  seedActiveHousingProvider,
  seedInfoRequestApplication,
  TEST_HOUSING_PROVIDER_NAME,
} from "./infoRequest.fixtures";

const STAFF_REPLY_BODY = "Here is the requested information";
const EDITED_BODY = "Updated request details";
const COLLEAGUE_PSEUDONYMIZED_ID = "a-colleague-at-the-same-housing-provider";

function readMessages(infoRequestId: string) {
  return testPrismaClient.threadMessage.findMany({
    where: { threadId: infoRequestId },
  });
}

function readInfoRequest(infoRequestId: string) {
  return testPrismaClient.providerApplicationThread.findUniqueOrThrow({
    where: { id: infoRequestId },
  });
}

/**
 * One person managing two organizations. They must name the one they are
 * acting as, so every call below is explicit about which thread it is in.
 */
async function seedTwoHousingProviders() {
  const { housingProviders } = await seedProviderUserWithHousingProviders(
    testPrismaClient,
    {
      housingProviders: [
        { name: TEST_HOUSING_PROVIDER_NAME },
        { name: "Second Chance Housing" },
      ],
    },
  );
  const [acting, other] = housingProviders;
  return { acting, other };
}

/**
 * An application matched to `providerId`, waiting on info, with one unread
 * question already asked. `openedBy` is the colleague who asked it.
 */
async function seedReplyableApplication(
  options: {
    staffPseudonymizedId?: string;
    providerId?: string;
    openedBy?: string;
  } = {},
) {
  const { staffPseudonymizedId, providerId, openedBy } = options;

  const provider = openProviderInfoRequest(
    providerId == null ? {} : { providerId },
  );

  const { application, providers } = await seedInfoRequestApplication(
    testPrismaClient,
    {
      ...(staffPseudonymizedId ? { staffPseudonymizedId } : {}),
      providers: [
        openedBy == null
          ? provider
          : {
              ...provider,
              infoRequests: [
                {
                  status: ThreadStatus.OPEN,
                  messages: [
                    {
                      senderType: MessageSenderType.PROVIDER,
                      senderPseudonymizedId: openedBy,
                      body: PROVIDER_REQUEST_BODY,
                    },
                  ],
                },
              ],
            },
      ],
    },
  );
  const [target] = providers;

  return {
    applicationId: application.id,
    providerApplicationId: target.providerApplication.id,
    infoRequestId: target.infoRequests[0].infoRequest.id,
  };
}

describe("infoRequestRouter", () => {
  describe("input validation", () => {
    it("rejects an empty message on postStaffInfoReply", async () => {
      const housingProvider = await seedActiveHousingProvider(testPrismaClient);
      const { applicationId, providerApplicationId } =
        await seedReplyableApplication({ providerId: housingProvider.id });

      await expect(
        staffCaller().housingApplication.postStaffInfoReply({
          applicationId,
          providerApplicationId,
          message: "",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a message over the max length on editProviderInfoRequestMessage", async () => {
      const housingProvider = await seedActiveHousingProvider(testPrismaClient);
      const { applicationId } = await seedReplyableApplication({
        providerId: housingProvider.id,
      });

      await expect(
        providerCaller().housingApplication.editProviderInfoRequestMessage({
          applicationId,
          message: "a".repeat(INFO_REQUEST_MESSAGE_MAX_LENGTH + 1),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("getProviderInfoRequest", () => {
    it("returns the open thread for the provider the caller is acting as", async () => {
      const housingProvider = await seedActiveHousingProvider(testPrismaClient);
      const { applicationId, providerApplicationId, infoRequestId } =
        await seedReplyableApplication({ providerId: housingProvider.id });

      await expect(
        providerCaller().housingApplication.getProviderInfoRequest({
          applicationId,
        }),
      ).resolves.toEqual({
        applicationId,
        providerApplicationId,
        infoRequests: [expect.objectContaining({ id: infoRequestId })],
      });
    });

    it("does not expose a thread belonging to another provider", async () => {
      await seedActiveHousingProvider(testPrismaClient);
      // No `providerId`, so the fixture seeds an organization of its own.
      const { applicationId } = await seedReplyableApplication();

      await expect(
        providerCaller().housingApplication.getProviderInfoRequest({
          applicationId,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("does not expose the other provider's thread to a person managing both", async () => {
      const { acting, other } = await seedTwoHousingProviders();
      const { applicationId } = await seedReplyableApplication({
        providerId: other.id,
      });

      await expect(
        providerCaller({
          requestedProviderId: acting.id,
        }).housingApplication.getProviderInfoRequest({ applicationId }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("editProviderInfoRequestMessage", () => {
    it("lets a colleague rewrite an unread message another colleague opened", async () => {
      const housingProvider = await seedActiveHousingProvider(testPrismaClient);
      const { applicationId, infoRequestId } = await seedReplyableApplication({
        providerId: housingProvider.id,
        openedBy: COLLEAGUE_PSEUDONYMIZED_ID,
      });

      const result =
        await providerCaller().housingApplication.editProviderInfoRequestMessage(
          { applicationId, message: EDITED_BODY },
        );

      expect(result.message).toMatchObject({
        body: EDITED_BODY,
        originalBody: PROVIDER_REQUEST_BODY,
        // Authorship stays with the colleague who opened it; scoping is the
        // organization's. Editing does not reassign the message.
        senderPseudonymizedId: COLLEAGUE_PSEUDONYMIZED_ID,
      });
      await expect(readMessages(infoRequestId)).resolves.toEqual([
        expect.objectContaining({
          body: EDITED_BODY,
          originalBody: PROVIDER_REQUEST_BODY,
        }),
      ]);
    });

    it("does not let a person managing both providers edit the other one's message", async () => {
      const { acting, other } = await seedTwoHousingProviders();
      const { applicationId, infoRequestId } = await seedReplyableApplication({
        providerId: other.id,
      });

      await expect(
        providerCaller({
          requestedProviderId: acting.id,
        }).housingApplication.editProviderInfoRequestMessage({
          applicationId,
          message: EDITED_BODY,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(readMessages(infoRequestId)).resolves.toEqual([
        expect.objectContaining({ body: PROVIDER_REQUEST_BODY }),
      ]);
    });
  });

  describe("getStaffInfoRequest", () => {
    it("returns the thread for the owning staff member", async () => {
      const { applicationId, providerApplicationId, infoRequestId } =
        await seedReplyableApplication();

      await expect(
        staffCaller().housingApplication.getStaffInfoRequest({
          applicationId,
          providerApplicationId,
        }),
      ).resolves.toEqual({
        applicationId,
        providerApplicationId,
        infoRequest: expect.objectContaining({
          id: infoRequestId,
          status: ThreadStatus.OPEN,
        }),
      });
    });

    it("does not expose an application owned by another staff member", async () => {
      const { applicationId, providerApplicationId } =
        await seedReplyableApplication({ staffPseudonymizedId: "other-staff" });

      await expect(
        staffCaller().housingApplication.getStaffInfoRequest({
          applicationId,
          providerApplicationId,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("postStaffInfoReply", () => {
    it("closes the thread and persists the staff reply", async () => {
      const { applicationId, providerApplicationId, infoRequestId } =
        await seedReplyableApplication();

      const result = await staffCaller().housingApplication.postStaffInfoReply({
        applicationId,
        providerApplicationId,
        message: STAFF_REPLY_BODY,
      });

      expect(result.message).toMatchObject({
        senderType: MessageSenderType.STAFF,
        senderPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        body: STAFF_REPLY_BODY,
      });
      await expect(readInfoRequest(infoRequestId)).resolves.toMatchObject({
        status: ThreadStatus.CLOSED,
        resolvedAt: expect.any(Date),
      });
      await expect(readMessages(infoRequestId)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            senderType: MessageSenderType.STAFF,
            body: STAFF_REPLY_BODY,
          }),
        ]),
      );
    });

    it("rejects staff who do not own the application", async () => {
      const { applicationId, providerApplicationId, infoRequestId } =
        await seedReplyableApplication({ staffPseudonymizedId: "other-staff" });

      await expect(
        staffCaller().housingApplication.postStaffInfoReply({
          applicationId,
          providerApplicationId,
          message: STAFF_REPLY_BODY,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(readInfoRequest(infoRequestId)).resolves.toMatchObject({
        status: ThreadStatus.OPEN,
      });
    });
  });

  describe("markStaffInfoMessagesRead", () => {
    it("marks the provider's unread messages as read", async () => {
      const { applicationId, providerApplicationId, infoRequestId } =
        await seedReplyableApplication();

      const result =
        await staffCaller().housingApplication.markStaffInfoMessagesRead({
          applicationId,
          providerApplicationId,
        });

      expect(result).toMatchObject({
        applicationId,
        providerApplicationId,
        infoRequestId,
        markedReadCount: 1,
        readAt: expect.any(Date),
      });
      await expect(readMessages(infoRequestId)).resolves.toEqual([
        expect.objectContaining({ readAt: expect.any(Date) }),
      ]);
    });

    it("rejects staff who do not own the application", async () => {
      const { applicationId, providerApplicationId, infoRequestId } =
        await seedReplyableApplication({ staffPseudonymizedId: "other-staff" });

      await expect(
        staffCaller().housingApplication.markStaffInfoMessagesRead({
          applicationId,
          providerApplicationId,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(readMessages(infoRequestId)).resolves.toEqual([
        expect.objectContaining({ readAt: null }),
      ]);
    });
  });
});
