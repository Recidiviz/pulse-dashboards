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

import { TimelineActorRole } from "~@idaho-th/prisma/client";
import {
  listEligibleProviderUserPage,
  listProviderUsersNeedingDigestPage,
} from "~@idaho-th/trpc/intercom/intercom.helper";
import {
  createHousingApplicationTimelineEvent,
  createHousingProviderUser,
  createHousingProviderUserAssignment,
  seedApplicationWithProviders,
  TEST_STAFF_PSEUDONYMIZED_ID,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

/**
 * Two people at one organization with one unread event between them, differing
 * only by `digestEnabled` — the flag the login flow decides once and an opt-out
 * never gives back.
 */
async function seedPeopleWithUnreadEvent() {
  const { application, providers } = await seedApplicationWithProviders(
    testPrismaClient,
    { providers: [{}] },
  );
  const [housingProvider] = providers;

  await createHousingApplicationTimelineEvent(testPrismaClient, {
    applicationId: application.id,
    cmOnly: false,
    actorRole: TimelineActorRole.STAFF,
    actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
  });

  const [enabled, optedOut] = await Promise.all(
    [true, false].map((digestEnabled) =>
      createHousingProviderUser(testPrismaClient, {
        name: "Jane Doe",
        email: `${uniqueId("person")}@example.com`,
        pseudonymizedId: uniqueId("person-pseudo"),
        digestEnabled,
      }),
    ),
  );

  await Promise.all(
    [enabled, optedOut].map((user) =>
      createHousingProviderUserAssignment(testPrismaClient, {
        providerUserId: user.id,
        providerId: housingProvider.provider.id,
      }),
    ),
  );

  return { enabled, optedOut };
}

describe("listProviderUsersNeedingDigestPage", () => {
  test("excludes a person who has never logged in", async () => {
    const { enabled } = await seedPeopleWithUnreadEvent();

    const rows = await listProviderUsersNeedingDigestPage(testPrismaClient);

    expect(rows.map((row) => row.id)).toEqual([enabled.id]);
  });

  test("includes that same person once digests are enabled", async () => {
    const { enabled, optedOut } = await seedPeopleWithUnreadEvent();

    await testPrismaClient.housingProviderUser.update({
      where: { id: optedOut.id },
      data: { digestEnabled: true },
    });

    const rows = await listProviderUsersNeedingDigestPage(testPrismaClient);

    expect(rows.map((row) => row.id).sort()).toEqual(
      [enabled.id, optedOut.id].sort(),
    );
  });
});

describe("listEligibleProviderUserPage", () => {
  test("still syncs a contact for the person who has never logged in", async () => {
    const { enabled, optedOut } = await seedPeopleWithUnreadEvent();

    const rows = await listEligibleProviderUserPage(testPrismaClient);

    expect(rows.map((row) => row.id).sort()).toEqual(
      [enabled.id, optedOut.id].sort(),
    );
  });
});
