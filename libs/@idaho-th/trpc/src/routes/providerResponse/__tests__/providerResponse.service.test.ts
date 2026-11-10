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
  ThreadStatus,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { PROVIDER_RESPONSE_TYPE } from "~@idaho-th/shared";
import { STAFF_CASE_CLOSED_MESSAGE } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import { INFO_REQUEST_BAD_REQUEST } from "~@idaho-th/trpc/routes/infoRequest/infoRequest.helpers";
import { PROVIDER_RESPONSE_BAD_REQUEST } from "~@idaho-th/trpc/routes/providerResponse/providerResponse.helpers";
import { submitProviderApplicationResponse } from "~@idaho-th/trpc/routes/providerResponse/providerResponse.service";
import {
  createHousingProvider,
  seedProviderUserWithHousingProviders,
  TEST_DATES,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import {
  readHousingApplication,
  readProviderApplication,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedProviderReviewApplication } from "./providerResponse.fixtures";

describe("submitProviderApplicationResponse", () => {
  const message = "Please provide additional documentation";

  // The organization the caller acts as, seeded fresh per test because the
  // suite truncates between them.
  let actor: { providerId: string; providerPseudonymizedId: string };

  beforeEach(async () => {
    const { housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient);
    actor = {
      providerId: housingProviders[0].id,
      providerPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
    };
  });

  function seedApplication(
    options?: Parameters<typeof seedProviderReviewApplication>[2],
  ) {
    return seedProviderReviewApplication(
      testPrismaClient,
      actor.providerId,
      options,
    );
  }

  test("allows a provider to request more information with a message", async () => {
    const { application, providerApplication } = await seedApplication();

    const result = await submitProviderApplicationResponse(
      testPrismaClient,
      actor,
      application.id,
      PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
      message,
    );

    expect(result).toMatchObject({
      applicationId: application.id,
      response: PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
      staffSubStage: ApplicationSubStage.INFO_NEEDED,
      staffStatus: ApplicationStatus.ACTION_NEEDED,
      message,
      threadId: expect.any(String),
    });

    const updatedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplication.id,
    );
    expect(updatedProviderApplication.subStage).toBe(
      ApplicationSubStage.INFO_NEEDED,
    );
    expect(updatedProviderApplication.status).toBe(ApplicationStatus.WAITING);

    const updatedStaffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(updatedStaffApplication.subStage).toBe(
      ApplicationSubStage.INFO_NEEDED,
    );
    expect(updatedStaffApplication.status).toBe(
      ApplicationStatus.ACTION_NEEDED,
    );

    // lastActivityAt drives the dashboard's "Last Updated" column.
    const updatedApplication = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updatedApplication.lastActivityAt.getTime()).toBeGreaterThan(
      TEST_DATES.LAST_ACTIVITY.getTime(),
    );

    const infoRequest =
      await testPrismaClient.providerApplicationThread.findUniqueOrThrow({
        where: { id: result.threadId },
        include: { messages: true },
      });
    expect(infoRequest.status).toBe(ThreadStatus.OPEN);
    expect(infoRequest.messages).toHaveLength(1);
    expect(infoRequest.messages[0]).toMatchObject({
      senderType: "PROVIDER",
      senderPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      body: message,
    });

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toHaveLength(1);
    expect(timelineEvents[0]).toMatchObject({
      eventType: TimelineEventType.PROVIDER_REQUESTED_INFO,
      actorRole: TimelineActorRole.PROVIDER,
      actorPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      scopedProviderId: actor.providerId,
    });
  });

  test("allows a provider to conditionally approve an application", async () => {
    const { application, providerApplication } = await seedApplication();

    const result = await submitProviderApplicationResponse(
      testPrismaClient,
      actor,
      application.id,
      PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
    );

    expect(result).toMatchObject({
      applicationId: application.id,
      response: PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
      staffSubStage: ApplicationSubStage.OFFERS_RECEIVED,
      staffStatus: ApplicationStatus.ACTION_NEEDED,
    });

    const updatedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplication.id,
    );
    expect(updatedProviderApplication.subStage).toBe(
      ApplicationSubStage.CONDITIONALLY_APPROVED,
    );
    expect(updatedProviderApplication.status).toBe(ApplicationStatus.WAITING);

    const updatedStaffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(updatedStaffApplication.subStage).toBe(
      ApplicationSubStage.OFFERS_RECEIVED,
    );
    expect(updatedStaffApplication.status).toBe(
      ApplicationStatus.ACTION_NEEDED,
    );

    const updatedApplication = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updatedApplication.lastActivityAt.getTime()).toBeGreaterThan(
      TEST_DATES.LAST_ACTIVITY.getTime(),
    );

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toHaveLength(1);
    expect(timelineEvents[0]).toMatchObject({
      eventType: TimelineEventType.PROVIDER_CONDITIONALLY_APPROVED,
      scopedProviderId: actor.providerId,
    });
  });

  test("allows a provider to decline an application", async () => {
    const { application, providerApplication } = await seedApplication();

    const result = await submitProviderApplicationResponse(
      testPrismaClient,
      actor,
      application.id,
      PROVIDER_RESPONSE_TYPE.DECLINE,
    );

    expect(result).toMatchObject({
      applicationId: application.id,
      response: PROVIDER_RESPONSE_TYPE.DECLINE,
      staffSubStage: ApplicationSubStage.DECLINED,
      staffStatus: ApplicationStatus.ACTION_NEEDED,
    });

    const updatedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplication.id,
    );
    expect(updatedProviderApplication.stage).toBe(ApplicationStage.CLOSED);
    expect(updatedProviderApplication.subStage).toBe(
      ApplicationSubStage.DECLINED,
    );
    expect(updatedProviderApplication.status).toBe(ApplicationStatus.DONE);

    const updatedStaffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(updatedStaffApplication.subStage).toBe(ApplicationSubStage.DECLINED);
    expect(updatedStaffApplication.status).toBe(
      ApplicationStatus.ACTION_NEEDED,
    );

    const updatedApplication = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updatedApplication.lastActivityAt.getTime()).toBeGreaterThan(
      TEST_DATES.LAST_ACTIVITY.getTime(),
    );

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toHaveLength(1);
    expect(timelineEvents[0]).toMatchObject({
      eventType: TimelineEventType.PROVIDER_DECLINED,
      scopedProviderId: actor.providerId,
    });
  });

  test("closes any open information request when a provider conditionally approves or declines", async () => {
    const { application, providerApplication } = await seedApplication({
      withOpenInfoRequest: true,
    });

    await submitProviderApplicationResponse(
      testPrismaClient,
      actor,
      application.id,
      PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
    );

    const infoRequests =
      await testPrismaClient.providerApplicationThread.findMany({
        where: { providerApplicationId: providerApplication.id },
      });
    expect(infoRequests).toHaveLength(1);
    expect(infoRequests[0]).toMatchObject({
      status: ThreadStatus.CLOSED,
      resolvedAt: expect.any(Date),
    });
  });

  test("rejects a provider information request without a message", async () => {
    const { application, providerApplication } = await seedApplication();

    await expect(
      submitProviderApplicationResponse(
        testPrismaClient,
        actor,
        application.id,
        PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
        "   ",
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: PROVIDER_RESPONSE_BAD_REQUEST.MESSAGE_REQUIRED,
      } satisfies Partial<TRPCError>),
    );

    const updatedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplication.id,
    );
    expect(updatedProviderApplication.subStage).toBe(
      ApplicationSubStage.PROVIDER_REVIEW,
    );
  });

  test("rejects INFO_NEEDED when an open information request already exists", async () => {
    const { application, providerApplication } = await seedApplication({
      withOpenInfoRequest: true,
    });

    await expect(
      submitProviderApplicationResponse(
        testPrismaClient,
        actor,
        application.id,
        PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
        message,
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: INFO_REQUEST_BAD_REQUEST.OPEN_INFO_REQUEST_EXISTS,
      } satisfies Partial<TRPCError>),
    );

    const updatedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplication.id,
    );
    expect(updatedProviderApplication.subStage).toBe(
      ApplicationSubStage.PROVIDER_REVIEW,
    );
  });

  test("rejects provider responses before the application is sent to providers", async () => {
    const { application, providerApplication } = await seedApplication({
      sentToProvidersAt: null,
    });

    await expect(
      submitProviderApplicationResponse(
        testPrismaClient,
        actor,
        application.id,
        PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: "Application has not been sent to providers",
      } satisfies Partial<TRPCError>),
    );

    const updatedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplication.id,
    );
    expect(updatedProviderApplication.subStage).toBe(
      ApplicationSubStage.PROVIDER_REVIEW,
    );
  });

  test.each([ApplicationSubStage.DECLINED, ApplicationSubStage.SELECTED])(
    "rejects provider responses when the provider application is locked in %s",
    async (subStage) => {
      const { application, providerApplication } = await seedApplication({
        subStage,
      });

      await expect(
        submitProviderApplicationResponse(
          testPrismaClient,
          actor,
          application.id,
          PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "BAD_REQUEST",
          message: "Application response can no longer be changed",
        } satisfies Partial<TRPCError>),
      );

      const updatedProviderApplication = await readProviderApplication(
        testPrismaClient,
        providerApplication.id,
      );
      expect(updatedProviderApplication.subStage).toBe(subStage);
    },
  );

  test("rejects a provider response for another provider's application", async () => {
    const { application, providerApplication } = await seedApplication();
    const otherHousingProvider = await createHousingProvider(testPrismaClient);

    await expect(
      submitProviderApplicationResponse(
        testPrismaClient,
        {
          providerId: otherHousingProvider.id,
          providerPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
        },
        application.id,
        PROVIDER_RESPONSE_TYPE.DECLINE,
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: "Application not found for this provider",
      } satisfies Partial<TRPCError>),
    );

    const updatedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplication.id,
    );
    expect(updatedProviderApplication.subStage).toBe(
      ApplicationSubStage.PROVIDER_REVIEW,
    );
  });

  it("rejects provider responses when the staff case is closed", async () => {
    const { application, providerApplication } = await seedApplication({
      staffStage: ApplicationStage.CLOSED,
    });

    await expect(
      submitProviderApplicationResponse(
        testPrismaClient,
        actor,
        application.id,
        PROVIDER_RESPONSE_TYPE.DECLINE,
      ),
    ).rejects.toThrow(STAFF_CASE_CLOSED_MESSAGE);

    const updatedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplication.id,
    );
    expect(updatedProviderApplication.subStage).toBe(
      ApplicationSubStage.PROVIDER_REVIEW,
    );
  });
});
