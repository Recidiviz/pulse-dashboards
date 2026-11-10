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

import {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ThreadStatus,
} from "~@idaho-th/prisma/client";
import {
  INFO_REQUEST_MESSAGE_MAX_LENGTH,
  PROVIDER_RESPONSE_TYPE,
} from "~@idaho-th/shared";
import {
  providerCaller,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import {
  createHousingProvider,
  seedProviderUserWithHousingProviders,
} from "~@idaho-th/trpc/test/factories";
import {
  readProviderApplication,
  readStaffApplication,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedProviderReviewApplication } from "./providerResponse.fixtures";

describe("providerResponseRouter", () => {
  // The single organization providerCaller() resolves to, reseeded per test.
  let providerId: string;

  beforeEach(async () => {
    const { housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient);
    providerId = housingProviders[0].id;
  });

  function seedApplication(
    options?: Parameters<typeof seedProviderReviewApplication>[2],
  ) {
    return seedProviderReviewApplication(testPrismaClient, providerId, options);
  }

  describe("input validation", () => {
    it("rejects a response value outside the discriminated union", async () => {
      const { application } = await seedApplication();

      await expect(
        providerCaller().housingApplication.submitProviderResponse({
          applicationId: application.id,
          // @ts-expect-error deliberately invalid response literal
          response: "MAYBE",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects INFO_NEEDED without a message field", async () => {
      const { application } = await seedApplication();

      await expect(
        providerCaller().housingApplication.submitProviderResponse({
          applicationId: application.id,
          response: PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
        } as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects INFO_NEEDED with a whitespace-only message", async () => {
      const { application } = await seedApplication();

      await expect(
        providerCaller().housingApplication.submitProviderResponse({
          applicationId: application.id,
          response: PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
          message: "   ",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects INFO_NEEDED with a message longer than the max length", async () => {
      const { application } = await seedApplication();

      await expect(
        providerCaller().housingApplication.submitProviderResponse({
          applicationId: application.id,
          response: PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
          message: "a".repeat(INFO_REQUEST_MESSAGE_MAX_LENGTH + 1),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("submitProviderResponse", () => {
    it("lets the owning provider conditionally approve, updating staff and provider state", async () => {
      const { application, providerApplication } = await seedApplication();

      await expect(
        providerCaller().housingApplication.submitProviderResponse({
          applicationId: application.id,
          response: PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
        }),
      ).resolves.toMatchObject({
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

      const updatedStaffApplication = await readStaffApplication(
        testPrismaClient,
        application.id,
      );
      expect(updatedStaffApplication.subStage).toBe(
        ApplicationSubStage.OFFERS_RECEIVED,
      );
    });

    it("lets the owning provider decline, closing the provider application", async () => {
      const { application, providerApplication } = await seedApplication();

      await expect(
        providerCaller().housingApplication.submitProviderResponse({
          applicationId: application.id,
          response: PROVIDER_RESPONSE_TYPE.DECLINE,
        }),
      ).resolves.toMatchObject({
        applicationId: application.id,
        response: PROVIDER_RESPONSE_TYPE.DECLINE,
        staffSubStage: ApplicationSubStage.DECLINED,
      });

      const updatedProviderApplication = await readProviderApplication(
        testPrismaClient,
        providerApplication.id,
      );
      expect(updatedProviderApplication.stage).toBe(ApplicationStage.CLOSED);
      expect(updatedProviderApplication.subStage).toBe(
        ApplicationSubStage.DECLINED,
      );
    });

    it("lets the owning provider request more information, persisting the message", async () => {
      const { application, providerApplication } = await seedApplication();
      const message = "Please provide additional documentation";

      const result =
        await providerCaller().housingApplication.submitProviderResponse({
          applicationId: application.id,
          response: PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
          message,
        });

      expect(result).toMatchObject({
        applicationId: application.id,
        response: PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
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

      const infoRequest =
        await testPrismaClient.providerApplicationThread.findUniqueOrThrow({
          where: { id: result.threadId },
          include: { messages: true },
        });
      expect(infoRequest.status).toBe(ThreadStatus.OPEN);
      expect(infoRequest.messages).toHaveLength(1);
      expect(infoRequest.messages[0]).toMatchObject({
        senderPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
        body: message,
      });
    });

    it("does not let a provider respond to another provider's application", async () => {
      const otherHousingProvider =
        await createHousingProvider(testPrismaClient);
      const { application, providerApplication } =
        await seedProviderReviewApplication(
          testPrismaClient,
          otherHousingProvider.id,
        );

      await expect(
        providerCaller().housingApplication.submitProviderResponse({
          applicationId: application.id,
          response: PROVIDER_RESPONSE_TYPE.DECLINE,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      const untouchedProviderApplication = await readProviderApplication(
        testPrismaClient,
        providerApplication.id,
      );
      expect(untouchedProviderApplication.subStage).toBe(
        ApplicationSubStage.PROVIDER_REVIEW,
      );
    });
  });
});
