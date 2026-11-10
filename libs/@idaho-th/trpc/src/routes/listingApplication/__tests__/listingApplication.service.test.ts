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

import { beforeEach, describe, expect, it } from "vitest";

import {
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  HomePlanType,
} from "~@idaho-th/prisma/client";
import {
  APPLICATION_FILTER_LAST_UPDATED,
  APPLICATION_LAST_UPDATED_STATUS,
  APPLICATION_STAGE,
} from "~@idaho-th/shared";
import {
  createHousingApplicationHomePlan,
  seedProviderUserWithHousingProviders,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  getHousingApplicationsByStaff,
  getProviderApplications,
} from "../listingApplication.service";
import type { ListApplicationsInput } from "../listingApplication.types";
import {
  DEFAULT_CLIENT_NAME,
  DEFAULT_EXPECTED_RELEASE_DATE,
  DEFAULT_IDOC_NUMBER,
  seedDashboardApplication,
} from "./listingApplication.fixtures";

const providerPseudonymizedId = TEST_PROVIDER_PSEUDONYMIZED_ID;
const OTHER_ACTOR = "other-user";
const baseInput: ListApplicationsInput = { pagination: { pageSize: 8 } };

// Drives the "No Updates (30d)" bucket, which is the only caller of the raw
// has-new-updates query — and so the only place the read-state tables are read
// through SQL rather than through Prisma's select.
const noUpdatesInput: ListApplicationsInput = {
  ...baseInput,
  filters: { lastUpdated: [APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D] },
};

// One person assigned to two organizations — the shape the organization filter
// has to get right. Reseeded per test because the suite truncates between them.
let housingProviderId: string;
let otherHousingProviderId: string;

beforeEach(async () => {
  const { housingProviders } = await seedProviderUserWithHousingProviders(
    testPrismaClient,
    { housingProviders: [{ name: "Sunrise House" }, { name: "Beta Housing" }] },
  );
  housingProviderId = housingProviders[0].id;
  otherHousingProviderId = housingProviders[1].id;
});

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function listForStaff(input: ListApplicationsInput = baseInput) {
  return getHousingApplicationsByStaff(
    testPrismaClient,
    TEST_STAFF_PSEUDONYMIZED_ID,
    input,
  );
}

function listForProvider(
  input: ListApplicationsInput = baseInput,
  providerId: string = housingProviderId,
) {
  return getProviderApplications(
    testPrismaClient,
    { providerId, providerPseudonymizedId },
    input,
  );
}

describe("getHousingApplicationsByStaff", () => {
  it("scopes list queries to the authenticated staff member", async () => {
    const { application } = await seedDashboardApplication(testPrismaClient);
    await seedDashboardApplication(testPrismaClient, {
      staffPseudonymizedId: "other-staff",
      clientName: "Not Mine",
    });

    const result = await listForStaff();

    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual([application.id]);
  });

  it("hides stale closed cases by default", async () => {
    const { application: open } =
      await seedDashboardApplication(testPrismaClient);
    await seedDashboardApplication(testPrismaClient, {
      clientName: "Closed Long Ago",
      expectedReleaseDate: null,
      staff: {
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.DECLINED,
        updatedAt: daysAgo(30),
      },
    });

    const result = await listForStaff();

    expect(result.items.map((item) => item.id)).toEqual([open.id]);
  });

  it("keeps hiding stale closed cases when the user filters explicitly to Closed", async () => {
    const { application: recentlyClosed } = await seedDashboardApplication(
      testPrismaClient,
      {
        clientName: "Closed This Week",
        expectedReleaseDate: null,
        staff: {
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.DECLINED,
          updatedAt: daysAgo(2),
        },
      },
    );
    await seedDashboardApplication(testPrismaClient, {
      clientName: "Closed Long Ago",
      expectedReleaseDate: null,
      staff: {
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.DECLINED,
        updatedAt: daysAgo(30),
      },
    });

    const result = await listForStaff({
      ...baseInput,
      filters: { stage: [APPLICATION_STAGE.CLOSED] },
    });

    expect(result.items.map((item) => item.id)).toEqual([recentlyClosed.id]);
  });

  it("keeps a long-closed Closed: Released case visible until 7 days past its release date", async () => {
    const { application: released } = await seedDashboardApplication(
      testPrismaClient,
      {
        clientName: "Released Client",
        expectedReleaseDate: daysAgo(3),
        staff: {
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.RELEASED,
          updatedAt: daysAgo(30),
        },
      },
    );
    await seedDashboardApplication(testPrismaClient, {
      clientName: "Released Long Ago",
      expectedReleaseDate: daysAgo(8),
      staff: {
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.RELEASED,
        updatedAt: daysAgo(30),
      },
    });

    const result = await listForStaff({
      ...baseInput,
      filters: { stage: [APPLICATION_STAGE.CLOSED] },
    });

    expect(result.items.map((item) => item.id)).toEqual([released.id]);
  });

  it("returns dashboard summary fields only", async () => {
    const { application } = await seedDashboardApplication(testPrismaClient, {
      lastActivityAt: daysAgo(1),
    });

    const result = await listForStaff();

    expect(result.items).toEqual([
      {
        id: application.id,
        clientName: DEFAULT_CLIENT_NAME,
        expectedReleaseDate: DEFAULT_EXPECTED_RELEASE_DATE,
        idocNumber: DEFAULT_IDOC_NUMBER,
        stage: ApplicationStage.APPLICATION,
        subStage: ApplicationSubStage.PROVIDER_REVIEW,
        status: ApplicationStatus.WAITING,
        intakeStatus: ApplicationIntakeStatus.DRAFT,
        closedOutcome: null,
        closedOutcomeNote: null,
        releaseTaskProgress: null,
        lastUpdatedAt: expect.any(Date),
        lastUpdatedStatus: null,
      },
    ]);
    // Application form payload and match results are not dashboard data.
    expect(result.items[0]).not.toHaveProperty("formData");
    expect(result.items[0]).not.toHaveProperty("eligibleProviders");
    expect(result.items[0]).not.toHaveProperty("providerApplicationId");
  });

  it("returns release task progress for release-stage rows", async () => {
    await seedDashboardApplication(testPrismaClient, {
      lastActivityAt: daysAgo(1),
      staff: {
        stage: ApplicationStage.RELEASE,
        subStage: ApplicationSubStage.OFFERS_RECEIVED,
      },
      homePlan: { completedReleaseTaskCount: 2 },
    });

    const result = await listForStaff();

    expect(result.items[0]?.releaseTaskProgress).toEqual({
      completedCount: 2,
      totalCount: 7,
    });
  });

  it("flags NEW_UPDATES when another user's event landed after the viewer's last modal open", async () => {
    await seedDashboardApplication(testPrismaClient, {
      lastActivityAt: daysAgo(1),
      staffReadState: { lastOpenedModalAt: daysAgo(2) },
      timelineEvents: [
        { actorPseudonymizedId: OTHER_ACTOR, createdAt: daysAgo(1) },
      ],
    });

    const result = await listForStaff();

    expect(result.items[0]?.lastUpdatedStatus).toBe(
      APPLICATION_LAST_UPDATED_STATUS.NEW_UPDATES,
    );
  });

  it("does not flag NEW_UPDATES for the viewer's own events", async () => {
    await seedDashboardApplication(testPrismaClient, {
      lastActivityAt: daysAgo(1),
      timelineEvents: [
        {
          actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
          createdAt: daysAgo(1),
        },
      ],
    });

    const result = await listForStaff();

    expect(result.items[0]?.lastUpdatedStatus).toBeNull();
  });

  it("flags NO_UPDATES_30D when lastActivityAt is stale and there are no new events", async () => {
    await seedDashboardApplication(testPrismaClient, {
      lastActivityAt: daysAgo(31),
    });

    const result = await listForStaff();

    expect(result.items[0]?.lastUpdatedStatus).toBe(
      APPLICATION_LAST_UPDATED_STATUS.NO_UPDATES_30D,
    );
  });

  it("keeps a stale application the staff member has not opened out of the No Updates (30d) bucket", async () => {
    await seedDashboardApplication(testPrismaClient, {
      lastActivityAt: daysAgo(31),
      timelineEvents: [
        { actorPseudonymizedId: OTHER_ACTOR, createdAt: daysAgo(31) },
      ],
    });

    const result = await listForStaff(noUpdatesInput);

    expect(result.items).toEqual([]);
  });

  it("puts it in that bucket once the staff member's own read lands", async () => {
    const { application } = await seedDashboardApplication(testPrismaClient, {
      lastActivityAt: daysAgo(31),
      staffReadState: { lastOpenedModalAt: daysAgo(1) },
      timelineEvents: [
        { actorPseudonymizedId: OTHER_ACTOR, createdAt: daysAgo(31) },
      ],
    });

    const result = await listForStaff(noUpdatesInput);

    expect(result.items.map((item) => item.id)).toEqual([application.id]);
  });
});

describe("getProviderApplications", () => {
  function seedProviderRow(
    options: Parameters<typeof seedDashboardApplication>[1] = {},
  ) {
    return seedDashboardApplication(testPrismaClient, {
      lastActivityAt: daysAgo(1),
      provider: { providerId: housingProviderId },
      ...options,
    });
  }

  it("excludes another provider's applications from the active provider's queue", async () => {
    const { application } = await seedProviderRow();
    const { application: otherApplication } = await seedDashboardApplication(
      testPrismaClient,
      {
        clientName: "Someone Else's Client",
        lastActivityAt: daysAgo(1),
        provider: { providerId: otherHousingProviderId },
      },
    );

    const result = await listForProvider();

    expect(result.items.map((item) => item.id)).not.toContain(
      otherApplication.id,
    );
    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual([application.id]);
  });

  it("excludes the first provider's applications when acting as the second", async () => {
    const { application: ownApplication } = await seedProviderRow();
    const { application: otherApplication } = await seedDashboardApplication(
      testPrismaClient,
      {
        clientName: "Someone Else's Client",
        lastActivityAt: daysAgo(1),
        provider: { providerId: otherHousingProviderId },
      },
    );

    const result = await listForProvider(baseInput, otherHousingProviderId);

    expect(result.items.map((item) => item.id)).not.toContain(
      ownApplication.id,
    );
    expect(result.items.map((item) => item.id)).toEqual([otherApplication.id]);
  });

  function seedClosedProviderRow(closedAt: Date) {
    return seedProviderRow({
      clientName: "Closed Client",
      expectedReleaseDate: null,
      provider: {
        providerId: housingProviderId,
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.DECLINED,
        updatedAt: closedAt,
      },
    });
  }

  it("hides a stale closed case even when the provider filters explicitly to Closed", async () => {
    await seedClosedProviderRow(daysAgo(30));

    const result = await listForProvider({
      ...baseInput,
      filters: { stage: [APPLICATION_STAGE.CLOSED] },
    });

    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });

  it("still shows a recently closed case under the same Closed filter", async () => {
    const { application } = await seedClosedProviderRow(daysAgo(2));

    const result = await listForProvider({
      ...baseInput,
      filters: { stage: [APPLICATION_STAGE.CLOSED] },
    });

    expect(result.items.map((item) => item.id)).toEqual([application.id]);
  });

  it("returns dashboard summary fields only", async () => {
    const { application, providerApplication } = await seedProviderRow();

    const result = await listForProvider();

    expect(result.items).toEqual([
      {
        id: application.id,
        clientName: DEFAULT_CLIENT_NAME,
        expectedReleaseDate: DEFAULT_EXPECTED_RELEASE_DATE,
        idocNumber: DEFAULT_IDOC_NUMBER,
        stage: ApplicationStage.APPLICATION,
        subStage: ApplicationSubStage.PROVIDER_REVIEW,
        status: ApplicationStatus.ACTION_NEEDED,
        releaseTaskProgress: null,
        lastUpdatedAt: expect.any(Date),
        lastUpdatedStatus: null,
        providerApplicationId: providerApplication?.id,
        isSelectedProvider: false,
        alerts: [],
      },
    ]);
    // Staff-only fields must never reach a provider.
    expect(result.items[0]).not.toHaveProperty("intakeStatus");
    expect(result.items[0]).not.toHaveProperty("closedOutcome");
    expect(result.items[0]).not.toHaveProperty("closedOutcomeNote");
    expect(result.items[0]).not.toHaveProperty("formData");
    expect(result.items[0]).not.toHaveProperty("eligibleProviders");
  });

  it("flags NEW_UPDATES from another user's event this provider can see", async () => {
    await seedProviderRow({
      providerReadState: { lastOpenedModalAt: daysAgo(2) },
      timelineEvents: [
        { actorPseudonymizedId: OTHER_ACTOR, createdAt: daysAgo(1) },
      ],
    });

    const result = await listForProvider();

    expect(result.items[0]?.lastUpdatedStatus).toBe(
      APPLICATION_LAST_UPDATED_STATUS.NEW_UPDATES,
    );
  });

  it("drops the last-updated status once the provider's match closed without them", async () => {
    await seedProviderRow({
      provider: {
        providerId: housingProviderId,
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.DECLINED,
      },
      timelineEvents: [
        { actorPseudonymizedId: OTHER_ACTOR, createdAt: daysAgo(1) },
      ],
    });

    const result = await listForProvider({
      ...baseInput,
      filters: { stage: [APPLICATION_STAGE.CLOSED] },
    });

    expect(result.items[0]?.lastUpdatedStatus).toBeNull();
  });

  it("ignores cmOnly events when flagging NEW_UPDATES", async () => {
    await seedProviderRow({
      timelineEvents: [
        {
          actorPseudonymizedId: OTHER_ACTOR,
          createdAt: daysAgo(1),
          cmOnly: true,
        },
      ],
    });

    const result = await listForProvider();

    expect(result.items[0]?.lastUpdatedStatus).toBeNull();
  });

  it("ignores events scoped to a different provider when flagging NEW_UPDATES", async () => {
    const { application } = await seedProviderRow();
    const other = await seedDashboardApplication(testPrismaClient, {
      clientName: "Other Client",
      provider: { providerId: otherHousingProviderId },
      timelineEvents: [
        {
          actorPseudonymizedId: OTHER_ACTOR,
          createdAt: daysAgo(1),
          scopedToProvider: true,
        },
      ],
    });

    // Sanity check: the event exists, it just belongs to the other organization.
    expect(other.providerApplication).toBeDefined();

    const result = await listForProvider();

    expect(result.items.map((item) => item.id)).toEqual([application.id]);
    expect(result.items[0]?.lastUpdatedStatus).toBeNull();
  });

  it("keeps a stale application nobody at the provider has opened out of the No Updates (30d) bucket", async () => {
    await seedProviderRow({
      lastActivityAt: daysAgo(31),
      timelineEvents: [
        { actorPseudonymizedId: OTHER_ACTOR, createdAt: daysAgo(31) },
      ],
    });

    const result = await listForProvider(noUpdatesInput);

    expect(result.items).toEqual([]);
  });

  it("puts it in that bucket once any colleague at the provider has opened it", async () => {
    const { application } = await seedProviderRow({
      lastActivityAt: daysAgo(31),
      providerReadState: { lastOpenedModalAt: daysAgo(1) },
      timelineEvents: [
        { actorPseudonymizedId: OTHER_ACTOR, createdAt: daysAgo(31) },
      ],
    });

    const result = await listForProvider(noUpdatesInput);

    expect(result.items.map((item) => item.id)).toEqual([application.id]);
  });

  it("does not let another provider's read move this one into that bucket", async () => {
    await seedProviderRow({
      lastActivityAt: daysAgo(31),
      timelineEvents: [
        { actorPseudonymizedId: OTHER_ACTOR, createdAt: daysAgo(31) },
      ],
    });
    const { application: othersApplication } = await seedDashboardApplication(
      testPrismaClient,
      {
        clientName: "Someone Else's Client",
        lastActivityAt: daysAgo(31),
        provider: { providerId: otherHousingProviderId },
        providerReadState: { lastOpenedModalAt: daysAgo(1) },
      },
    );

    const result = await listForProvider(noUpdatesInput);

    expect(result.items.map((item) => item.id)).not.toContain(
      othersApplication.id,
    );
    expect(result.items).toEqual([]);
  });

  describe("a provider closed out of the application", () => {
    // Inside the 7-day closed-case window: a match closed longer ago than that
    // leaves the dashboard entirely (buildClosedCaseDashboardVisibilityWhere),
    // and a row that is not returned cannot show whether its date was frozen.
    const closedOutAt = daysAgo(3);

    function seedClosedOutRow(
      subStage: ApplicationSubStage,
      lastActivityAt = daysAgo(1),
    ) {
      return seedProviderRow({
        // The case keeps moving without them.
        lastActivityAt,
        provider: {
          providerId: housingProviderId,
          stage: ApplicationStage.CLOSED,
          subStage,
          updatedAt: closedOutAt,
        },
      });
    }

    it.each([
      ApplicationSubStage.CANCELED,
      ApplicationSubStage.NOT_SELECTED,
      ApplicationSubStage.DECLINED,
    ])(
      "freezes lastUpdatedAt at their own closure when closed as %s",
      async (subStage) => {
        await seedClosedOutRow(subStage);

        const result = await listForProvider();

        // Not the case-wide lastActivityAt, which is a day old.
        expect(result.items[0].lastUpdatedAt).toEqual(closedOutAt);
        // Consistent with the badge the same state already suppresses.
        expect(result.items[0].lastUpdatedStatus).toBeNull();
      },
    );

    it("still reports case-wide activity to a provider who won the application", async () => {
      const activeAt = daysAgo(1);
      await seedProviderRow({
        lastActivityAt: activeAt,
        provider: {
          providerId: housingProviderId,
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.RELEASED,
          updatedAt: closedOutAt,
        },
      });

      // RELEASED is absent from the closed-out list, so the clamp must not
      // fire even though the match itself is CLOSED.

      const result = await listForProvider();

      expect(result.items[0].lastUpdatedAt).toEqual(activeAt);
    });

    it("still reports case-wide activity while the match is open", async () => {
      const activeAt = daysAgo(1);
      await seedProviderRow({ lastActivityAt: activeAt });

      const result = await listForProvider();

      expect(result.items[0].lastUpdatedAt).toEqual(activeAt);
    });

    it("is dropped from the recent bucket its case-wide activity would match", async () => {
      // Activity a day old, so without the exclusion the row answers
      // "updated in the past 7 days" on work done after they were cut off.
      const { application } = await seedClosedOutRow(
        ApplicationSubStage.NOT_SELECTED,
      );

      const unfiltered = await listForProvider();
      const recent = await listForProvider({
        ...baseInput,
        filters: {
          lastUpdated: [APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D],
        },
      });

      // Guards the assertion below: a row hidden by the closed-case window
      // would leave `recent` empty for an unrelated reason.
      expect(unfiltered.items.map((item) => item.id)).toEqual([application.id]);
      expect(recent.items).toEqual([]);
    });

    it("is dropped from the stale bucket its case-wide activity would match", async () => {
      const { application } = await seedClosedOutRow(
        ApplicationSubStage.CANCELED,
        daysAgo(45),
      );

      const unfiltered = await listForProvider();
      const stale = await listForProvider(noUpdatesInput);

      expect(unfiltered.items.map((item) => item.id)).toEqual([application.id]);
      expect(stale.items).toEqual([]);
    });
  });

  describe("Home Plan filter", () => {
    it("shows only clients where this provider is the selected Home Plan provider", async () => {
      const { application: selected } = await seedProviderRow({
        clientName: "Selected Home Plan Client",
      });
      await createHousingApplicationHomePlan(testPrismaClient, {
        applicationId: selected.id,
        type: HomePlanType.PROVIDER,
        selectedProviderId: housingProviderId,
      });

      const { application: notSelected } = await seedProviderRow({
        clientName: "No Home Plan Client",
      });

      const { application: otherProviderSelected } = await seedProviderRow({
        clientName: "Other Provider's Home Plan Client",
      });
      await createHousingApplicationHomePlan(testPrismaClient, {
        applicationId: otherProviderSelected.id,
        type: HomePlanType.PROVIDER,
        selectedProviderId: otherHousingProviderId,
      });

      const result = await listForProvider({
        ...baseInput,
        filters: { homePlan: true },
      });

      expect(result.items.map((item) => item.id)).toEqual([selected.id]);
      expect(result.items.map((item) => item.id)).not.toContain(notSelected.id);
      expect(result.items.map((item) => item.id)).not.toContain(
        otherProviderSelected.id,
      );
    });

    it("combines with the Stage filter as OR, not AND", async () => {
      const { application: matchesStageOnly } = await seedProviderRow({
        clientName: "Matches Stage Only",
        provider: {
          providerId: housingProviderId,
          stage: ApplicationStage.APPLICATION,
        },
      });
      const { application: matchesHomePlanOnly } = await seedProviderRow({
        clientName: "Matches Home Plan Only",
        provider: {
          providerId: housingProviderId,
          stage: ApplicationStage.RELEASE,
        },
      });
      await createHousingApplicationHomePlan(testPrismaClient, {
        applicationId: matchesHomePlanOnly.id,
        type: HomePlanType.PROVIDER,
        selectedProviderId: housingProviderId,
      });
      const { application: matchesNeither } = await seedProviderRow({
        clientName: "Matches Neither",
        provider: {
          providerId: housingProviderId,
          stage: ApplicationStage.RELEASE,
        },
      });

      const result = await listForProvider({
        ...baseInput,
        filters: { stage: [APPLICATION_STAGE.APPLICATION], homePlan: true },
      });

      expect(result.items.map((item) => item.id).sort()).toEqual(
        [matchesStageOnly.id, matchesHomePlanOnly.id].sort(),
      );
      expect(result.items.map((item) => item.id)).not.toContain(
        matchesNeither.id,
      );
    });

    it("returns every client when the filter is off", async () => {
      const { application: selected } = await seedProviderRow({
        clientName: "Selected Home Plan Client",
      });
      await createHousingApplicationHomePlan(testPrismaClient, {
        applicationId: selected.id,
        type: HomePlanType.PROVIDER,
        selectedProviderId: housingProviderId,
      });
      const { application: notSelected } = await seedProviderRow({
        clientName: "No Home Plan Client",
      });

      const result = await listForProvider();

      expect(result.items.map((item) => item.id).sort()).toEqual(
        [selected.id, notSelected.id].sort(),
      );
    });

    it("is ignored on the staff dashboard, which has no single viewer provider", async () => {
      const { application } = await seedDashboardApplication(testPrismaClient, {
        clientName: "Staff's Client",
      });

      const result = await listForStaff({
        ...baseInput,
        filters: { homePlan: true },
      });

      expect(result.items.map((item) => item.id)).toEqual([application.id]);
    });
  });
});
