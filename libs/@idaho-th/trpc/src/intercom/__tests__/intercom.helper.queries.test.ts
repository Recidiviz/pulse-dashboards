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

import type { HousingProvider } from "~@idaho-th/prisma/client";
import {
  listEligibleProviderUserPage,
  listProviderUsersNeedingDigestPage,
  listStaffNeedingDigestPage,
  markProviderUserDigestSent,
  markStaffDigestSent,
  setProviderUserIntercomSync,
  setProviderUsersIntercomSyncBatch,
  setStaffIntercomSync,
} from "~@idaho-th/trpc/intercom/intercom.helper";
import {
  createHousingApplication,
  createHousingApplicationTimelineEvent,
  createHousingProvider,
  createHousingProviderLocation,
  createHousingProviderUser,
  createHousingProviderUserAssignment,
  createProviderHousingApplication,
  createProviderTimelineReadState,
  createStaffHousingApplication,
  createStaffTimelineReadState,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

const STAFF_EMAIL = "staff@example.com";

// Fixed and ordered so a read always lands after the event it suppresses, and
// the digest-day gate is decided by the seed rather than by wall-clock skew.
// dayStart for NOW is 2026-09-01T06:00Z (midnight America/Denver).
const EVENT_AT = new Date("2026-09-01T12:00:00.000Z");
const READ_AT = new Date("2026-09-01T13:00:00.000Z");
const NOW = new Date("2026-09-01T18:00:00.000Z");
const SENT_TODAY = new Date("2026-09-01T17:00:00.000Z");
const SENT_BEFORE_TODAY = new Date("2026-08-30T17:00:00.000Z");

type ProviderUserOverrides = {
  email?: string;
  name?: string;
  pseudonymizedId?: string | null;
  digestEnabled?: boolean;
  lastDigestSentAt?: Date | null;
  intercomSyncedAt?: Date | null;
};

/** A person who can sign in to the portal, assigned to nothing yet. */
function createProviderUser(overrides: ProviderUserOverrides = {}) {
  return createHousingProviderUser(testPrismaClient, {
    name: "Jane Doe",
    email: `${uniqueId("person")}@example.com`,
    pseudonymizedId: uniqueId("person-pseudo"),
    digestEnabled: true,
    ...overrides,
  });
}

/**
 * An organization with one application sent to it and one timeline event on
 * that application — the unread activity a digest nudges about. Nobody is
 * assigned to it; callers add the people.
 */
async function seedHousingProviderWithActivity({
  actorPseudonymizedId = null,
  cmOnly = false,
  scopedProviderId = null,
}: {
  actorPseudonymizedId?: string | null;
  cmOnly?: boolean;
  scopedProviderId?: string | null;
} = {}) {
  const housingProvider = await createHousingProvider(testPrismaClient);
  const location = await createHousingProviderLocation(testPrismaClient, {
    providerId: housingProvider.id,
  });
  const application = await createHousingApplication(testPrismaClient);
  await createProviderHousingApplication(testPrismaClient, {
    applicationId: application.id,
    providerId: housingProvider.id,
    providerLocationId: location.id,
  });
  await createHousingApplicationTimelineEvent(testPrismaClient, {
    applicationId: application.id,
    createdAt: EVENT_AT,
    cmOnly,
    actorPseudonymizedId,
    scopedProviderId,
  });
  return { housingProvider, applicationId: application.id };
}

function assign(providerUserId: string, housingProvider: HousingProvider) {
  return createHousingProviderUserAssignment(testPrismaClient, {
    providerUserId,
    providerId: housingProvider.id,
  });
}

/** The common case: one person, one organization, one unread event. */
async function seedPersonNeedingDigest(overrides: ProviderUserOverrides = {}) {
  const user = await createProviderUser(overrides);
  const { housingProvider, applicationId } =
    await seedHousingProviderWithActivity();
  await assign(user.id, housingProvider);
  return { user, housingProvider, applicationId };
}

function digestPage(pageSize = 50, cursorId?: string) {
  return listProviderUsersNeedingDigestPage(
    testPrismaClient,
    pageSize,
    cursorId,
    NOW,
  );
}

async function seedStaffNeedingDigest({
  email = STAFF_EMAIL,
  pseudonymizedId = "staff-digest-1",
  lastDigestSentAt = null as Date | null,
}: {
  email?: string;
  pseudonymizedId?: string;
  lastDigestSentAt?: Date | null;
} = {}) {
  const staff = await testPrismaClient.housingStaff.create({
    data: { email, pseudonymizedId, lastDigestSentAt },
  });
  const application = await createHousingApplication(testPrismaClient);
  await createStaffHousingApplication(testPrismaClient, {
    applicationId: application.id,
    staffPseudonymizedId: pseudonymizedId,
  });
  await createHousingApplicationTimelineEvent(testPrismaClient, {
    applicationId: application.id,
    createdAt: EVENT_AT,
  });
  return { staff, applicationId: application.id };
}

describe("listEligibleProviderUserPage", () => {
  it("excludes a person with an empty email", async () => {
    const reachable = await createProviderUser();
    await createProviderUser({ email: "" });

    await expect(
      listEligibleProviderUserPage(testPrismaClient),
    ).resolves.toEqual([expect.objectContaining({ id: reachable.id })]);
  });

  // Contact sync is deliberately wider than digest eligibility: the contact is
  // ready before the person's first login, and before anyone assigns them.
  it("includes a person who has no assignment and no digest preference", async () => {
    const unassigned = await createProviderUser({ digestEnabled: false });

    await expect(
      listEligibleProviderUserPage(testPrismaClient),
    ).resolves.toEqual([expect.objectContaining({ id: unassigned.id })]);
  });

  it("carries the person's own name and email", async () => {
    const person = await createProviderUser({
      name: "John Doe",
      email: "john.doe@example.com",
    });
    // The organization's name must not reach the contact.
    const { housingProvider } = await seedHousingProviderWithActivity();
    await assign(person.id, housingProvider);

    await expect(
      listEligibleProviderUserPage(testPrismaClient),
    ).resolves.toEqual([
      expect.objectContaining({
        name: "John Doe",
        email: "john.doe@example.com",
      }),
    ]);
  });

  it("filters to unsynced people when asked", async () => {
    const unsynced = await createProviderUser();
    await createProviderUser({ intercomSyncedAt: NOW });

    await expect(
      listEligibleProviderUserPage(testPrismaClient, 100, undefined, true),
    ).resolves.toEqual([expect.objectContaining({ id: unsynced.id })]);
  });

  /**
   * The regression the function's own comment describes: the walk marks rows
   * synced as it goes, so the cursor row leaves the filtered set. Positional
   * paging would skip rows; keyset paging must visit each exactly once.
   */
  it("visits every eligible person exactly once while marking them synced", async () => {
    const total = 7;
    const pageSize = 2;
    for (let i = 0; i < total; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- seeded in id order
      await createProviderUser();
    }

    const visits = new Map<string, number>();
    let cursorId: string | undefined;
    for (;;) {
      // eslint-disable-next-line no-await-in-loop -- the walk is sequential
      const page = await listEligibleProviderUserPage(
        testPrismaClient,
        pageSize,
        cursorId,
        true,
      );
      if (page.length === 0) break;

      for (const row of page) {
        visits.set(row.id, (visits.get(row.id) ?? 0) + 1);
        // Marking rows synced mid-walk is the condition this test exercises.
        // eslint-disable-next-line no-await-in-loop
        await setProviderUserIntercomSync(testPrismaClient, row.id, {
          intercomContactId: `contact-${row.id}`,
        });
      }
      cursorId = page.at(-1)?.id;
    }

    expect(visits.size).toBe(total);
    expect([...visits.values()]).toEqual(
      Array.from({ length: total }, () => 1),
    );
  });

  it("takes at most pageSize rows and starts after the cursor", async () => {
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- seeded in id order
      await createProviderUser();
    }

    const first = await listEligibleProviderUserPage(testPrismaClient, 2);
    expect(first).toHaveLength(2);

    const second = await listEligibleProviderUserPage(
      testPrismaClient,
      2,
      first.at(-1)?.id,
    );
    expect(second).toHaveLength(1);
    expect(second[0]?.id).not.toBe(first[0]?.id);
  });
});

describe("listProviderUsersNeedingDigestPage", () => {
  it("returns the person, addressed by their own name and email", async () => {
    const user = await createProviderUser({
      name: "John Doe",
      email: "john.doe@example.com",
    });
    const { housingProvider } = await seedHousingProviderWithActivity();
    await assign(user.id, housingProvider);

    await expect(digestPage()).resolves.toEqual([
      expect.objectContaining({
        id: user.id,
        name: "John Doe",
        email: "john.doe@example.com",
      }),
    ]);
  });

  // The whole traversal in one assertion: without an assignment there is no
  // path from the person to the organization's activity.
  it("excludes a person who manages no provider, however busy it is", async () => {
    await createProviderUser();
    await seedHousingProviderWithActivity();

    await expect(digestPage()).resolves.toEqual([]);
  });

  it("excludes a person assigned only to a quiet provider", async () => {
    const user = await createProviderUser();
    const quiet = await createHousingProvider(testPrismaClient);
    await assign(user.id, quiet);
    // A busy organization they are not assigned to must not qualify them.
    await seedHousingProviderWithActivity();

    await expect(digestPage()).resolves.toEqual([]);
  });

  it("never counts a cmOnly event as unread", async () => {
    const user = await createProviderUser();
    const { housingProvider } = await seedHousingProviderWithActivity({
      cmOnly: true,
    });
    await assign(user.id, housingProvider);

    await expect(digestPage()).resolves.toEqual([]);
  });

  it("never counts an event scoped to a different provider", async () => {
    const other = await createHousingProvider(testPrismaClient);
    const user = await createProviderUser();
    const { housingProvider } = await seedHousingProviderWithActivity({
      scopedProviderId: other.id,
    });
    await assign(user.id, housingProvider);

    await expect(digestPage()).resolves.toEqual([]);
  });

  it("excludes a person who has opted out of digests", async () => {
    await seedPersonNeedingDigest({ digestEnabled: false });

    await expect(digestPage()).resolves.toEqual([]);
  });

  it("excludes a person already sent today's digest", async () => {
    await seedPersonNeedingDigest({ lastDigestSentAt: SENT_TODAY });

    await expect(digestPage()).resolves.toEqual([]);
  });

  it("includes a person whose last digest predates today", async () => {
    const { user } = await seedPersonNeedingDigest({
      lastDigestSentAt: SENT_BEFORE_TODAY,
    });

    await expect(digestPage()).resolves.toEqual([
      expect.objectContaining({ id: user.id }),
    ]);
  });

  it("gives a person with activity at two providers exactly one digest that day", async () => {
    const user = await createProviderUser();
    const first = await seedHousingProviderWithActivity();
    const second = await seedHousingProviderWithActivity();
    await assign(user.id, first.housingProvider);
    await assign(user.id, second.housingProvider);

    const rows = await digestPage();
    expect(rows).toEqual([expect.objectContaining({ id: user.id })]);

    // And the day is spent: the second organization cannot earn a second email.
    await markProviderUserDigestSent(testPrismaClient, user.id, NOW);
    await expect(digestPage()).resolves.toEqual([]);
  });

  it("does not nudge the author of an event while their colleagues still are", async () => {
    const author = await createProviderUser({ name: "Jane Doe" });
    const colleague = await createProviderUser({ name: "John Doe" });
    const { housingProvider } = await seedHousingProviderWithActivity({
      actorPseudonymizedId: author.pseudonymizedId,
    });
    await assign(author.id, housingProvider);
    await assign(colleague.id, housingProvider);

    await expect(digestPage()).resolves.toEqual([
      expect.objectContaining({ id: colleague.id }),
    ]);
  });

  it("lets one colleague's read suppress the nudge for everyone at that provider", async () => {
    const reader = await createProviderUser();
    const colleague = await createProviderUser();
    const { housingProvider, applicationId } =
      await seedHousingProviderWithActivity();
    await assign(reader.id, housingProvider);
    await assign(colleague.id, housingProvider);
    expect(await digestPage()).toHaveLength(2);

    await createProviderTimelineReadState(testPrismaClient, {
      applicationId,
      providerId: housingProvider.id,
      providerUserId: reader.id,
      lastOpenedModalAt: READ_AT,
    });

    await expect(digestPage()).resolves.toEqual([]);
  });

  it("keeps a colleague's read at one provider from suppressing another", async () => {
    const user = await createProviderUser();
    const read = await seedHousingProviderWithActivity();
    const unread = await seedHousingProviderWithActivity();
    await assign(user.id, read.housingProvider);
    await assign(user.id, unread.housingProvider);

    await createProviderTimelineReadState(testPrismaClient, {
      applicationId: read.applicationId,
      providerId: read.housingProvider.id,
      providerUserId: user.id,
      lastOpenedModalAt: READ_AT,
    });

    await expect(digestPage()).resolves.toEqual([
      expect.objectContaining({ id: user.id }),
    ]);
  });

  // The split keeps the two audiences apart: a case manager opening the
  // timeline writes staff read state only, and must not silence the provider.
  it("is unaffected by a staff member's read of the same timeline", async () => {
    const { user, applicationId } = await seedPersonNeedingDigest();
    await createStaffTimelineReadState(testPrismaClient, {
      applicationId,
      staffPseudonymizedId: "staff-1",
      lastOpenedModalAt: READ_AT,
    });

    await expect(digestPage()).resolves.toEqual([
      expect.objectContaining({ id: user.id }),
    ]);
  });

  it("walks pages by keyset cursor", async () => {
    await seedPersonNeedingDigest();
    await seedPersonNeedingDigest();

    const first = await digestPage(1);
    expect(first).toHaveLength(1);

    const second = await digestPage(1, first[0]?.id);
    expect(second).toHaveLength(1);
    expect(second[0]?.id).not.toBe(first[0]?.id);
  });
});

describe("listStaffNeedingDigestPage", () => {
  it("returns a staff member with an unread event", async () => {
    const { staff } = await seedStaffNeedingDigest();

    await expect(
      listStaffNeedingDigestPage(testPrismaClient, 50, undefined, NOW),
    ).resolves.toEqual([
      expect.objectContaining({
        id: staff.id,
        email: STAFF_EMAIL,
        // The staff query has no name column to select.
        name: null,
      }),
    ]);
  });

  it("excludes a staff member already sent today's digest", async () => {
    await seedStaffNeedingDigest({ lastDigestSentAt: SENT_TODAY });

    await expect(
      listStaffNeedingDigestPage(testPrismaClient, 50, undefined, NOW),
    ).resolves.toEqual([]);
  });

  it("excludes a staff member who has already opened the timeline", async () => {
    const { staff, applicationId } = await seedStaffNeedingDigest();
    await createStaffTimelineReadState(testPrismaClient, {
      applicationId,
      staffPseudonymizedId: staff.pseudonymizedId,
      lastOpenedModalAt: READ_AT,
    });

    await expect(
      listStaffNeedingDigestPage(testPrismaClient, 50, undefined, NOW),
    ).resolves.toEqual([]);
  });

  // The mirror of the provider case: a provider's read lives in its own table
  // and must leave the staff nudge standing.
  it("is unaffected by a housing provider's read of the same timeline", async () => {
    const { staff, applicationId } = await seedStaffNeedingDigest();
    const housingProvider = await createHousingProvider(testPrismaClient);
    await createProviderTimelineReadState(testPrismaClient, {
      applicationId,
      providerId: housingProvider.id,
      lastOpenedModalAt: READ_AT,
    });

    await expect(
      listStaffNeedingDigestPage(testPrismaClient, 50, undefined, NOW),
    ).resolves.toEqual([expect.objectContaining({ id: staff.id })]);
  });

  it("never counts a staff member's own event as unread", async () => {
    const { staff, applicationId } = await seedStaffNeedingDigest();
    await testPrismaClient.housingApplicationTimelineEvent.deleteMany({
      where: { applicationId },
    });
    await createHousingApplicationTimelineEvent(testPrismaClient, {
      applicationId,
      createdAt: EVENT_AT,
      actorPseudonymizedId: staff.pseudonymizedId,
    });

    await expect(
      listStaffNeedingDigestPage(testPrismaClient, 50, undefined, NOW),
    ).resolves.toEqual([]);
  });

  it("walks pages by keyset cursor", async () => {
    await seedStaffNeedingDigest({
      email: "staff-a@example.com",
      pseudonymizedId: "staff-a",
    });
    await seedStaffNeedingDigest({
      email: "staff-b@example.com",
      pseudonymizedId: "staff-b",
    });

    const first = await listStaffNeedingDigestPage(
      testPrismaClient,
      1,
      undefined,
      NOW,
    );
    const second = await listStaffNeedingDigestPage(
      testPrismaClient,
      1,
      first[0]?.id,
      NOW,
    );

    expect(second[0]?.id).not.toBe(first[0]?.id);
  });
});

describe("sync and digest mutators", () => {
  it("updates only the people named in a sync batch", async () => {
    const target = await createProviderUser();
    const bystander = await createProviderUser();

    await setProviderUsersIntercomSyncBatch(
      testPrismaClient,
      [{ providerUserId: target.id, intercomContactId: "contact-1" }],
      NOW,
    );

    await expect(
      testPrismaClient.housingProviderUser.findUnique({
        where: { id: target.id },
        select: { intercomContactId: true, intercomSyncedAt: true },
      }),
    ).resolves.toEqual({
      intercomContactId: "contact-1",
      intercomSyncedAt: NOW,
    });
    await expect(
      testPrismaClient.housingProviderUser.findUnique({
        where: { id: bystander.id },
        select: { intercomContactId: true, intercomSyncedAt: true },
      }),
    ).resolves.toEqual({ intercomContactId: null, intercomSyncedAt: null });
  });

  it("writes nothing for an empty sync batch", async () => {
    const person = await createProviderUser();

    await setProviderUsersIntercomSyncBatch(testPrismaClient, [], NOW);

    await expect(
      testPrismaClient.housingProviderUser.findUnique({
        where: { id: person.id },
        select: { intercomSyncedAt: true },
      }),
    ).resolves.toEqual({ intercomSyncedAt: null });
  });

  it("updates every person named in a multi-row batch", async () => {
    const first = await createProviderUser();
    const second = await createProviderUser();

    await setProviderUsersIntercomSyncBatch(
      testPrismaClient,
      [
        { providerUserId: first.id, intercomContactId: "contact-a" },
        { providerUserId: second.id, intercomContactId: "contact-b" },
      ],
      NOW,
    );

    await expect(
      testPrismaClient.housingProviderUser.findMany({
        where: { id: { in: [first.id, second.id] } },
        select: { id: true, intercomContactId: true },
        orderBy: { intercomContactId: "asc" },
      }),
    ).resolves.toEqual([
      { id: first.id, intercomContactId: "contact-a" },
      { id: second.id, intercomContactId: "contact-b" },
    ]);
  });

  it("marks one person's digest as sent and leaves the rest alone", async () => {
    const target = await createProviderUser();
    const bystander = await createProviderUser();

    await markProviderUserDigestSent(testPrismaClient, target.id, NOW);

    await expect(
      testPrismaClient.housingProviderUser.findUnique({
        where: { id: target.id },
        select: { lastDigestSentAt: true },
      }),
    ).resolves.toEqual({ lastDigestSentAt: NOW });
    await expect(
      testPrismaClient.housingProviderUser.findUnique({
        where: { id: bystander.id },
        select: { lastDigestSentAt: true },
      }),
    ).resolves.toEqual({ lastDigestSentAt: null });
  });

  it("marks one staff member's digest as sent and leaves the rest alone", async () => {
    const target = await testPrismaClient.housingStaff.create({
      data: { email: STAFF_EMAIL, pseudonymizedId: "staff-a" },
    });
    const bystander = await testPrismaClient.housingStaff.create({
      data: { email: "other@example.com", pseudonymizedId: "staff-b" },
    });

    await markStaffDigestSent(testPrismaClient, target.id, NOW);

    await expect(
      testPrismaClient.housingStaff.findUnique({
        where: { id: target.id },
        select: { lastDigestSentAt: true },
      }),
    ).resolves.toEqual({ lastDigestSentAt: NOW });
    await expect(
      testPrismaClient.housingStaff.findUnique({
        where: { id: bystander.id },
        select: { lastDigestSentAt: true },
      }),
    ).resolves.toEqual({ lastDigestSentAt: null });
  });

  it.each([
    ["an explicit timestamp", NOW],
    ["the current time", undefined],
  ])(
    "sets a person's intercom sync with %s",
    async (_label, intercomSyncedAt) => {
      const person = await createProviderUser();

      await setProviderUserIntercomSync(testPrismaClient, person.id, {
        intercomContactId: "contact-1",
        ...(intercomSyncedAt ? { intercomSyncedAt } : {}),
      });

      const row = await testPrismaClient.housingProviderUser.findUnique({
        where: { id: person.id },
        select: { intercomContactId: true, intercomSyncedAt: true },
      });
      expect(row?.intercomContactId).toBe("contact-1");
      expect(row?.intercomSyncedAt).toBeInstanceOf(Date);
    },
  );

  it.each([
    ["an explicit timestamp", NOW],
    ["the current time", undefined],
  ])(
    "sets a staff member's intercom sync with %s",
    async (_label, intercomSyncedAt) => {
      const staff = await testPrismaClient.housingStaff.create({
        data: { email: STAFF_EMAIL, pseudonymizedId: "staff-a" },
      });

      await setStaffIntercomSync(testPrismaClient, staff.id, {
        intercomContactId: "contact-1",
        ...(intercomSyncedAt ? { intercomSyncedAt } : {}),
      });

      const row = await testPrismaClient.housingStaff.findUnique({
        where: { id: staff.id },
        select: { intercomContactId: true, intercomSyncedAt: true },
      });
      expect(row?.intercomContactId).toBe("contact-1");
      expect(row?.intercomSyncedAt).toBeInstanceOf(Date);
    },
  );
});
