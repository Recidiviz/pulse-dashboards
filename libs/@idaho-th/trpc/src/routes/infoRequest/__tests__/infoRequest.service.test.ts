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

import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import {
  ApplicationStatus,
  ApplicationSubStage,
  MessageSenderType,
  ThreadStatus,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  INFO_REQUEST_BAD_REQUEST,
  INFO_REQUEST_NOT_FOUND,
} from "~@idaho-th/trpc/routes/infoRequest/infoRequest.helpers";
import {
  editProviderInfoRequestMessage,
  getProviderInfoRequest,
  getStaffInfoRequest,
  postStaffInfoReply,
} from "~@idaho-th/trpc/routes/infoRequest/infoRequest.service";
import {
  createHousingProvider,
  TEST_DATES,
  TEST_STAFF_PSEUDONYMIZED_ID,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";
import { createOperationRecordingClient } from "~@idaho-th/trpc/test/operations";
import {
  readHousingApplication,
  readProviderApplication,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  type InfoRequestProviderSeed,
  openProviderInfoRequest,
  PROVIDER_REQUEST_BODY,
  seedInfoRequestApplication,
  TEST_HOUSING_PROVIDER_NAME,
} from "./infoRequest.fixtures";

const STAFF_REPLY_BODY = "Here is the requested information";

function readInfoRequest(infoRequestId: string) {
  return testPrismaClient.providerApplicationThread.findUniqueOrThrow({
    where: { id: infoRequestId },
  });
}

function readMessages(infoRequestId: string, senderType?: MessageSenderType) {
  return testPrismaClient.threadMessage.findMany({
    where: { threadId: infoRequestId, ...(senderType ? { senderType } : {}) },
  });
}

/**
 * The organization the provider acts as. These tests call the services
 * directly, so they need the organization but not the assignment the provider
 * middleware checks — the router tests cover that path.
 */
function seedHousingProvider(name = TEST_HOUSING_PROVIDER_NAME) {
  return createHousingProvider(testPrismaClient, { name });
}

/**
 * An application waiting on info from one organization, plus any extra ones.
 * `providerId` is the organization the thread belongs to; left out, the fixture
 * seeds one of its own.
 */
async function seedReplyableApplication(
  extraProviders: InfoRequestProviderSeed[] = [],
  options: {
    staffPseudonymizedId?: string;
    sentToProvidersAt?: Date | null;
    providerId?: string;
  } = {},
) {
  const { providerId, ...applicationOptions } = options;

  const { application, providers } = await seedInfoRequestApplication(
    testPrismaClient,
    {
      ...applicationOptions,
      providers: [
        openProviderInfoRequest(providerId == null ? {} : { providerId }),
        ...extraProviders,
      ],
    },
  );
  const [target, ...others] = providers;

  return {
    applicationId: application.id,
    providerApplicationId: target.providerApplication.id,
    provider: target.provider,
    infoRequestId: target.infoRequests[0].infoRequest.id,
    otherProviders: others,
  };
}

describe("postStaffInfoReply", () => {
  it("locks the row, writes one nested update, and guards the timeline event once", async () => {
    const { applicationId, providerApplicationId } =
      await seedReplyableApplication([
        { subStage: ApplicationSubStage.PROVIDER_REVIEW, name: "Beta Housing" },
      ]);
    const { client, operations } =
      createOperationRecordingClient(testPrismaClient);

    await postStaffInfoReply(
      client,
      TEST_STAFF_PSEUDONYMIZED_ID,
      applicationId,
      providerApplicationId,
      STAFF_REPLY_BODY,
    );

    // Guards the joined read and the single nested write: a per-provider or
    // per-message follow-up query would show up as an extra entry here. The
    // second read is recordTimelineEvent's staff-case-closed guard.
    expect(operations).toEqual([
      "$queryRaw",
      "HousingApplication.findFirst",
      "HousingApplication.update",
      "StaffHousingApplication.findFirst",
      "HousingApplicationTimelineEvent.create",
    ]);
  });

  it("closes the thread, appends the staff message, and advances both records", async () => {
    const { applicationId, providerApplicationId, infoRequestId } =
      await seedReplyableApplication([
        { subStage: ApplicationSubStage.PROVIDER_REVIEW, name: "Beta Housing" },
      ]);

    const result = await postStaffInfoReply(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      applicationId,
      providerApplicationId,
      STAFF_REPLY_BODY,
    );

    expect(result).toMatchObject({
      applicationId,
      providerApplicationId,
      infoRequestId,
      staffSubStage: ApplicationSubStage.PROVIDER_REVIEW,
      staffStatus: ApplicationStatus.WAITING,
      message: expect.objectContaining({
        senderType: MessageSenderType.STAFF,
        senderPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        body: STAFF_REPLY_BODY,
      }),
    });

    await expect(readInfoRequest(infoRequestId)).resolves.toMatchObject({
      status: ThreadStatus.CLOSED,
      resolvedAt: expect.any(Date),
    });
    await expect(
      readMessages(infoRequestId, MessageSenderType.STAFF),
    ).resolves.toEqual([
      expect.objectContaining({
        id: result.message.id,
        body: STAFF_REPLY_BODY,
        senderPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      }),
    ]);

    await expect(
      readStaffApplication(testPrismaClient, applicationId),
    ).resolves.toMatchObject({
      subStage: ApplicationSubStage.PROVIDER_REVIEW,
      status: ApplicationStatus.WAITING,
    });
    await expect(
      readProviderApplication(testPrismaClient, providerApplicationId),
    ).resolves.toMatchObject({
      subStage: ApplicationSubStage.PROVIDER_REVIEW,
      status: ApplicationStatus.ACTION_NEEDED,
    });

    const application = await readHousingApplication(
      testPrismaClient,
      applicationId,
    );
    expect(application.lastActivityAt.getTime()).toBeGreaterThan(
      TEST_DATES.LAST_ACTIVITY.getTime(),
    );
  });

  it("records a CM_RESPONDED_TO_INFO_REQUEST event scoped to the requesting provider", async () => {
    const housingProvider = await seedHousingProvider();
    const { applicationId, providerApplicationId, provider, infoRequestId } =
      await seedReplyableApplication([], { providerId: housingProvider.id });

    const result = await postStaffInfoReply(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      applicationId,
      providerApplicationId,
      STAFF_REPLY_BODY,
    );

    await expect(
      readTimelineEvents(testPrismaClient, applicationId),
    ).resolves.toEqual([
      expect.objectContaining({
        eventType: TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST,
        description: `Responded to information request from ${TEST_HOUSING_PROVIDER_NAME}`,
        actorRole: TimelineActorRole.STAFF,
        actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        scopedProviderId: provider.id,
        cmOnly: false,
        metadata: {
          infoRequestId,
          infoRequestMessageId: result.message.id,
        },
      }),
    ]);
  });

  it("keeps staff sub-stage at INFO_NEEDED when another provider still needs info", async () => {
    const { applicationId, providerApplicationId, infoRequestId } =
      await seedReplyableApplication([
        openProviderInfoRequest({ name: "Beta Housing" }),
      ]);

    const result = await postStaffInfoReply(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      applicationId,
      providerApplicationId,
      STAFF_REPLY_BODY,
    );

    expect(result.staffSubStage).toBe(ApplicationSubStage.INFO_NEEDED);
    await expect(
      readStaffApplication(testPrismaClient, applicationId),
    ).resolves.toMatchObject({
      subStage: ApplicationSubStage.INFO_NEEDED,
    });
    // The replied-to thread still closes, even though the case stays open.
    await expect(readInfoRequest(infoRequestId)).resolves.toMatchObject({
      status: ThreadStatus.CLOSED,
      resolvedAt: expect.any(Date),
    });
  });

  it("rejects duplicate replies once the provider application has moved on", async () => {
    const { applicationId, providerApplicationId, infoRequestId } =
      await seedReplyableApplication();

    await postStaffInfoReply(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      applicationId,
      providerApplicationId,
      STAFF_REPLY_BODY,
    );

    await expect(
      postStaffInfoReply(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        applicationId,
        providerApplicationId,
        "Replying twice",
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: INFO_REQUEST_BAD_REQUEST.NOT_INFO_NEEDED,
      } satisfies Partial<TRPCError>),
    );

    await expect(
      readMessages(infoRequestId, MessageSenderType.STAFF),
    ).resolves.toHaveLength(1);
  });

  it("rejects staff who do not own the application", async () => {
    const { applicationId, providerApplicationId, infoRequestId } =
      await seedReplyableApplication([], {
        staffPseudonymizedId: "other-staff",
      });

    await expect(
      postStaffInfoReply(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        applicationId,
        providerApplicationId,
        STAFF_REPLY_BODY,
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );

    await expect(readInfoRequest(infoRequestId)).resolves.toMatchObject({
      status: ThreadStatus.OPEN,
    });
  });

  it("rejects applications that have not been sent to providers", async () => {
    const { applicationId, providerApplicationId } =
      await seedReplyableApplication([], { sentToProvidersAt: null });

    await expect(
      postStaffInfoReply(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        applicationId,
        providerApplicationId,
        STAFF_REPLY_BODY,
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: INFO_REQUEST_BAD_REQUEST.NOT_SENT_TO_PROVIDERS,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("getStaffInfoRequest", () => {
  it("uses a single joined read", async () => {
    const { applicationId, providerApplicationId, infoRequestId } =
      await seedReplyableApplication();
    const { client, operations } =
      createOperationRecordingClient(testPrismaClient);

    const result = await getStaffInfoRequest(
      client,
      TEST_STAFF_PSEUDONYMIZED_ID,
      applicationId,
      providerApplicationId,
    );

    expect(operations).toEqual(["HousingApplication.findFirst"]);
    expect(result).toEqual({
      applicationId,
      providerApplicationId,
      infoRequest: expect.objectContaining({
        id: infoRequestId,
        status: ThreadStatus.OPEN,
        messages: [
          expect.objectContaining({
            senderType: MessageSenderType.PROVIDER,
            body: PROVIDER_REQUEST_BODY,
          }),
        ],
      }),
    });
  });
});

describe("editProviderInfoRequestMessage", () => {
  const UPDATED_BODY = "Updated request details";

  it("locks the row, reads it once, and writes one nested update", async () => {
    const housingProvider = await seedHousingProvider();
    const { applicationId } = await seedReplyableApplication([], {
      providerId: housingProvider.id,
    });
    const { client, operations } =
      createOperationRecordingClient(testPrismaClient);

    await editProviderInfoRequestMessage(
      client,
      housingProvider.id,
      applicationId,
      UPDATED_BODY,
    );

    expect(operations).toEqual([
      "$queryRaw",
      "HousingApplication.findFirst",
      "HousingApplication.update",
    ]);
  });

  it("rewrites the body and keeps the original for the audit trail", async () => {
    const housingProvider = await seedHousingProvider();
    const { applicationId, infoRequestId } = await seedReplyableApplication(
      [],
      {
        providerId: housingProvider.id,
      },
    );

    const result = await editProviderInfoRequestMessage(
      testPrismaClient,
      housingProvider.id,
      applicationId,
      UPDATED_BODY,
    );

    expect(result).toMatchObject({
      applicationId,
      infoRequestId,
      message: expect.objectContaining({
        body: UPDATED_BODY,
        originalBody: PROVIDER_REQUEST_BODY,
        editedAt: expect.any(Date),
      }),
    });

    await expect(readMessages(infoRequestId)).resolves.toEqual([
      expect.objectContaining({
        id: result.message.id,
        body: UPDATED_BODY,
        originalBody: PROVIDER_REQUEST_BODY,
      }),
    ]);
  });

  it("keeps the first original body across repeated edits", async () => {
    const housingProvider = await seedHousingProvider();
    const { applicationId, infoRequestId } = await seedReplyableApplication(
      [],
      {
        providerId: housingProvider.id,
      },
    );

    await editProviderInfoRequestMessage(
      testPrismaClient,
      housingProvider.id,
      applicationId,
      UPDATED_BODY,
    );
    await editProviderInfoRequestMessage(
      testPrismaClient,
      housingProvider.id,
      applicationId,
      "Edited once more",
    );

    await expect(readMessages(infoRequestId)).resolves.toEqual([
      expect.objectContaining({
        body: "Edited once more",
        originalBody: PROVIDER_REQUEST_BODY,
      }),
    ]);
  });

  it("rejects edits when the provider message has been read by staff", async () => {
    const housingProvider = await seedHousingProvider();
    const { application, providers } = await seedInfoRequestApplication(
      testPrismaClient,
      {
        providers: [
          {
            providerId: housingProvider.id,
            infoRequests: [
              {
                messages: [
                  {
                    senderType: MessageSenderType.PROVIDER,
                    readAt: new Date("2026-06-10T11:00:00.000Z"),
                  },
                ],
              },
            ],
          },
        ],
      },
    );
    const infoRequestId = providers[0].infoRequests[0].infoRequest.id;

    await expect(
      editProviderInfoRequestMessage(
        testPrismaClient,
        housingProvider.id,
        application.id,
        UPDATED_BODY,
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: INFO_REQUEST_BAD_REQUEST.MESSAGE_NOT_EDITABLE,
      } satisfies Partial<TRPCError>),
    );

    await expect(readMessages(infoRequestId)).resolves.toEqual([
      expect.objectContaining({ body: "Need more info", originalBody: null }),
    ]);
  });
});

describe("getProviderInfoRequest", () => {
  it("uses a single joined read", async () => {
    const housingProvider = await seedHousingProvider();
    const { applicationId, providerApplicationId, infoRequestId } =
      await seedReplyableApplication([], { providerId: housingProvider.id });
    const { client, operations } =
      createOperationRecordingClient(testPrismaClient);

    const result = await getProviderInfoRequest(
      client,
      housingProvider.id,
      applicationId,
    );

    expect(operations).toEqual(["HousingApplication.findFirst"]);
    expect(result).toEqual({
      applicationId,
      providerApplicationId,
      infoRequests: [expect.objectContaining({ id: infoRequestId })],
    });
  });

  it("returns an empty list when the provider is matched but has no thread", async () => {
    const housingProvider = await seedHousingProvider();
    const { application, providers } = await seedInfoRequestApplication(
      testPrismaClient,
      {
        providers: [
          {
            providerId: housingProvider.id,
            subStage: ApplicationSubStage.PROVIDER_REVIEW,
            infoRequests: [],
          },
        ],
      },
    );

    await expect(
      getProviderInfoRequest(
        testPrismaClient,
        housingProvider.id,
        application.id,
      ),
    ).resolves.toEqual({
      applicationId: application.id,
      providerApplicationId: providers[0].providerApplication.id,
      infoRequests: [],
    });
  });

  it("does not expose a thread belonging to another provider", async () => {
    const housingProvider = await seedHousingProvider();
    const otherHousingProvider = await seedHousingProvider(
      "Second Chance Housing",
    );
    const { applicationId } = await seedReplyableApplication([], {
      providerId: otherHousingProvider.id,
    });

    await expect(
      getProviderInfoRequest(
        testPrismaClient,
        housingProvider.id,
        applicationId,
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws NOT_FOUND when the application does not exist", async () => {
    await expect(
      getProviderInfoRequest(
        testPrismaClient,
        (await seedHousingProvider()).id,
        uniqueId("missing-application"),
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      } satisfies Partial<TRPCError>),
    );
  });
});
