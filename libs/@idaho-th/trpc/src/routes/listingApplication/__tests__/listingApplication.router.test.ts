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

import { HOUSING_PROVIDER_REQUIRED_MESSAGE } from "~@idaho-th/shared";
import { providerCaller, staffCaller } from "~@idaho-th/trpc/test/caller";
import {
  createHousingProviderUser,
  createHousingProviderUserAssignment,
  seedProviderUserWithHousingProviders,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedDashboardApplication } from "./listingApplication.fixtures";

describe("listingApplicationRouter", () => {
  // One person at two organizations. providerCaller() must name which one it
  // acts as, so each request is answered from exactly one queue.
  let housingProviderId: string;
  let otherHousingProviderId: string;

  beforeEach(async () => {
    const { housingProviders } = await seedProviderUserWithHousingProviders(
      testPrismaClient,
      {
        housingProviders: [{ name: "Sunrise House" }, { name: "Beta Housing" }],
      },
    );
    housingProviderId = housingProviders[0].id;
    otherHousingProviderId = housingProviders[1].id;
  });

  describe("input validation", () => {
    it("rejects a pageSize above the max page size", async () => {
      await expect(
        staffCaller().housingApplication.getByStaff({
          pagination: { pageSize: 101 },
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a sorting direction that is not asc/desc", async () => {
      await expect(
        staffCaller().housingApplication.getByStaff({
          pagination: { pageSize: 7 },
          sorting: { field: "clientName", direction: "sideways" as never },
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a filters.lastUpdated value that is not a known enum member", async () => {
      await expect(
        providerCaller({
          requestedProviderId: housingProviderId,
        }).housingApplication.getProviderApplications({
          pagination: { pageSize: 7 },
          filters: { lastUpdated: ["NOT_A_STATUS"] as never },
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("getByStaff", () => {
    it("returns applications owned by the requesting staff member", async () => {
      const { application } = await seedDashboardApplication(testPrismaClient);

      const result = await staffCaller().housingApplication.getByStaff({
        pagination: { pageSize: 7 },
      });

      expect(result.items.map((item) => item.id)).toEqual([application.id]);
    });

    it("does not include applications owned by another staff member", async () => {
      await seedDashboardApplication(testPrismaClient, {
        staffPseudonymizedId: "other-staff",
        clientName: "Not Mine",
      });

      const result = await staffCaller().housingApplication.getByStaff({
        pagination: { pageSize: 7 },
      });

      expect(result.items).toEqual([]);
    });
  });

  describe("getProviderApplications", () => {
    function listAs(providerId: string) {
      return providerCaller({
        requestedProviderId: providerId,
      }).housingApplication.getProviderApplications({
        pagination: { pageSize: 7 },
      });
    }

    it("returns applications sent to the provider the caller is acting as", async () => {
      const { application } = await seedDashboardApplication(testPrismaClient, {
        provider: { providerId: housingProviderId },
      });

      const result = await listAs(housingProviderId);

      expect(result.items.map((item) => item.id)).toEqual([application.id]);
    });

    it("omits another provider's applications, in both directions", async () => {
      const { application: own } = await seedDashboardApplication(
        testPrismaClient,
        { provider: { providerId: housingProviderId } },
      );
      const { application: other } = await seedDashboardApplication(
        testPrismaClient,
        {
          clientName: "Someone Else's Client",
          provider: { providerId: otherHousingProviderId },
        },
      );

      const asFirst = await listAs(housingProviderId);
      expect(asFirst.items.map((item) => item.id)).not.toContain(other.id);
      expect(asFirst.items.map((item) => item.id)).toEqual([own.id]);

      const asSecond = await listAs(otherHousingProviderId);
      expect(asSecond.items.map((item) => item.id)).not.toContain(own.id);
      expect(asSecond.items.map((item) => item.id)).toEqual([other.id]);
    });

    it("shows two colleagues at one provider the same queue", async () => {
      const { application } = await seedDashboardApplication(testPrismaClient, {
        provider: { providerId: housingProviderId },
      });
      const colleague = await createHousingProviderUser(testPrismaClient, {
        pseudonymizedId: "provider-colleague",
        name: "John Doe",
      });
      await createHousingProviderUserAssignment(testPrismaClient, {
        providerUserId: colleague.id,
        providerId: housingProviderId,
      });

      const mine = await listAs(housingProviderId);
      const theirs = await providerCaller({
        providerPseudonymizedId: colleague.pseudonymizedId ?? undefined,
        requestedProviderId: housingProviderId,
      }).housingApplication.getProviderApplications({
        pagination: { pageSize: 7 },
      });

      expect(theirs.items.map((item) => item.id)).toEqual([application.id]);
      expect(theirs.items.map((item) => item.id)).toEqual(
        mine.items.map((item) => item.id),
      );
    });

    it("refuses a caller with no assignments rather than showing another provider's rows", async () => {
      const { application } = await seedDashboardApplication(testPrismaClient, {
        provider: { providerId: housingProviderId },
      });
      const unassigned = await createHousingProviderUser(testPrismaClient, {
        pseudonymizedId: "provider-unassigned",
        name: "John Doe",
      });

      await expect(
        providerCaller({
          providerPseudonymizedId: unassigned.pseudonymizedId ?? undefined,
        }).housingApplication.getProviderApplications({
          pagination: { pageSize: 7 },
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: HOUSING_PROVIDER_REQUIRED_MESSAGE,
      });

      // And the row it must not have seen really does exist.
      expect(application.id).toBeDefined();
    });
  });
});
