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
  MessageSenderType,
  type Prisma,
  ThreadType,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  createHousingApplicationTimelineEvent,
  createHousingProvider,
  createHousingProviderUser,
  createProviderTimelineReadState,
  createStaffTimelineReadState,
  TEST_STAFF_PSEUDONYMIZED_ID,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  getProviderTimeline,
  getStaffTimeline,
  markProviderTimelineViewed,
  markStaffTimelineViewed,
} from "../timeline.service";
import { seedTimelineApplication } from "./timeline.fixtures";

type EventSeed = {
  applicationId: string;
  eventType?: TimelineEventType;
  actorPseudonymizedId?: string | null;
  scopedProviderId?: string | null;
  cmOnly?: boolean;
  metadata?: Prisma.InputJsonValue;
  createdAt: Date;
};

function seedEvent({ applicationId, ...overrides }: EventSeed) {
  return createHousingApplicationTimelineEvent(testPrismaClient, {
    applicationId,
    ...overrides,
  });
}

function readStaffReadState(applicationId: string) {
  return testPrismaClient.staffTimelineReadState.findUnique({
    where: {
      applicationId_staffPseudonymizedId: {
        applicationId,
        staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      },
    },
  });
}

function readProviderReadState(applicationId: string, providerId: string) {
  return testPrismaClient.providerTimelineReadState.findUnique({
    where: { applicationId_providerId: { applicationId, providerId } },
  });
}

describe("getStaffTimeline", () => {
  function getTimeline(
    applicationId: string,
    includeProviderNotSelected?: boolean,
  ) {
    return getStaffTimeline(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      applicationId,
      includeProviderNotSelected,
    );
  }

  it("counts every event as new when the CM has never opened the timeline", async () => {
    const { application } = await seedTimelineApplication(testPrismaClient);
    const older = await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    });
    const newer = await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await getTimeline(application.id);

    expect(result.events.map((event) => event.id)).toEqual([
      newer.id,
      older.id,
    ]);
    expect(result.newEventCount).toBe(2);
    expect(result.lastViewedTimelineAt).toBeNull();
  });

  it("counts only events newer than the last viewed timestamp", async () => {
    const { application } = await seedTimelineApplication(testPrismaClient);
    await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-08T00:00:00.000Z"),
    });
    await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });
    const lastViewedTimelineAt = new Date("2026-06-09T00:00:00.000Z");
    await createStaffTimelineReadState(testPrismaClient, {
      applicationId: application.id,
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      lastViewedTimelineAt,
    });

    const result = await getTimeline(application.id);

    expect(result.newEventCount).toBe(1);
    expect(result.lastViewedTimelineAt).toEqual(lastViewedTimelineAt);
  });

  it("attaches the info-request body to the request and reply events from the same read", async () => {
    const requestBody =
      "We're missing clarification on the client's violent history";
    const replyBody = "The client has no recent incidents";

    const { application, providers } = await seedTimelineApplication(
      testPrismaClient,
      {
        providers: [
          {
            infoRequests: [
              {
                messages: [
                  {
                    senderType: MessageSenderType.PROVIDER,
                    body: requestBody,
                  },
                  {
                    senderType: MessageSenderType.STAFF,
                    body: replyBody,
                  },
                ],
              },
            ],
          },
        ],
      },
    );
    const [thread] = providers[0].infoRequests;

    const created = await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    });
    const request = await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.PROVIDER_REQUESTED_INFO,
      metadata: { infoRequestId: thread.infoRequest.id },
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });
    const reply = await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST,
      metadata: {
        infoRequestId: thread.infoRequest.id,
        infoRequestMessageId: thread.messages[1].id,
      },
      createdAt: new Date("2026-06-11T00:00:00.000Z"),
    });

    const result = await getTimeline(application.id);

    const byId = Object.fromEntries(
      result.events.map((event) => [event.id, event.message]),
    );
    expect(byId[request.id]).toBe(requestBody);
    expect(byId[reply.id]).toBe(replyBody);
    // Non-info-request events carry no body.
    expect(byId[created.id]).toBeNull();
  });

  it("attaches the revoke reason to the revoke event", async () => {
    const reason = "The bed is no longer available";
    const { application, providers } = await seedTimelineApplication(
      testPrismaClient,
      {
        providers: [
          {
            infoRequests: [
              {
                type: ThreadType.CONDITIONAL_APPROVAL_REVOKED,
                messages: [
                  { senderType: MessageSenderType.PROVIDER, body: reason },
                ],
              },
            ],
          },
        ],
      },
    );
    const [thread] = providers[0].infoRequests;
    const revoke = await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL,
      metadata: { threadId: thread.infoRequest.id },
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await getTimeline(application.id);

    expect(result.events.find((event) => event.id === revoke.id)?.message).toBe(
      reason,
    );
  });

  it("throws NOT_FOUND when the staff member cannot access the application", async () => {
    const { application } = await seedTimelineApplication(testPrismaClient, {
      staffPseudonymizedId: "other-staff",
    });

    await expect(getTimeline(application.id)).rejects.toThrow(TRPCError);
    await expect(getTimeline(uniqueId("missing-application"))).rejects.toThrow(
      TRPCError,
    );
  });

  it("excludes PROVIDER_NOT_SELECTED at the query level by default", async () => {
    const { application } = await seedTimelineApplication(testPrismaClient);
    const kept = await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    });
    await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.PROVIDER_NOT_SELECTED,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await getTimeline(application.id);

    expect(result.events.map((event) => event.id)).toEqual([kept.id]);
    expect(result.newEventCount).toBe(1);
  });

  it("does not filter timeline events by eventType when explicitly requested", async () => {
    const { application } = await seedTimelineApplication(testPrismaClient);
    const kept = await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    });
    const notSelected = await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.PROVIDER_NOT_SELECTED,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await getTimeline(application.id, true);

    expect(result.events.map((event) => event.id)).toEqual([
      notSelected.id,
      kept.id,
    ]);
  });
});

describe("getProviderTimeline", () => {
  function seedProviderApplication(stage: ApplicationStage) {
    return seedTimelineApplication(testPrismaClient, {
      providers: [{ stage }],
    });
  }

  /** `providerId` is the verified active organization, never a person. */
  function getTimeline(applicationId: string, providerId: string) {
    return getProviderTimeline(testPrismaClient, providerId, applicationId);
  }

  it("keeps the full history visible for the winning provider once closed", async () => {
    const { application, providers } = await seedProviderApplication(
      ApplicationStage.CLOSED,
    );
    const providerId = providers[0].provider.id;

    const before = await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    });
    // Unscoped staff/system events after the case closed — still visible, since
    // only the winning provider reaches this state without a closing event.
    const after = await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-11T00:00:00.000Z"),
    });
    // Addressed to this provider — always visible.
    const mine = await seedEvent({
      applicationId: application.id,
      scopedProviderId: providerId,
      createdAt: new Date("2026-06-12T00:00:00.000Z"),
    });

    const result = await getTimeline(application.id, providerId);

    expect(result.events.map((event) => event.id)).toEqual([
      mine.id,
      after.id,
      before.id,
    ]);
  });

  it("hides events added after a declined provider's application closed", async () => {
    const { application, providers } = await seedProviderApplication(
      ApplicationStage.CLOSED,
    );
    const providerId = providers[0].provider.id;
    const closedAt = new Date("2026-06-10T00:00:00.000Z");

    const before = await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    });
    // The decline event itself — at the cutoff, and scoped to this provider.
    const declined = await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.PROVIDER_DECLINED,
      scopedProviderId: providerId,
      createdAt: closedAt,
    });
    // Staff activity after this provider declined — must be hidden.
    await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.EXPECTED_RELEASE_DATE_UPDATED,
      createdAt: new Date("2026-06-11T00:00:00.000Z"),
    });

    const result = await getTimeline(application.id, providerId);

    expect(result.events.map((event) => event.id)).toEqual([
      declined.id,
      before.id,
    ]);
  });

  it("hides cmOnly and other-provider events", async () => {
    const { application, providers } = await seedTimelineApplication(
      testPrismaClient,
      {
        providers: [{ name: "Alpha Housing" }, { name: "Beta Housing" }],
      },
    );

    const shared = await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    });
    await seedEvent({
      applicationId: application.id,
      cmOnly: true,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });
    await seedEvent({
      applicationId: application.id,
      scopedProviderId: providers[1].provider.id,
      createdAt: new Date("2026-06-11T00:00:00.000Z"),
    });

    const result = await getTimeline(application.id, providers[0].provider.id);

    expect(result.events.map((event) => event.id)).toEqual([shared.id]);
  });

  it("throws NOT_FOUND for a provider the application was never sent to", async () => {
    const { application } = await seedTimelineApplication(testPrismaClient, {
      providers: [{ name: "Alpha Housing" }],
    });
    const outsider = await createHousingProvider(testPrismaClient);

    await expect(getTimeline(application.id, outsider.id)).rejects.toThrow(
      TRPCError,
    );
  });

  it("hides an APPLICATION_SENT_TO_PROVIDERS send this provider wasn't part of", async () => {
    const { application, providers } = await seedProviderApplication(
      ApplicationStage.APPLICATION,
    );
    const providerId = providers[0].provider.id;

    await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
      metadata: { providerCount: 1, providerIds: ["some-other-provider"] },
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
    });
    const mySend = await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
      metadata: { providerCount: 2, providerIds: [providerId, "other"] },
      createdAt: new Date("2026-06-02T00:00:00.000Z"),
    });

    const result = await getTimeline(application.id, providerId);

    expect(result.events.map((event) => event.id)).toEqual([mySend.id]);
    expect(result.events[0]).not.toHaveProperty("metadata");
  });

  it("hides APPLICATION_SENT_TO_PROVIDERS rows without providerIds", async () => {
    const { application, providers } = await seedProviderApplication(
      ApplicationStage.APPLICATION,
    );
    await seedEvent({
      applicationId: application.id,
      eventType: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
      metadata: { providerCount: 3 },
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
    });

    await expect(
      getTimeline(application.id, providers[0].provider.id),
    ).resolves.toMatchObject({
      events: [],
      newEventCount: 0,
    });
  });
});

describe("markStaffTimelineViewed", () => {
  it("upserts the CM read state after verifying access", async () => {
    const { application } = await seedTimelineApplication(testPrismaClient);

    await markStaffTimelineViewed(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );

    await expect(readStaffReadState(application.id)).resolves.toMatchObject({
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      lastViewedTimelineAt: expect.any(Date),
      lastOpenedModalAt: null,
    });
  });

  it("moves the timestamp forward on a second view without duplicating the row", async () => {
    const { application } = await seedTimelineApplication(testPrismaClient);
    const lastOpenedModalAt = new Date("2026-06-01T00:00:00.000Z");
    await createStaffTimelineReadState(testPrismaClient, {
      applicationId: application.id,
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      lastViewedTimelineAt: new Date("2026-06-01T00:00:00.000Z"),
      lastOpenedModalAt,
    });

    await markStaffTimelineViewed(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );

    const readState = await readStaffReadState(application.id);
    expect(readState?.lastViewedTimelineAt?.getTime()).toBeGreaterThan(
      new Date("2026-06-01T00:00:00.000Z").getTime(),
    );
    // The upsert must not clobber the modal timestamp it was not asked to set.
    expect(readState?.lastOpenedModalAt).toEqual(lastOpenedModalAt);
  });

  it("does not write read state when access is denied", async () => {
    const { application } = await seedTimelineApplication(testPrismaClient, {
      staffPseudonymizedId: "other-staff",
    });

    await expect(
      markStaffTimelineViewed(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        application.id,
      ),
    ).rejects.toThrow(TRPCError);

    await expect(readStaffReadState(application.id)).resolves.toBeNull();
  });
});

describe("split read state", () => {
  /** One application, one organization on it, and one unread event. */
  async function seedUnreadApplication() {
    const { application, providers } = await seedTimelineApplication(
      testPrismaClient,
      { providers: [{ name: "Alpha Housing" }] },
    );
    await seedEvent({
      applicationId: application.id,
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    });

    return { application, providerId: providers[0].provider.id };
  }

  it("counts one colleague's read as the whole provider's read", async () => {
    const { application, providerId } = await seedUnreadApplication();
    const colleague = await createHousingProviderUser(testPrismaClient);

    await markProviderTimelineViewed(
      testPrismaClient,
      { providerId, providerUserId: colleague.id },
      application.id,
    );

    // Nothing about this read is keyed on the person, so a colleague who never
    // opened it reads the same already-viewed timeline.
    const timeline = await getProviderTimeline(
      testPrismaClient,
      providerId,
      application.id,
    );
    expect(timeline.newEventCount).toBe(0);
    expect(timeline.lastViewedTimelineAt).toEqual(expect.any(Date));
  });

  it("records which person performed the read", async () => {
    const { application, providerId } = await seedUnreadApplication();
    const colleague = await createHousingProviderUser(testPrismaClient);

    await markProviderTimelineViewed(
      testPrismaClient,
      { providerId, providerUserId: colleague.id },
      application.id,
    );

    await expect(
      readProviderReadState(application.id, providerId),
    ).resolves.toMatchObject({ providerUserId: colleague.id });
  });

  it("records a read for a provider that has no users to attribute it to", async () => {
    const { application, providerId } = await seedUnreadApplication();

    await markProviderTimelineViewed(
      testPrismaClient,
      { providerId, providerUserId: null },
      application.id,
    );

    await expect(
      readProviderReadState(application.id, providerId),
    ).resolves.toMatchObject({
      providerUserId: null,
      lastViewedTimelineAt: expect.any(Date),
    });
  });

  it("leaves the provider's timeline unread when staff read it", async () => {
    const { application, providerId } = await seedUnreadApplication();

    await markStaffTimelineViewed(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );

    await expect(
      readProviderReadState(application.id, providerId),
    ).resolves.toBeNull();
    const timeline = await getProviderTimeline(
      testPrismaClient,
      providerId,
      application.id,
    );
    expect(timeline.lastViewedTimelineAt).toBeNull();
    expect(timeline.newEventCount).toBe(1);
  });

  it("leaves the staff timeline unread when a provider read it", async () => {
    const { application, providerId } = await seedUnreadApplication();
    const colleague = await createHousingProviderUser(testPrismaClient);

    await markProviderTimelineViewed(
      testPrismaClient,
      { providerId, providerUserId: colleague.id },
      application.id,
    );

    await expect(readStaffReadState(application.id)).resolves.toBeNull();
    const timeline = await getStaffTimeline(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );
    expect(timeline.lastViewedTimelineAt).toBeNull();
    expect(timeline.newEventCount).toBe(1);
  });

  it("lets a staff member read a timeline before their staff record exists", async () => {
    const { application } = await seedUnreadApplication();
    // The Intercom sync creates HousingStaff rows lazily, so there is none yet.
    await expect(testPrismaClient.housingStaff.count()).resolves.toBe(0);

    await markStaffTimelineViewed(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      application.id,
    );

    await expect(readStaffReadState(application.id)).resolves.not.toBeNull();
  });

  it("does not let another provider's read state mark this one read", async () => {
    const { application, providerId } = await seedUnreadApplication();
    const otherHousingProvider = await createHousingProvider(testPrismaClient);
    await createProviderTimelineReadState(testPrismaClient, {
      applicationId: application.id,
      providerId: otherHousingProvider.id,
      lastViewedTimelineAt: new Date("2026-06-10T00:00:00.000Z"),
    });

    const timeline = await getProviderTimeline(
      testPrismaClient,
      providerId,
      application.id,
    );

    expect(timeline.lastViewedTimelineAt).toBeNull();
    expect(timeline.newEventCount).toBe(1);
  });
});
