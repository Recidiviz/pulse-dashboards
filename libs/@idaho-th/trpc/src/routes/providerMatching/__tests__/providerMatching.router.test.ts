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
  ApplicationStatus,
  ApplicationSubStage,
} from "~@idaho-th/prisma/client";
import type { EligibilityParams } from "~@idaho-th/shared";
import { staffCaller } from "~@idaho-th/trpc/test/caller";
import {
  createHousingProvider,
  createHousingProviderLocation,
} from "~@idaho-th/trpc/test/factories";
import {
  readHousingApplication,
  readStaffApplication,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedMatchableApplication } from "./providerMatching.fixtures";

const EMPTY_ELIGIBILITY_PARAMS: EligibilityParams = {
  preferredDistricts: [],
  isRider: null,
  isSexOffender: null,
  faithBasedPreferred: null,
  preferredProviders: [],
};

function readProviderApplications(applicationId: string) {
  return testPrismaClient.providerHousingApplication.findMany({
    where: { applicationId },
  });
}

describe("providerMatchingRouter", () => {
  describe("input validation", () => {
    it("rejects a distinct field outside the scalar field enum", async () => {
      await expect(
        staffCaller().housingApplication.getProviders({
          // @ts-expect-error deliberately invalid enum value
          distinct: ["NOT_A_FIELD"],
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("getProviders", () => {
    it("returns a well-formed provider list for the staff caller", async () => {
      await createHousingProvider(testPrismaClient, { name: "Sunrise House" });

      const result = await staffCaller().housingApplication.getProviders({});

      expect(result).toEqual({
        providers: expect.arrayContaining([
          expect.objectContaining({ name: "Sunrise House" }),
        ]),
      });
    });
  });

  describe("getProvidersWithEligibility", () => {
    it("returns eligible providers with their best matching location", async () => {
      const provider = await createHousingProvider(testPrismaClient, {
        name: "Sunrise House",
      });
      await createHousingProviderLocation(testPrismaClient, {
        providerId: provider.id,
      });

      const result =
        await staffCaller().housingApplication.getProvidersWithEligibility({
          eligibilityParams: EMPTY_ELIGIBILITY_PARAMS,
        });

      expect(result.providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: provider.id, name: "Sunrise House" }),
        ]),
      );
    });
  });

  describe("sendToProviders", () => {
    it("sends the application to the eligible providers the owning staff selected", async () => {
      const {
        application,
        providers: [{ provider }],
      } = await seedMatchableApplication(testPrismaClient, {
        providers: [{ name: "Alpha Housing" }],
      });
      const providerId = provider.id;

      await expect(
        staffCaller().housingApplication.sendToProviders({
          applicationId: application.id,
          providerIds: [providerId],
        }),
      ).resolves.toBeUndefined();

      await expect(
        readHousingApplication(testPrismaClient, application.id),
      ).resolves.toMatchObject({ sentToProvidersAt: expect.any(Date) });
      await expect(
        readStaffApplication(testPrismaClient, application.id),
      ).resolves.toMatchObject({
        subStage: ApplicationSubStage.PROVIDER_REVIEW,
        status: ApplicationStatus.WAITING,
      });
      await expect(readProviderApplications(application.id)).resolves.toEqual([
        expect.objectContaining({ providerId }),
      ]);
    });

    it("does not let another staff member send an application they do not own", async () => {
      const {
        application,
        providers: [{ provider }],
      } = await seedMatchableApplication(testPrismaClient, {
        staffPseudonymizedId: "some-other-staff",
        providers: [{ name: "Alpha Housing" }],
      });

      await expect(
        staffCaller().housingApplication.sendToProviders({
          applicationId: application.id,
          providerIds: [provider.id],
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(readProviderApplications(application.id)).resolves.toEqual(
        [],
      );
    });
  });
});
