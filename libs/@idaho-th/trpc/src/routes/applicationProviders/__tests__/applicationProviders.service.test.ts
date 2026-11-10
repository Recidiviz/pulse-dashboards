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

import {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  MessageSenderType,
  ThreadStatus,
  ThreadType,
} from "~@idaho-th/prisma/client";
import { getStaffApplicationProviders } from "~@idaho-th/trpc/routes/applicationProviders/applicationProviders.service";
import { INFO_REQUEST_NOT_FOUND } from "~@idaho-th/trpc/routes/infoRequest/infoRequest.helpers";
import {
  createProviderApplicationThread,
  createThreadMessage,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";
import { createOperationRecordingClient } from "~@idaho-th/trpc/test/operations";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedStaffApplicationProviders } from "./applicationProviders.fixtures";

describe("getStaffApplicationProviders", () => {
  function getProviders(
    applicationId: string,
    filters?: Parameters<typeof getStaffApplicationProviders>[3],
  ) {
    return getStaffApplicationProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      applicationId,
      filters,
    );
  }

  test("maps provider applications for owned staff applications", async () => {
    const { application, providerApplications } =
      await seedStaffApplicationProviders(testPrismaClient, {
        providers: [
          {
            name: "Alpha Housing",
            subStage: ApplicationSubStage.INFO_NEEDED,
          },
        ],
      });
    const [seeded] = providerApplications;

    const result = await getProviders(application.id);

    expect(result).toEqual({
      applicationId: application.id,
      providers: [
        {
          providerApplicationId: seeded.providerApplication.id,
          providerId: seeded.provider.id,
          providerName: "Alpha Housing",
          // No user is assigned to this organization, so there is nobody to
          // show staff as its contact.
          contact: null,
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.INFO_NEEDED,
          status: ApplicationStatus.ACTION_NEEDED,
          createdAt: seeded.providerApplication.createdAt,
          providerLocation: {
            id: seeded.providerLocation.id,
            providerId: seeded.provider.id,
            district: "District 1",
            acceptedGenders: ["ALL"],
            acceptsRiders: true,
            acceptsSexOffenders: false,
            acceptsViolentCriminals: false,
            faithBased: false,
            housingType: null,
            populationsServed: null,
            addressUsedForPPInvestigation: false,
          },
          infoRequests: [],
          approvalRevoked: null,
        },
      ],
    });
  });

  test("returns the latest revoke reason apart from the info requests", async () => {
    const { application, providerApplications } =
      await seedStaffApplicationProviders(testPrismaClient, {
        providers: [
          {
            name: "Alpha Housing",
            subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
          },
        ],
      });
    const providerApplicationId =
      providerApplications[0].providerApplication.id;

    async function seedRevokeThread(
      body: string,
      createdAt: Date,
      status: ThreadStatus,
    ) {
      const thread = await createProviderApplicationThread(testPrismaClient, {
        providerApplicationId,
        type: ThreadType.CONDITIONAL_APPROVAL_REVOKED,
        status,
        createdAt,
      });
      await createThreadMessage(testPrismaClient, {
        threadId: thread.id,
        senderType: MessageSenderType.PROVIDER,
        senderPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
        body,
        createdAt,
      });
    }
    await seedRevokeThread(
      "Funding fell through",
      new Date("2026-01-01T00:00:00.000Z"),
      ThreadStatus.CLOSED,
    );
    await seedRevokeThread(
      "The bed is gone",
      new Date("2026-01-05T00:00:00.000Z"),
      ThreadStatus.OPEN,
    );

    const [provider] = (await getProviders(application.id)).providers;

    expect(provider?.approvalRevoked).toEqual({
      message: "The bed is gone",
      createdAt: new Date("2026-01-05T00:00:00.000Z"),
    });
    expect(provider?.infoRequests).toEqual([]);
  });

  test("returns all info requests, newest first, with their messages", async () => {
    const { application, providerApplications } =
      await seedStaffApplicationProviders(testPrismaClient, {
        providers: [{ name: "Alpha Housing" }],
      });
    const providerApplicationId =
      providerApplications[0].providerApplication.id;

    const closedInfoRequest = await createProviderApplicationThread(
      testPrismaClient,
      {
        providerApplicationId,
        status: ThreadStatus.CLOSED,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        resolvedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    );
    await createThreadMessage(testPrismaClient, {
      threadId: closedInfoRequest.id,
      senderType: MessageSenderType.PROVIDER,
      senderPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      body: "Need more info",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    await createThreadMessage(testPrismaClient, {
      threadId: closedInfoRequest.id,
      senderType: MessageSenderType.STAFF,
      senderPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      body: "Here is the info",
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    const openInfoRequest = await createProviderApplicationThread(
      testPrismaClient,
      {
        providerApplicationId,
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    );
    await createThreadMessage(testPrismaClient, {
      threadId: openInfoRequest.id,
      senderType: MessageSenderType.PROVIDER,
      senderPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      body: "One more question",
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
    });

    const result = await getProviders(application.id);

    const infoRequests = result.providers[0]?.infoRequests;
    expect(infoRequests).toMatchObject([
      {
        id: openInfoRequest.id,
        status: ThreadStatus.OPEN,
        resolvedAt: null,
        messages: [{ body: "One more question" }],
      },
      {
        id: closedInfoRequest.id,
        status: ThreadStatus.CLOSED,
        resolvedAt: closedInfoRequest.resolvedAt,
        // Newest message first.
        messages: [{ body: "Here is the info" }, { body: "Need more info" }],
      },
    ]);
  });

  test("sorts providers by subStage priority then provider name", async () => {
    const { application } = await seedStaffApplicationProviders(
      testPrismaClient,
      {
        providers: [
          {
            name: "Zulu Housing",
            subStage: ApplicationSubStage.DECLINED,
          },
          {
            name: "Alpha Housing",
            subStage: ApplicationSubStage.PROVIDER_REVIEW,
          },
          {
            name: "Beta Housing",
            subStage: ApplicationSubStage.INFO_NEEDED,
          },
          {
            name: "Charlie Housing",
            subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
          },
        ],
      },
    );

    const result = await getProviders(application.id);

    expect(result.providers.map((provider) => provider.providerName)).toEqual([
      "Charlie Housing",
      "Beta Housing",
      "Alpha Housing",
      "Zulu Housing",
    ]);
  });

  test("returns only the provider applications matching the filters", async () => {
    const { application, providerApplications } =
      await seedStaffApplicationProviders(testPrismaClient, {
        providers: [
          {
            name: "Alpha Housing",
            subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
          },
          {
            name: "Beta Housing",
            subStage: ApplicationSubStage.DECLINED,
          },
        ],
      });

    const result = await getProviders(application.id, {
      subStage: [ApplicationSubStage.CONDITIONALLY_APPROVED],
    });

    expect(result.providers).toHaveLength(1);
    expect(result.providers[0]?.providerApplicationId).toBe(
      providerApplications[0].providerApplication.id,
    );
  });

  test("reads the application and its providers in a single joined query", async () => {
    const { application } = await seedStaffApplicationProviders(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }] },
    );
    const { client, operations } =
      createOperationRecordingClient(testPrismaClient);

    const result = await getStaffApplicationProviders(
      client,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );

    // Guards the joined read: per-provider follow-up queries would show up here.
    expect(operations).toEqual(["HousingApplication.findFirst"]);
    expect(result.providers).toHaveLength(1);
  });

  test("throws NOT_FOUND when staff does not own the application", async () => {
    const { application } = await seedStaffApplicationProviders(
      testPrismaClient,
      {
        staffPseudonymizedId: "other-staff",
        providers: [{ name: "Alpha Housing" }],
      },
    );

    await expect(getProviders(application.id)).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });

  test("throws NOT_FOUND when the application does not exist", async () => {
    await expect(getProviders(uniqueId("missing-application"))).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: INFO_REQUEST_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });
});
