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

import {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { STAFF_CASE_NOT_APPLICATION_MESSAGE } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import { sendApplicationToProviders } from "~@idaho-th/trpc/routes/providerMatching/providerMatching.service";
import {
  TEST_DATES,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import {
  readHousingApplication,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedMatchableApplication } from "./providerMatching.fixtures";

function readProviderApplications(applicationId: string) {
  return testPrismaClient.providerHousingApplication.findMany({
    where: { applicationId },
    orderBy: { provider: { name: "asc" } },
  });
}

function readEligibleProviders(applicationId: string) {
  return testPrismaClient.eligibleHousingProvider.findMany({
    where: { applicationId },
    orderBy: { provider: { name: "asc" } },
  });
}

describe("sendApplicationToProviders", () => {
  it("creates provider application records for eligible providers", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }, { name: "Beta Housing" }] },
    );
    const providerIds = providers.map(({ provider }) => provider.id);

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id, providerIds },
    );

    await expect(readProviderApplications(application.id)).resolves.toEqual(
      providers.map(({ provider, providerLocation }) =>
        expect.objectContaining({
          applicationId: application.id,
          providerId: provider.id,
          providerLocationId: providerLocation.id,
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
          status: ApplicationStatus.ACTION_NEEDED,
        }),
      ),
    );
  });

  it("marks the application sent and advances the staff record", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }] },
    );

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        providerIds: [providers[0].provider.id],
      },
    );

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updated.sentToProvidersAt).toBeInstanceOf(Date);
    expect(updated.lastActivityAt.getTime()).toBeGreaterThan(
      TEST_DATES.LAST_ACTIVITY.getTime(),
    );

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.PROVIDER_REVIEW,
      status: ApplicationStatus.WAITING,
    });
  });

  it("clears isSelected on the eligible providers it sent to", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }, { name: "Beta Housing" }] },
    );

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        providerIds: [providers[0].provider.id],
      },
    );

    const eligible = await readEligibleProviders(application.id);
    expect(eligible.map((row) => row.isSelected)).toEqual([false, true]);
  });

  it("records a single shared APPLICATION_SENT_TO_PROVIDERS event", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }, { name: "Beta Housing" }] },
    );
    const providerIds = providers.map(({ provider }) => provider.id);

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id, providerIds },
    );

    const events = await readTimelineEvents(testPrismaClient, application.id);
    expect(events).toEqual([
      expect.objectContaining({
        eventType: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
        description: "Application submitted to providers",
        actorRole: TimelineActorRole.STAFF,
        actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        scopedProviderId: null,
        cmOnly: false,
      }),
    ]);
    expect(events[0]?.metadata).toEqual({
      providerCount: 2,
      providerIds: expect.arrayContaining(providerIds),
    });
  });

  it("does not create duplicate provider application records when sent twice", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }] },
    );
    const input = {
      applicationId: application.id,
      providerIds: [providers[0].provider.id],
    };

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      input,
    );
    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      input,
    );

    await expect(
      readProviderApplications(application.id),
    ).resolves.toHaveLength(1);
  });

  it("rejects when staff does not own the application", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      {
        staffPseudonymizedId: "other-staff",
        providers: [{ name: "Alpha Housing" }],
      },
    );

    await expect(
      sendApplicationToProviders(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        {
          applicationId: application.id,
          providerIds: [providers[0].provider.id],
        },
      ),
    ).rejects.toThrow("Not authorized to send this application");

    await expect(readProviderApplications(application.id)).resolves.toEqual([]);
  });

  it("rejects when selected providers are not eligible", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing", eligible: false }] },
    );

    await expect(
      sendApplicationToProviders(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        {
          applicationId: application.id,
          providerIds: [providers[0].provider.id],
        },
      ),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "No eligible providers found for the selected provider IDs",
    });

    await expect(readProviderApplications(application.id)).resolves.toEqual([]);
  });

  it("only sends to the eligible providers the caller asked for", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }, { name: "Beta Housing" }] },
    );

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        providerIds: [providers[0].provider.id],
      },
    );

    const created = await readProviderApplications(application.id);
    expect(created.map((row) => row.providerId)).toEqual([
      providers[0].provider.id,
    ]);
  });

  it("leaves the record untouched when the same providers are sent again", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }] },
    );
    const input = {
      applicationId: application.id,
      providerIds: [providers[0].provider.id],
    };

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      input,
    );
    const afterFirst = await readHousingApplication(
      testPrismaClient,
      application.id,
    );

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      input,
    );
    const afterSecond = await readHousingApplication(
      testPrismaClient,
      application.id,
    );

    // The first send is the one that counts: a repeat must not restamp it or
    // tell the timeline the application went out a second time.
    expect(afterSecond.sentToProvidersAt).toEqual(afterFirst.sentToProvidersAt);

    const events = await readTimelineEvents(testPrismaClient, application.id);
    expect(
      events.filter(
        (event) =>
          event.eventType === TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
      ),
    ).toHaveLength(1);
  });

  it("records only the added provider when sending again with one more", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }, { name: "Beta Housing" }] },
    );
    const [alpha, beta] = providers;

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id, providerIds: [alpha.provider.id] },
    );

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        providerIds: [alpha.provider.id, beta.provider.id],
      },
    );

    await expect(
      readProviderApplications(application.id),
    ).resolves.toHaveLength(2);

    const sentEvents = (
      await readTimelineEvents(testPrismaClient, application.id)
    ).filter(
      (event) =>
        event.eventType === TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
    );
    expect(sentEvents).toHaveLength(2);
    expect(sentEvents[1]?.metadata).toEqual({
      providerCount: 1,
      providerIds: [beta.provider.id],
    });
  });

  it("clears isSelected on a provider that was re-ticked after being sent", async () => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }] },
    );
    const input = {
      applicationId: application.id,
      providerIds: [providers[0].provider.id],
    };

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      input,
    );

    await testPrismaClient.eligibleHousingProvider.updateMany({
      where: { applicationId: application.id },
      data: { isSelected: true },
    });

    await sendApplicationToProviders(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      input,
    );

    const eligible = await readEligibleProviders(application.id);
    expect(eligible.map((row) => row.isSelected)).toEqual([false]);
  });

  it.each([
    ApplicationStage.DRAFT,
    ApplicationStage.APPROVALS,
    ApplicationStage.RELEASE,
    ApplicationStage.CLOSED,
  ] as const)("rejects when the staff application is in %s", async (stage) => {
    const { application, providers } = await seedMatchableApplication(
      testPrismaClient,
      { stage, providers: [{ name: "Alpha Housing" }] },
    );

    await expect(
      sendApplicationToProviders(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        {
          applicationId: application.id,
          providerIds: [providers[0].provider.id],
        },
      ),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: STAFF_CASE_NOT_APPLICATION_MESSAGE,
    });

    await expect(readProviderApplications(application.id)).resolves.toEqual([]);
    await expect(
      readTimelineEvents(testPrismaClient, application.id),
    ).resolves.toEqual([]);
  });
});
