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
  providerCaller,
  staffCaller,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import {
  createHousingProviderUser,
  createHousingProviderUserAssignment,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedTimelineApplication } from "./timeline.fixtures";

/**
 * An application sent to one organization, with the caller's person assigned to
 * it — the single-assignment world the provider middleware resolves against.
 */
async function seedApplication() {
  const seeded = await seedTimelineApplication(testPrismaClient, {
    providers: [{ name: "Alpha Housing" }],
  });
  const providerId = seeded.providers[0].provider.id;
  const user = await createHousingProviderUser(testPrismaClient);
  await createHousingProviderUserAssignment(testPrismaClient, {
    providerUserId: user.id,
    providerId,
  });

  return { ...seeded, providerId, user };
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

describe("timelineRouter", () => {
  describe("input validation", () => {
    it("rejects an applicationId that is not a uuid", async () => {
      await expect(
        staffCaller().timeline.getForStaff({ applicationId: "not-a-uuid" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("defaults includeProviderNotSelected to false", async () => {
      const { application } = await seedApplication();

      await expect(
        staffCaller().timeline.getForStaff({ applicationId: application.id }),
      ).resolves.toBeDefined();
    });
  });

  describe("getForStaff", () => {
    it("returns the timeline for the owning staff member", async () => {
      const { application } = await seedApplication();

      const timeline = await staffCaller().timeline.getForStaff({
        applicationId: application.id,
      });

      expect(timeline).toMatchObject({ events: expect.any(Array) });
    });

    it("does not expose an application owned by another staff member", async () => {
      const { application } = await seedTimelineApplication(testPrismaClient, {
        staffPseudonymizedId: "some-other-staff",
      });

      await expect(
        staffCaller().timeline.getForStaff({ applicationId: application.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("getForProvider", () => {
    it("returns the timeline for a provider on the application", async () => {
      const { application } = await seedApplication();

      const timeline = await providerCaller().timeline.getForProvider({
        applicationId: application.id,
      });

      expect(timeline).toMatchObject({ events: expect.any(Array) });
    });

    it("does not expose an application sent to a different provider", async () => {
      // The caller's own organization, with nothing on it.
      await seedApplication();
      const { application: othersApplication } = await seedTimelineApplication(
        testPrismaClient,
        { providers: [{ name: "Beta Housing" }] },
      );

      await expect(
        providerCaller().timeline.getForProvider({
          applicationId: othersApplication.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("read-state mutations", () => {
    it("markViewedForStaff records a staff read state and no provider one", async () => {
      const { application, providerId } = await seedApplication();

      await expect(
        staffCaller().timeline.markViewedForStaff({
          applicationId: application.id,
        }),
      ).resolves.toEqual({ success: true });

      await expect(readStaffReadState(application.id)).resolves.not.toBeNull();
      await expect(
        readProviderReadState(application.id, providerId),
      ).resolves.toBeNull();
    });

    it("markModalOpenedForStaff records a staff read state", async () => {
      const { application } = await seedApplication();

      await expect(
        staffCaller().timeline.markModalOpenedForStaff({
          applicationId: application.id,
        }),
      ).resolves.toEqual({ success: true });

      await expect(readStaffReadState(application.id)).resolves.not.toBeNull();
    });

    it("markViewedForProvider records the provider's read, attributed to the caller", async () => {
      const { application, providerId, user } = await seedApplication();

      await expect(
        providerCaller().timeline.markViewedForProvider({
          applicationId: application.id,
        }),
      ).resolves.toEqual({ success: true });

      await expect(
        readProviderReadState(application.id, providerId),
      ).resolves.toMatchObject({ providerUserId: user.id });
      await expect(readStaffReadState(application.id)).resolves.toBeNull();
    });

    it("markModalOpenedForProvider records the provider's read state", async () => {
      const { application, providerId } = await seedApplication();

      await expect(
        providerCaller().timeline.markModalOpenedForProvider({
          applicationId: application.id,
        }),
      ).resolves.toEqual({ success: true });

      await expect(
        readProviderReadState(application.id, providerId),
      ).resolves.not.toBeNull();
    });

    it("lets a colleague's read answer for the whole provider", async () => {
      const { application, providerId } = await seedApplication();
      const colleague = await createHousingProviderUser(testPrismaClient, {
        pseudonymizedId: "provider-colleague",
        name: "John Doe",
      });
      await createHousingProviderUserAssignment(testPrismaClient, {
        providerUserId: colleague.id,
        providerId,
      });

      await providerCaller({
        providerPseudonymizedId: colleague.pseudonymizedId ?? undefined,
        requestedProviderId: providerId,
      }).timeline.markViewedForProvider({ applicationId: application.id });

      // The other colleague never opened it, and still sees it as read.
      await expect(
        providerCaller({
          requestedProviderId: providerId,
        }).timeline.getForProvider({ applicationId: application.id }),
      ).resolves.toMatchObject({
        lastViewedTimelineAt: expect.any(Date),
        newEventCount: 0,
      });
    });
  });
});
