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
  ApplicationStage,
  ApplicationSubStage,
  MessageSenderType,
  ThreadStatus,
} from "~@idaho-th/prisma/client";
import { STAFF_CASE_CLOSED_MESSAGE } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import {
  findProviderInfoEdit,
  findProviderInfoRequest,
  findStaffInfoReply,
  findStaffInfoRequest,
  INFO_REQUEST_BAD_REQUEST,
  INFO_REQUEST_NOT_FOUND,
  requireProviderInfoEdit,
  requireStaffInfoReply,
  resolveProviderInfoRequest,
  resolveStaffInfoRequest,
} from "~@idaho-th/trpc/routes/infoRequest/infoRequest.helpers";
import {
  createHousingProvider,
  TEST_STAFF_PSEUDONYMIZED_ID,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  type InfoRequestProviderSeed,
  openProviderInfoRequest,
  PROVIDER_REQUEST_BODY,
  seedInfoRequestApplication,
  TEST_HOUSING_PROVIDER_NAME,
} from "./infoRequest.fixtures";

/**
 * The organization the provider acts as. These tests call the finders
 * directly, so they need the organization but not the assignment the provider
 * middleware checks — the router tests cover that path.
 */
function seedHousingProvider(name = TEST_HOUSING_PROVIDER_NAME) {
  return createHousingProvider(testPrismaClient, { name });
}

/**
 * An application matched to one organization. `provider` defaults to that
 * organization with one open, unread question.
 */
async function seedSingleProviderApplication(
  options: {
    staffPseudonymizedId?: string;
    stage?: ApplicationStage;
    sentToProvidersAt?: Date | null;
  } = {},
  provider: Omit<
    InfoRequestProviderSeed,
    "providerId"
  > = openProviderInfoRequest(),
) {
  const housingProvider = await seedHousingProvider();

  const { application, providers } = await seedInfoRequestApplication(
    testPrismaClient,
    {
      ...options,
      providers: [{ ...provider, providerId: housingProvider.id }],
    },
  );
  const [seeded] = providers;

  return {
    applicationId: application.id,
    providerApplicationId: seeded.providerApplication.id,
    provider: seeded.provider,
    providerId: housingProvider.id,
    infoRequests: seeded.infoRequests,
  };
}

describe("requireStaffInfoReply", () => {
  function loadReply(applicationId: string, providerApplicationId: string) {
    return findStaffInfoReply(
      testPrismaClient,
      applicationId,
      providerApplicationId,
    );
  }

  it("returns resolved context when the application is valid", async () => {
    const { applicationId, providerApplicationId, provider, infoRequests } =
      await seedSingleProviderApplication();

    const context = await loadReply(applicationId, providerApplicationId);

    expect(
      requireStaffInfoReply(
        context,
        TEST_STAFF_PSEUDONYMIZED_ID,
        providerApplicationId,
      ),
    ).toEqual({
      applicationId,
      providerApplicationId,
      infoRequestId: infoRequests[0].infoRequest.id,
      providerId: provider.id,
      providerName: TEST_HOUSING_PROVIDER_NAME,
      providerApplications: [
        {
          id: providerApplicationId,
          subStage: ApplicationSubStage.INFO_NEEDED,
        },
      ],
    });
  });

  it("rejects a reply when the staff case is closed", async () => {
    const { applicationId, providerApplicationId } =
      await seedSingleProviderApplication({ stage: ApplicationStage.CLOSED });

    const context = await loadReply(applicationId, providerApplicationId);

    expect(() =>
      requireStaffInfoReply(
        context,
        TEST_STAFF_PSEUDONYMIZED_ID,
        providerApplicationId,
      ),
    ).toThrow(STAFF_CASE_CLOSED_MESSAGE);
  });

  it("throws NOT_FOUND when the application does not exist", async () => {
    const context = await loadReply(
      uniqueId("missing-application"),
      uniqueId("missing-provider-application"),
    );

    expect(context).toBeNull();
    expect(() =>
      requireStaffInfoReply(
        context,
        TEST_STAFF_PSEUDONYMIZED_ID,
        uniqueId("missing-provider-application"),
      ),
    ).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws NOT_FOUND when staff does not own the application", async () => {
    const { applicationId, providerApplicationId } =
      await seedSingleProviderApplication({
        staffPseudonymizedId: "other-staff",
      });

    const context = await loadReply(applicationId, providerApplicationId);

    expect(() =>
      requireStaffInfoReply(
        context,
        TEST_STAFF_PSEUDONYMIZED_ID,
        providerApplicationId,
      ),
    ).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws BAD_REQUEST when the application has not been sent to providers", async () => {
    const { applicationId, providerApplicationId } =
      await seedSingleProviderApplication({ sentToProvidersAt: null });

    const context = await loadReply(applicationId, providerApplicationId);

    expect(() =>
      requireStaffInfoReply(
        context,
        TEST_STAFF_PSEUDONYMIZED_ID,
        providerApplicationId,
      ),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: INFO_REQUEST_BAD_REQUEST.NOT_SENT_TO_PROVIDERS,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws NOT_FOUND when the provider application is missing", async () => {
    const { applicationId, providerApplicationId } =
      await seedSingleProviderApplication();

    const context = await loadReply(applicationId, providerApplicationId);

    // The row loads, but the client asked to reply on a provider application
    // that is not on it — the reply must not fall through to another provider.
    expect(() =>
      requireStaffInfoReply(
        context,
        TEST_STAFF_PSEUDONYMIZED_ID,
        uniqueId("other-provider-application"),
      ),
    ).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.PROVIDER_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws BAD_REQUEST when the provider application is not in INFO_NEEDED", async () => {
    const { applicationId, providerApplicationId } =
      await seedSingleProviderApplication(
        {},
        openProviderInfoRequest({
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
        }),
      );

    const context = await loadReply(applicationId, providerApplicationId);

    expect(() =>
      requireStaffInfoReply(
        context,
        TEST_STAFF_PSEUDONYMIZED_ID,
        providerApplicationId,
      ),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: INFO_REQUEST_BAD_REQUEST.NOT_INFO_NEEDED,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws NOT_FOUND when there is no open information request", async () => {
    const { applicationId, providerApplicationId } =
      await seedSingleProviderApplication({}, { infoRequests: [] });

    const context = await loadReply(applicationId, providerApplicationId);

    expect(() =>
      requireStaffInfoReply(
        context,
        TEST_STAFF_PSEUDONYMIZED_ID,
        providerApplicationId,
      ),
    ).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.OPEN_INFO_REQUEST,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("resolveStaffInfoRequest", () => {
  function loadInfoRequest(
    applicationId: string,
    providerApplicationId: string,
  ) {
    return findStaffInfoRequest(
      testPrismaClient,
      applicationId,
      providerApplicationId,
    );
  }

  it("returns the open info request with messages", async () => {
    const { applicationId, providerApplicationId, infoRequests } =
      await seedSingleProviderApplication();

    const context = await loadInfoRequest(applicationId, providerApplicationId);

    expect(
      resolveStaffInfoRequest(context, TEST_STAFF_PSEUDONYMIZED_ID),
    ).toEqual({
      applicationId,
      providerApplicationId,
      infoRequest: expect.objectContaining({
        id: infoRequests[0].infoRequest.id,
        status: ThreadStatus.OPEN,
        messages: [
          expect.objectContaining({
            id: infoRequests[0].messages[0].id,
            senderType: MessageSenderType.PROVIDER,
            body: PROVIDER_REQUEST_BODY,
          }),
        ],
      }),
    });
  });

  it("returns null when there is no open info request", async () => {
    const { applicationId, providerApplicationId } =
      await seedSingleProviderApplication({}, { infoRequests: [] });

    const context = await loadInfoRequest(applicationId, providerApplicationId);

    expect(
      resolveStaffInfoRequest(context, TEST_STAFF_PSEUDONYMIZED_ID),
    ).toEqual({
      applicationId,
      providerApplicationId,
      infoRequest: null,
    });
  });

  it("skips a resolved thread — only OPEN requests are returned", async () => {
    const { applicationId, providerApplicationId } =
      await seedSingleProviderApplication(
        {},
        { infoRequests: [{ status: ThreadStatus.CLOSED }] },
      );

    const context = await loadInfoRequest(applicationId, providerApplicationId);

    expect(
      resolveStaffInfoRequest(context, TEST_STAFF_PSEUDONYMIZED_ID).infoRequest,
    ).toBeNull();
  });

  it("throws NOT_FOUND when staff does not own the application", async () => {
    const { applicationId, providerApplicationId } =
      await seedSingleProviderApplication({
        staffPseudonymizedId: "other-staff",
      });

    const context = await loadInfoRequest(applicationId, providerApplicationId);

    expect(() =>
      resolveStaffInfoRequest(context, TEST_STAFF_PSEUDONYMIZED_ID),
    ).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("requireProviderInfoEdit", () => {
  function loadEdit(applicationId: string, providerId: string) {
    return findProviderInfoEdit(testPrismaClient, applicationId, providerId);
  }

  it("returns resolved context when an unread provider message exists", async () => {
    const { applicationId, providerApplicationId, providerId, infoRequests } =
      await seedSingleProviderApplication();

    expect(
      requireProviderInfoEdit(await loadEdit(applicationId, providerId)),
    ).toEqual({
      applicationId,
      providerApplicationId,
      infoRequestId: infoRequests[0].infoRequest.id,
      editableMessage: {
        id: infoRequests[0].messages[0].id,
        body: PROVIDER_REQUEST_BODY,
        originalBody: null,
      },
    });
  });

  it("finds nothing when the thread belongs to another provider", async () => {
    const { applicationId } = await seedSingleProviderApplication();
    const otherHousingProvider = await seedHousingProvider(
      "Second Chance Housing",
    );

    const context = await loadEdit(applicationId, otherHousingProvider.id);

    expect(context).toBeNull();
    expect(() => requireProviderInfoEdit(context)).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws BAD_REQUEST when the provider application is not in INFO_NEEDED", async () => {
    const { applicationId, providerId } = await seedSingleProviderApplication(
      {},
      openProviderInfoRequest({
        subStage: ApplicationSubStage.PROVIDER_REVIEW,
      }),
    );

    const context = await loadEdit(applicationId, providerId);

    expect(() => requireProviderInfoEdit(context)).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: INFO_REQUEST_BAD_REQUEST.NOT_INFO_NEEDED,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws BAD_REQUEST when the latest provider message has been read", async () => {
    const { applicationId, providerId } = await seedSingleProviderApplication(
      {},
      {
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
    );

    const context = await loadEdit(applicationId, providerId);

    expect(() => requireProviderInfoEdit(context)).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: INFO_REQUEST_BAD_REQUEST.MESSAGE_NOT_EDITABLE,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("resolveProviderInfoRequest", () => {
  function loadInfoRequests(applicationId: string, providerId: string) {
    return findProviderInfoRequest(testPrismaClient, applicationId, providerId);
  }

  it("returns all info requests with messages, newest first", async () => {
    const { applicationId, providerApplicationId, providerId, infoRequests } =
      await seedSingleProviderApplication(
        {},
        {
          infoRequests: [
            {
              status: ThreadStatus.CLOSED,
              createdAt: new Date("2026-06-09T10:00:00.000Z"),
              messages: [{ senderType: MessageSenderType.PROVIDER }],
            },
            {
              status: ThreadStatus.OPEN,
              createdAt: new Date("2026-06-10T10:00:00.000Z"),
              messages: [
                {
                  senderType: MessageSenderType.PROVIDER,
                  body: PROVIDER_REQUEST_BODY,
                },
              ],
            },
          ],
        },
      );

    const result = resolveProviderInfoRequest(
      await loadInfoRequests(applicationId, providerId),
    );

    expect(result.applicationId).toBe(applicationId);
    expect(result.providerApplicationId).toBe(providerApplicationId);
    expect(result.infoRequests.map((request) => request.id)).toEqual([
      infoRequests[1].infoRequest.id,
      infoRequests[0].infoRequest.id,
    ]);
    expect(result.infoRequests[0]?.messages[0]?.body).toBe(
      PROVIDER_REQUEST_BODY,
    );
  });

  it("returns an empty list when there is no info request", async () => {
    const { applicationId, providerApplicationId, providerId } =
      await seedSingleProviderApplication({}, { infoRequests: [] });

    expect(
      resolveProviderInfoRequest(
        await loadInfoRequests(applicationId, providerId),
      ),
    ).toEqual({
      applicationId,
      providerApplicationId,
      infoRequests: [],
    });
  });

  it("finds nothing when the thread belongs to another provider", async () => {
    const { applicationId } = await seedSingleProviderApplication();
    const otherHousingProvider = await seedHousingProvider(
      "Second Chance Housing",
    );

    const context = await loadInfoRequests(
      applicationId,
      otherHousingProvider.id,
    );

    expect(context).toBeNull();
    expect(() => resolveProviderInfoRequest(context)).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      } satisfies Partial<TRPCError>),
    );
  });
});
