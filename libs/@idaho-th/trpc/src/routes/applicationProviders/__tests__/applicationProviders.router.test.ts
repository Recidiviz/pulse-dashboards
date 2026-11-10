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

import { ApplicationSubStage } from "~@idaho-th/prisma/client";
import { staffCaller } from "~@idaho-th/trpc/test/caller";
import {
  createHousingProviderUser,
  createHousingProviderUserAssignment,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedStaffApplicationProviders } from "./applicationProviders.fixtures";

describe("applicationProvidersRouter", () => {
  describe("input validation", () => {
    it("rejects a filters.subStage value that is not a known enum member", async () => {
      const { application } = await seedStaffApplicationProviders(
        testPrismaClient,
        { providers: [{ name: "Alpha Housing" }] },
      );

      await expect(
        staffCaller().housingApplication.getStaffApplicationProviders({
          applicationId: application.id,
          filters: {
            subStage: ["NOT_A_SUBSTAGE"] as unknown as ApplicationSubStage[],
          },
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("getStaffApplicationProviders", () => {
    it("returns the application's providers for the owning staff member", async () => {
      const { application, providerApplications } =
        await seedStaffApplicationProviders(testPrismaClient, {
          providers: [{ name: "Alpha Housing" }],
        });

      const result =
        await staffCaller().housingApplication.getStaffApplicationProviders({
          applicationId: application.id,
        });

      expect(result).toMatchObject({
        applicationId: application.id,
        providers: [
          {
            providerApplicationId:
              providerApplications[0].providerApplication.id,
            providerName: "Alpha Housing",
          },
        ],
      });
    });

    it("does not expose an application owned by another staff member", async () => {
      const { application } = await seedStaffApplicationProviders(
        testPrismaClient,
        {
          staffPseudonymizedId: "other-staff",
          providers: [{ name: "Alpha Housing" }],
        },
      );

      await expect(
        staffCaller().housingApplication.getStaffApplicationProviders({
          applicationId: application.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // The contact staff see is the organization's *first assigned* user. An
  // organization may have several users or none, so these pin the choice down:
  // without the orderBy on the assignment, the several-users case returns
  // whichever row Postgres happened to hand back.
  describe("provider contact", () => {
    async function assignUser(
      providerId: string,
      {
        name,
        email,
        contactPhone,
        pseudonymizedId,
        assignedAt,
      }: {
        name: string;
        email: string;
        contactPhone: string;
        pseudonymizedId: string;
        assignedAt: Date;
      },
    ) {
      const user = await createHousingProviderUser(testPrismaClient, {
        name,
        email,
        contactPhone,
        pseudonymizedId,
      });
      await createHousingProviderUserAssignment(testPrismaClient, {
        providerUserId: user.id,
        providerId,
        createdAt: assignedAt,
      });
      return user;
    }

    it("returns the earliest-assigned user and none of their colleagues", async () => {
      const { application, providerApplications } =
        await seedStaffApplicationProviders(testPrismaClient, {
          providers: [{ name: "Alpha Housing" }],
        });
      const providerId = providerApplications[0].provider.id;

      // Seeded late-first so insertion order cannot be what makes this pass.
      await assignUser(providerId, {
        name: "John Doe",
        email: "john.doe@example.com",
        contactPhone: "208-555-0199",
        pseudonymizedId: "provider-user-late",
        assignedAt: new Date("2026-02-01T00:00:00.000Z"),
      });
      await assignUser(providerId, {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        contactPhone: "208-555-0100",
        pseudonymizedId: "provider-user-early",
        assignedAt: new Date("2026-01-01T00:00:00.000Z"),
      });

      const result =
        await staffCaller().housingApplication.getStaffApplicationProviders({
          applicationId: application.id,
        });

      expect(result.providers[0].contact).toEqual({
        contactName: "Jane Doe",
        email: "jane.doe@example.com",
        contactPhone: "208-555-0100",
      });
      expect(JSON.stringify(result)).not.toContain("john.doe@example.com");
      expect(JSON.stringify(result)).not.toContain("John Doe");
    });

    it("returns that user when the provider has exactly one", async () => {
      const { application, providerApplications } =
        await seedStaffApplicationProviders(testPrismaClient, {
          providers: [{ name: "Alpha Housing" }],
        });

      await assignUser(providerApplications[0].provider.id, {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        contactPhone: "208-555-0100",
        pseudonymizedId: "provider-user-only",
        assignedAt: new Date("2026-01-01T00:00:00.000Z"),
      });

      const result =
        await staffCaller().housingApplication.getStaffApplicationProviders({
          applicationId: application.id,
        });

      expect(result.providers[0].contact).toEqual({
        contactName: "Jane Doe",
        email: "jane.doe@example.com",
        contactPhone: "208-555-0100",
      });
    });

    it("breaks a shared assignment timestamp on the user id", async () => {
      // The CSV seed assigns in bulk, so colleagues can share a createdAt to
      // the microsecond. Without the second sort key the winner is arbitrary.
      const { application, providerApplications } =
        await seedStaffApplicationProviders(testPrismaClient, {
          providers: [{ name: "Alpha Housing" }],
        });
      const providerId = providerApplications[0].provider.id;
      const assignedAt = new Date("2026-01-01T00:00:00.000Z");

      const first = await assignUser(providerId, {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        contactPhone: "208-555-0100",
        pseudonymizedId: "provider-user-tie-a",
        assignedAt,
      });
      const second = await assignUser(providerId, {
        name: "John Doe",
        email: "john.doe@example.com",
        contactPhone: "208-555-0199",
        pseudonymizedId: "provider-user-tie-b",
        assignedAt,
      });

      // Plain code-point order: uuids are same-length lowercase hex with the
      // hyphens in fixed positions, so this agrees with Postgres's ASC.
      const expected = [first, second].sort((a, b) =>
        a.id < b.id ? -1 : 1,
      )[0];

      const result =
        await staffCaller().housingApplication.getStaffApplicationProviders({
          applicationId: application.id,
        });

      expect(result.providers[0].contact).toEqual({
        contactName: expected.name,
        email: expected.email,
        contactPhone: expected.contactPhone,
      });
    });

    it("reports no contact for a provider with no users", async () => {
      const { application } = await seedStaffApplicationProviders(
        testPrismaClient,
        { providers: [{ name: "Alpha Housing" }] },
      );

      const result =
        await staffCaller().housingApplication.getStaffApplicationProviders({
          applicationId: application.id,
        });

      expect(result.providers[0].contact).toBeNull();
    });
  });
});
