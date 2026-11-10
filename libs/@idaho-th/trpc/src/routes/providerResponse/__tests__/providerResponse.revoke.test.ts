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
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  PROVIDER_RESPONSE_TYPE,
  type ProviderResponseType,
} from "~@idaho-th/shared";
import { PROVIDER_RESPONSE_BAD_REQUEST } from "~@idaho-th/trpc/routes/providerResponse/providerResponse.helpers";
import { submitProviderApplicationResponse } from "~@idaho-th/trpc/routes/providerResponse/providerResponse.service";
import {
  createHousingProvider,
  createHousingProviderLocation,
  createProviderHousingApplication,
  seedProviderUserWithHousingProviders,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import {
  readProviderApplication,
  readStaffApplication,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedProviderReviewApplication } from "./providerResponse.fixtures";

const REASON = "The bed is no longer available";
const INFO_MESSAGE = "Please send the client's medication list";

describe("revoking a conditional approval", () => {
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

  function respond(
    applicationId: string,
    response: ProviderResponseType,
    message?: string,
  ) {
    return submitProviderApplicationResponse(
      testPrismaClient,
      actor,
      applicationId,
      response,
      message,
    );
  }

  function revoke(applicationId: string, reason = REASON) {
    return respond(
      applicationId,
      PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL,
      reason,
    );
  }

  function readRevokeThreads(providerApplicationId: string) {
    return testPrismaClient.providerApplicationThread.findMany({
      where: {
        providerApplicationId,
        type: ThreadType.CONDITIONAL_APPROVAL_REVOKED,
      },
      include: { messages: true },
      orderBy: { createdAt: "asc" },
    });
  }

  function readOrderedTimelineEvents(applicationId: string) {
    return testPrismaClient.housingApplicationTimelineEvent.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
    });
  }

  describe("before a home plan is picked", () => {
    it("records the revoke as the provider's own decision", async () => {
      const { application, providerApplication } = await seedApplication({
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      });

      const result = await revoke(application.id);

      // With no other provider still in play, a revoke rolls up like a decline.
      expect(result).toMatchObject({
        response: PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL,
        staffSubStage: ApplicationSubStage.DECLINED,
        staffStatus: ApplicationStatus.ACTION_NEEDED,
        threadId: expect.any(String),
      });
      await expect(
        readProviderApplication(testPrismaClient, providerApplication.id),
      ).resolves.toMatchObject({
        stage: ApplicationStage.APPLICATION,
        subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
        status: ApplicationStatus.DONE,
      });
      await expect(
        readStaffApplication(testPrismaClient, application.id),
      ).resolves.toMatchObject({
        stage: ApplicationStage.APPLICATION,
        subStage: ApplicationSubStage.DECLINED,
        status: ApplicationStatus.ACTION_NEEDED,
      });
    });

    it("shares the reason with the case manager in an open revoke thread", async () => {
      const { application, providerApplication } = await seedApplication({
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      });

      const result = await revoke(application.id);

      const threads = await readRevokeThreads(providerApplication.id);
      expect(threads).toHaveLength(1);
      expect(threads[0]).toMatchObject({
        id: result.threadId,
        status: ThreadStatus.OPEN,
        resolvedAt: null,
      });
      expect(threads[0].messages).toEqual([
        expect.objectContaining({
          senderType: MessageSenderType.PROVIDER,
          senderPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
          body: REASON,
        }),
      ]);
    });

    it("records a provider-scoped timeline event that points at the thread", async () => {
      const { application } = await seedApplication({
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      });

      const result = await revoke(application.id);

      const events = await readOrderedTimelineEvents(application.id);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        eventType: TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL,
        actorRole: TimelineActorRole.PROVIDER,
        actorPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
        scopedProviderId: actor.providerId,
        metadata: { threadId: result.threadId },
        description: expect.stringMatching(
          / revoked their conditional approval$/,
        ),
      });
    });

    it("leaves the case manager waiting while other providers are still reviewing", async () => {
      const { application } = await seedApplication({
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      });
      const otherProvider = await createHousingProvider(testPrismaClient);
      const otherLocation = await createHousingProviderLocation(
        testPrismaClient,
        { providerId: otherProvider.id },
      );
      await createProviderHousingApplication(testPrismaClient, {
        applicationId: application.id,
        providerId: otherProvider.id,
        providerLocationId: otherLocation.id,
      });

      await expect(revoke(application.id)).resolves.toMatchObject({
        staffSubStage: ApplicationSubStage.PROVIDER_REVIEW,
        staffStatus: ApplicationStatus.WAITING,
      });
      await expect(
        readStaffApplication(testPrismaClient, application.id),
      ).resolves.toMatchObject({ status: ApplicationStatus.WAITING });
    });

    it("rejects a revoke without a reason", async () => {
      const { application, providerApplication } = await seedApplication({
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      });

      await expect(revoke(application.id, "   ")).rejects.toThrow(
        expect.objectContaining({
          code: "BAD_REQUEST",
          message: PROVIDER_RESPONSE_BAD_REQUEST.MESSAGE_REQUIRED,
        } satisfies Partial<TRPCError>),
      );
      await expect(
        readProviderApplication(testPrismaClient, providerApplication.id),
      ).resolves.toMatchObject({
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      });
    });

    it("rejects a revoke from a provider that never conditionally approved", async () => {
      const { application } = await seedApplication();

      await expect(revoke(application.id)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it.each([
      [
        PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
        undefined,
        ApplicationSubStage.CONDITIONALLY_APPROVED,
      ],
      [
        PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
        INFO_MESSAGE,
        ApplicationSubStage.INFO_NEEDED,
      ],
      [PROVIDER_RESPONSE_TYPE.DECLINE, undefined, ApplicationSubStage.DECLINED],
    ])(
      "lets the provider change a revoke to %s, closing the revoke thread",
      async (response, message, expectedSubStage) => {
        const { application, providerApplication } = await seedApplication({
          subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
        });
        await revoke(application.id);

        await respond(application.id, response, message);

        await expect(
          readProviderApplication(testPrismaClient, providerApplication.id),
        ).resolves.toMatchObject({ subStage: expectedSubStage });
        const [revokeThread] = await readRevokeThreads(providerApplication.id);
        expect(revokeThread).toMatchObject({
          status: ThreadStatus.CLOSED,
          resolvedAt: expect.any(Date),
        });
      },
    );

    it("opens a second thread when the provider revokes again", async () => {
      const { application, providerApplication } = await seedApplication({
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      });

      await revoke(application.id, "First reason");
      await respond(
        application.id,
        PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
      );
      await revoke(application.id, "Second reason");

      const threads = await readRevokeThreads(providerApplication.id);
      expect(
        threads.map((thread) => [thread.status, thread.messages[0]?.body]),
      ).toEqual([
        [ThreadStatus.CLOSED, "First reason"],
        [ThreadStatus.OPEN, "Second reason"],
      ]);
    });
  });

  describe("after being picked as the home plan", () => {
    function seedHomePlanProvider(stage: ApplicationStage) {
      return seedApplication({
        stage,
        subStage: ApplicationSubStage.SELECTED,
        staffStage: stage,
      });
    }

    it("rejects a home plan revoke from the release stage", async () => {
      const { application } = await seedHomePlanProvider(
        ApplicationStage.RELEASE,
      );

      await expect(revoke(application.id)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("closes the provider's application and the case from approvals", async () => {
      const stage = ApplicationStage.APPROVALS;
      const { application, providerApplication } =
        await seedHomePlanProvider(stage);

      await expect(revoke(application.id)).resolves.toMatchObject({
        staffSubStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
        staffStatus: ApplicationStatus.ACTION_NEEDED,
      });

      await expect(
        readProviderApplication(testPrismaClient, providerApplication.id),
      ).resolves.toMatchObject({
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
        status: ApplicationStatus.DONE,
      });
      await expect(
        readStaffApplication(testPrismaClient, application.id),
      ).resolves.toMatchObject({
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
        status: ApplicationStatus.ACTION_NEEDED,
      });
    });

    it("records the revoke, then the case closing, in that order", async () => {
      const { application } = await seedHomePlanProvider(
        ApplicationStage.APPROVALS,
      );

      await revoke(application.id);

      const events = await readOrderedTimelineEvents(application.id);
      expect(events).toEqual([
        expect.objectContaining({
          eventType: TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL,
          scopedProviderId: actor.providerId,
        }),
        expect.objectContaining({
          eventType: TimelineEventType.CASE_CLOSED,
          actorRole: TimelineActorRole.SYSTEM,
          scopedProviderId: null,
          metadata: {
            closedSubStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
          },
        }),
      ]);
      expect(events[1].createdAt.getTime()).toBeGreaterThan(
        events[0].createdAt.getTime(),
      );
    });

    it.each([
      [PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE, undefined],
      [PROVIDER_RESPONSE_TYPE.INFO_NEEDED, INFO_MESSAGE],
      [PROVIDER_RESPONSE_TYPE.DECLINE, undefined],
    ])(
      "still locks %s for the home plan provider",
      async (response, message) => {
        const { application, providerApplication } = await seedHomePlanProvider(
          ApplicationStage.APPROVALS,
        );

        await expect(
          respond(application.id, response, message),
        ).rejects.toMatchObject({ code: "BAD_REQUEST" });
        await expect(
          readProviderApplication(testPrismaClient, providerApplication.id),
        ).resolves.toMatchObject({ subStage: ApplicationSubStage.SELECTED });
      },
    );
  });
});
