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
import { HOUSING_APPLICATION_NOT_FOUND } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import {
  providerCaller,
  staffCaller,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import {
  createHousingApplication,
  createHousingProviderLocation,
  createHousingProviderUser,
  createHousingProviderUserAssignment,
  createProviderHousingApplication,
  createStaffHousingApplication,
  seedProviderUserWithHousingProviders,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

/** A housing application with a staff owner. Defaults to the test caller's id. */
async function seedStaffOwnedApplication(
  staffPseudonymizedId: string = TEST_STAFF_PSEUDONYMIZED_ID,
) {
  const application = await createHousingApplication(testPrismaClient);
  const staffApplication = await createStaffHousingApplication(
    testPrismaClient,
    { applicationId: application.id, staffPseudonymizedId },
  );

  return { application, staffApplication };
}

/** A housing application matched to an existing organization. */
async function seedProviderOwnedApplication(providerId: string) {
  const application = await createHousingApplication(testPrismaClient);
  const location = await createHousingProviderLocation(testPrismaClient, {
    providerId,
  });
  const providerApplication = await createProviderHousingApplication(
    testPrismaClient,
    {
      applicationId: application.id,
      providerId,
      providerLocationId: location.id,
    },
  );

  return { application, location, providerApplication };
}

describe("applicationDetailRouter", () => {
  // One person at two organizations: the detail route must answer only for the
  // one the request names.
  let housingProvider: { id: string; name: string };
  let otherHousingProvider: { id: string; name: string };

  beforeEach(async () => {
    const { housingProviders } = await seedProviderUserWithHousingProviders(
      testPrismaClient,
      {
        housingProviders: [{ name: "Sunrise House" }, { name: "Beta Housing" }],
      },
    );
    [housingProvider, otherHousingProvider] = housingProviders;
  });

  describe("getStaffApplicationById", () => {
    it("returns the application detail for the owning staff member", async () => {
      const { application } = await seedStaffOwnedApplication();

      const detail =
        await staffCaller().housingApplication.getStaffApplicationById({
          applicationId: application.id,
        });

      expect(detail).toMatchObject({
        id: application.id,
        clientName: application.clientName,
        eligibleProviders: [],
        providerApplications: [],
        homePlan: null,
        hasDuplicate: false,
      });
    });

    it("flags an application that has been duplicated", async () => {
      const { application } = await seedStaffOwnedApplication();
      await createHousingApplication(testPrismaClient, {
        duplicatedFromId: application.id,
      });

      await expect(
        staffCaller().housingApplication.getStaffApplicationById({
          applicationId: application.id,
        }),
      ).resolves.toMatchObject({ hasDuplicate: true });
    });

    it("puts the preferred-provider rows back into formData in rank order", async () => {
      const { application } = await seedStaffOwnedApplication();
      // Inserted out of order, with the gap a cascade delete leaves behind.
      await testPrismaClient.preferredHousingProvider.createMany({
        data: [
          {
            applicationId: application.id,
            providerId: housingProvider.id,
            rank: 2,
          },
          {
            applicationId: application.id,
            providerId: otherHousingProvider.id,
            rank: 0,
          },
        ],
      });

      const detail =
        await staffCaller().housingApplication.getStaffApplicationById({
          applicationId: application.id,
        });

      expect(detail.formData).toMatchObject({
        preferredProviders: [otherHousingProvider.id, housingProvider.id],
      });
      expect(detail.preferredProviders).toEqual([
        { id: otherHousingProvider.id, name: "Beta Housing" },
        { id: housingProvider.id, name: "Sunrise House" },
      ]);
    });

    it("returns an empty preferredProviders array in formData when none are stored", async () => {
      const { application } = await seedStaffOwnedApplication();

      const detail =
        await staffCaller().housingApplication.getStaffApplicationById({
          applicationId: application.id,
        });

      expect(detail.formData).toEqual({ preferredProviders: [] });
    });

    it("does not expose an application owned by another staff member", async () => {
      const { application } = await seedStaffOwnedApplication("other-staff");

      await expect(
        staffCaller().housingApplication.getStaffApplicationById({
          applicationId: application.id,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      });
    });

    it("returns NOT_FOUND for an application id that does not exist", async () => {
      await expect(
        staffCaller().housingApplication.getStaffApplicationById({
          applicationId: "00000000-0000-0000-0000-000000000000",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      });
    });
  });

  describe("getProviderApplicationById", () => {
    function detailAs(providerId: string, applicationId: string) {
      return providerCaller({
        requestedProviderId: providerId,
      }).housingApplication.getProviderApplicationById({ applicationId });
    }

    it("returns the application detail for the provider the caller is acting as", async () => {
      const { application, providerApplication } =
        await seedProviderOwnedApplication(housingProvider.id);

      const detail = await detailAs(housingProvider.id, application.id);

      expect(detail).toMatchObject({
        id: application.id,
        clientName: application.clientName,
        providerApplicationId: providerApplication.id,
        provider: { id: housingProvider.id, name: housingProvider.name },
      });
    });

    it("does not expose another provider's application, in either direction", async () => {
      const { application: own } = await seedProviderOwnedApplication(
        housingProvider.id,
      );
      const { application: other } = await seedProviderOwnedApplication(
        otherHousingProvider.id,
      );

      await expect(
        detailAs(housingProvider.id, other.id),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message:
          HOUSING_APPLICATION_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      });

      await expect(
        detailAs(otherHousingProvider.id, own.id),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message:
          HOUSING_APPLICATION_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      });
    });

    it("shows two colleagues at one provider the same application", async () => {
      const { application, providerApplication } =
        await seedProviderOwnedApplication(housingProvider.id);
      const colleague = await createHousingProviderUser(testPrismaClient, {
        pseudonymizedId: "provider-colleague",
        name: "John Doe",
      });
      await createHousingProviderUserAssignment(testPrismaClient, {
        providerUserId: colleague.id,
        providerId: housingProvider.id,
      });

      const theirs = await providerCaller({
        providerPseudonymizedId: colleague.pseudonymizedId ?? undefined,
        requestedProviderId: housingProvider.id,
      }).housingApplication.getProviderApplicationById({
        applicationId: application.id,
      });

      expect(theirs).toMatchObject({
        id: application.id,
        providerApplicationId: providerApplication.id,
      });
    });

    it("refuses a caller with no assignments rather than exposing the application", async () => {
      const { application } = await seedProviderOwnedApplication(
        housingProvider.id,
      );
      const unassigned = await createHousingProviderUser(testPrismaClient, {
        pseudonymizedId: "provider-unassigned",
        name: "John Doe",
      });

      await expect(
        providerCaller({
          providerPseudonymizedId: unassigned.pseudonymizedId ?? undefined,
        }).housingApplication.getProviderApplicationById({
          applicationId: application.id,
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: HOUSING_PROVIDER_REQUIRED_MESSAGE,
      });
    });

    it("returns NOT_FOUND for an application id that does not exist", async () => {
      await expect(
        detailAs(housingProvider.id, "00000000-0000-0000-0000-000000000000"),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message:
          HOUSING_APPLICATION_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      });
    });
  });
});
