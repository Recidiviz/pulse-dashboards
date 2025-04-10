// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import moment from "moment";

import { PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR } from "~@sentencing/trpc/routes/supervisor/constants";
import { getSupervisorDashboardStats } from "~@sentencing/trpc/routes/supervisor/utils";
import { testPrismaClient, testTRPCClient } from "~@sentencing/trpc/test/setup";
import { fakeStaff, fakeSupervisor } from "~@sentencing/trpc/test/setup/seed";

describe("supervisor router", () => {
  describe("getSupervisor", () => {
    test("should return supervisor information if staff is supervisor", async () => {
      await testPrismaClient.staff.createMany({
        data: [
          {
            externalId: "staff-1",
            supervisorId: fakeSupervisor?.externalId,
            pseudonymizedId: "staff-1-pseudo-id",
            stateCode: "US_ID",
            fullName: "Staff Member 1",
            email: "staff1@example.com",
          },
          {
            externalId: "staff-2",
            supervisorId: fakeSupervisor?.externalId,
            pseudonymizedId: "staff-2-pseudo-id",
            stateCode: "US_ID",
            fullName: "Staff Member 2",
            email: "staff2@example.com",
          },
        ],
      });

      const supervisor = await testTRPCClient.supervisor.getSupervisor.query({
        pseudonymizedId: fakeSupervisor.pseudonymizedId,
        ...PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR,
      });

      expect(supervisor).toEqual(
        expect.objectContaining({
          supervisorDashboardStats: expect.objectContaining({
            topLineStats: expect.any(Object),
            staffStats: expect.any(Array),
          }),
        }),
      );
    });

    test("should throw error if supervisor does not exist", async () => {
      await expect(() =>
        testTRPCClient.supervisor.getSupervisor.query({
          pseudonymizedId: "not-a-staff-id",
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

describe("getSupervisorDashboardStats", () => {
  test("should return topLineStats and staffStats for supervised staff", async () => {
    const supervisor = await testPrismaClient.staff.findUnique({
      where: { pseudonymizedId: fakeSupervisor.pseudonymizedId },
      ...PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR,
    });

    if (!supervisor) {
      throw new Error("Supervisor not found");
    }

    await testPrismaClient.staff.createMany({
      data: [
        {
          externalId: "staff-1",
          supervisorId: supervisor?.externalId,
          pseudonymizedId: "staff-1-pseudo-id",
          stateCode: "US_ID",
          fullName: "Staff Member 1",
          email: "staff1@example.com",
        },
        {
          externalId: "staff-2",
          supervisorId: supervisor?.externalId,
          pseudonymizedId: "staff-2-pseudo-id",
          stateCode: "US_ID",
          fullName: "Staff Member 2",
          email: "staff2@example.com",
        },
      ],
    });

    await testPrismaClient.case.createMany({
      data: [
        {
          id: "fake-case-1",
          externalId: "case-1-external",
          stateCode: "US_ID",
          dueDate: moment().subtract(1, "days").toDate(), // Within the last 30 days
          selectedRecommendation: "Probation", // Completed case
          staffId: "staff-1",
        },
        {
          id: "fake-case-2",
          externalId: "case-2-external",
          stateCode: "US_ID",
          dueDate: moment().subtract(1, "days").toDate(), // Within the last 30 days
          selectedRecommendation: undefined, // Incomplete case
          staffId: "staff-1",
        },
        {
          id: "fake-case-5",
          externalId: "case-5-external",
          stateCode: "US_ID",
          dueDate: moment().add(15, "days").toDate(), // 15 days in the future, should not count towards completion
          selectedRecommendation: "Term", // Completed case
          staffId: "staff-1",
        },
        {
          id: "fake-case-3",
          externalId: "case-3-external",
          stateCode: "US_ID",
          dueDate: moment("2025-02-01", "YYYY-MM-DD").toDate(), // Past due date
          selectedRecommendation: "Rider", // Completed case
          staffId: "staff-2",
        },
        {
          id: "fake-case-4",
          externalId: "case-4-external",
          stateCode: "US_ID",
          dueDate: moment("2025-01-15", "YYYY-MM-DD").toDate(), // Past due date
          selectedRecommendation: undefined, // Incomplete case
          staffId: "staff-2",
        },
      ],
    });

    const result = await getSupervisorDashboardStats(
      supervisor,
      testPrismaClient,
    );

    const expectedTopLineStats = {
      casesDue: 2, // Cases due within the last 30 days
      teamUsageRate: 100, // Staff with at least one recommendation recorded in the last 30 days - only one staff member accomplished this
      totalCaseCompletionRate: 50,
    };

    const expectedStaffStats = [
      expect.objectContaining({
        caseCompletionRate: 50,
        activeCasesAssigned: 1, // 1 active case (1 due date in the future, 2 due dates in the past)
        totalCasesDueLast30Days: 2,
      }),
      expect.objectContaining({
        caseCompletionRate: 0,
        activeCasesAssigned: 0, // No active cases (all due dates are in the past)
        totalCasesDueLast30Days: 0,
      }),
    ];

    expect(result).toEqual(
      expect.objectContaining({
        topLineStats: expectedTopLineStats,
        staffStats: expectedStaffStats,
      }),
    );
  });

  test("should return undefined if no supervised staff are found", async () => {
    const supervisor = await testPrismaClient.staff.findUnique({
      where: { pseudonymizedId: fakeStaff.pseudonymizedId },
      ...PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR,
    });
    if (!supervisor) {
      throw new Error("Supervisor not found");
    }

    const result = await getSupervisorDashboardStats(
      supervisor,
      testPrismaClient,
    );

    expect(result).toBeUndefined();
  });
});
