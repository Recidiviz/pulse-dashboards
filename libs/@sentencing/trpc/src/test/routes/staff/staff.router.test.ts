// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { faker } from "@faker-js/faker";
import { TRPCError } from "@trpc/server";
import { describe, expect, test } from "vitest";

import { Gender, StateCode } from "~@sentencing/prisma/client";
import { testGetStaff } from "~@sentencing/trpc/test/common/utils";
import { testPrismaClient, testTRPCClient } from "~@sentencing/trpc/test/setup";
import { fakeStaff, fakeSupervisor } from "~@sentencing/trpc/test/setup/seed";

describe("staff router", () => {
  describe("getStaff", () => {
    // eslint-disable-next-line vitest/expect-expect
    test("should return staff if staff exists", async () => {
      const returnedStaff = await testTRPCClient.staff.getStaff.query({
        pseudonymizedId: fakeStaff.pseudonymizedId,
      });
      testGetStaff(returnedStaff);
    });

    test("should throw error if staff does not exist", async () => {
      await expect(() =>
        testTRPCClient.staff.getStaff.query({
          pseudonymizedId: "not-a-staff-id",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        }),
      );
    });

    test("should return direct reports' cases for supervisor", async () => {
      // Create two direct reports with clients and cases
      const reportsWithCases = await Promise.all(
        [1, 2].map(async (num) => {
          const directReport = await testPrismaClient.staff.create({
            data: {
              externalId: faker.string.uuid(),
              pseudonymizedId: faker.string.uuid(),
              fullName: `Direct Report ${num}`,
              email: faker.internet.email(),
              stateCode: StateCode.US_ID,
              hasLoggedIn: true,
              supervisorId: fakeSupervisor.externalId,
            },
          });

          const client = await testPrismaClient.client.create({
            data: {
              externalId: faker.string.uuid(),
              pseudonymizedId: faker.string.uuid(),
              fullName: faker.person.fullName(),
              stateCode: StateCode.US_ID,
              gender: num === 1 ? Gender.MALE : Gender.FEMALE,
              birthDate: faker.date.birthdate(),
            },
          });

          const caseRecord = await testPrismaClient.case.create({
            data: {
              id: faker.string.uuid(),
              externalId: faker.string.uuid(),
              stateCode: StateCode.US_ID,
              dueDate: faker.date.future(),
              staffId: directReport.externalId,
              clientId: client.externalId,
            },
          });

          return { directReport, caseRecord };
        }),
      );

      // Fetch as supervisor
      const result = await testTRPCClient.staff.getStaff.query({
        pseudonymizedId: fakeSupervisor.pseudonymizedId,
      });

      // Should see all cases (2 direct reports' cases)
      expect(result.cases).toHaveLength(2);

      // Direct reports' cases should have assignedTo set
      reportsWithCases.forEach(({ caseRecord }, index) => {
        const foundCase = result.cases.find((c) => c.id === caseRecord.id);
        expect(foundCase).toBeDefined();
        expect(foundCase?.assignedTo).toBe(`Direct Report ${index + 1}`);
      });
    });

    test("should return all state cases for supervisesAll supervisor", async () => {
      // Update fakeSupervisor to be an org-wide supervisor
      await testPrismaClient.staff.update({
        where: { externalId: fakeSupervisor.externalId },
        data: { supervisesAll: true },
      });

      // Fetch as org-wide supervisor
      const result = await testTRPCClient.staff.getStaff.query({
        pseudonymizedId: fakeSupervisor.pseudonymizedId,
      });

      // Should see ALL cases in the state, including fakeStaff's fakeCase
      expect(result.cases.length).toBeGreaterThanOrEqual(1);

      // Should see fakeStaff's case since supervisesAll = true
      const staffCase = result.cases.find((c) => c.externalId === "case-ext-1");
      expect(staffCase).toBeDefined();
      expect(staffCase?.assignedTo).toBeDefined();
    });
  });

  describe("updateStaff", () => {
    test("should update isFirstLogin", async () => {
      await testTRPCClient.staff.updateStaff.mutate({
        pseudonymizedId: fakeStaff.pseudonymizedId,
        hasLoggedIn: true,
      });

      const dbStaff = await testPrismaClient.staff.findUnique({
        where: { pseudonymizedId: fakeStaff.pseudonymizedId },
      });

      expect(dbStaff?.hasLoggedIn).toBeTruthy();
    });

    test("should throw error if staff does not exist", async () => {
      await expect(() =>
        testTRPCClient.staff.updateStaff.mutate({
          pseudonymizedId: "not-a-staff-id",
          hasLoggedIn: true,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        }),
      );
    });
  });
});
