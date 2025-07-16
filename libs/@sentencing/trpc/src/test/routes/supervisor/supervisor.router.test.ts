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

  test("should include all staff when supervisesAll is true", async () => {
    await testPrismaClient.staff.deleteMany({});

    const superAllSupervisor = await testPrismaClient.staff.create({
      data: {
        externalId: "super-all-supervisor",
        supervisorId: null,
        pseudonymizedId: "super-all-pseudo-id",
        stateCode: "US_ID",
        fullName: "Super All Supervisor",
        email: "superall@example.com",
        supervisesAll: true,
      },
      include: {
        cases: {},
      },
    });

    const additionalSupervisor = await testPrismaClient.staff.create({
      data: {
        externalId: "additional-supervisor",
        supervisorId: null,
        pseudonymizedId: "additional-supervisor-pseudo-id",
        stateCode: "US_ID",
        fullName: "Additional Supervisor",
        email: "additionalsupervisor@example.com",
      },
    });

    // Create staff under different supervisors
    await testPrismaClient.staff.createMany({
      data: [
        {
          externalId: "staff-under-fake-supervisor",
          supervisorId: fakeSupervisor.externalId,
          pseudonymizedId: "staff-under-fake-pseudo-id",
          stateCode: "US_ID",
          fullName: "Staff 1",
          email: "staff1@example.com",
        },
        {
          externalId: "staff-under-additional-supervisor",
          supervisorId: additionalSupervisor.externalId,
          pseudonymizedId: "staff-under-additional-pseudo-id",
          stateCode: "US_ID",
          fullName: "Staff 2",
          email: "staff2@example.com",
        },
      ],
    });

    await testPrismaClient.case.createMany({
      data: [
        {
          id: "current-case-1",
          externalId: "current-case-1-external",
          stateCode: "US_ID",
          dueDate: moment().utc().subtract(5, "days").toDate(),
          staffId: "additional-supervisor",
        },
        {
          id: "current-case-2",
          externalId: "current-case-2-external",
          stateCode: "US_ID",
          dueDate: moment().utc().subtract(22, "days").toDate(),
          staffId: "staff-under-fake-supervisor",
        },
        {
          id: "old-case-1",
          externalId: "old-case-1-external",
          stateCode: "US_ID",
          dueDate: moment().utc().subtract(5, "days").toDate(),
          staffId: "staff-under-additional-supervisor",
        },
        {
          id: "old-case-2",
          externalId: "old-case-2-external",
          stateCode: "US_ID",
          dueDate: moment().utc().subtract(5, "days").toDate(),
          staffId: "super-all-supervisor",
        },
      ],
    });

    const result = await getSupervisorDashboardStats(
      superAllSupervisor,
      testPrismaClient,
    );

    expect(result?.staffStats).toHaveLength(4);

    const staffIds = result?.staffStats.map((s) => s.pseudonymizedId);
    expect(staffIds).toContain("additional-supervisor-pseudo-id");
    expect(staffIds).toContain("staff-under-fake-pseudo-id");
    expect(staffIds).toContain("staff-under-additional-pseudo-id");
    expect(staffIds).toContain("super-all-pseudo-id");
  });

  test("should only include staff with active cases this month", async () => {
    await testPrismaClient.staff.deleteMany({});
    await testPrismaClient.case.deleteMany({});

    const supervisor = await testPrismaClient.staff.create({
      data: {
        externalId: "test-supervisor",
        supervisorId: null,
        supervisesAll: true,
        pseudonymizedId: "test-supervisor-pseudo-id",
        stateCode: "US_ID",
        fullName: "Test Supervisor",
        email: "testsupervisor@example.com",
      },
      include: {
        cases: {},
      },
    });

    await testPrismaClient.staff.createMany({
      data: [
        {
          externalId: "staff-with-current-cases",
          supervisorId: supervisor.externalId,
          pseudonymizedId: "staff-with-current-pseudo-id",
          stateCode: "US_ID",
          fullName: "Staff With Current Cases",
          email: "staffwithcurrentcases@example.com",
        },
        {
          externalId: "staff-with-old-cases",
          supervisorId: supervisor.externalId,
          pseudonymizedId: "staff-with-old-pseudo-id",
          stateCode: "US_ID",
          fullName: "Staff With Old Cases",
          email: "staffwitholdcases@example.com",
        },
        {
          externalId: "staff-with-no-cases",
          supervisorId: supervisor.externalId,
          pseudonymizedId: "staff-with-no-pseudo-id",
          stateCode: "US_ID",
          fullName: "Staff With No Cases",
          email: "staffwithnocases@example.com",
        },
      ],
    });

    // Create cases - some this month, some from previous months
    await testPrismaClient.case.createMany({
      data: [
        {
          id: "current-case-1",
          externalId: "current-case-1-external",
          stateCode: "US_ID",
          dueDate: moment().utc().subtract(1, "days").toDate(), // Within the last 30 days
          staffId: "staff-with-current-cases",
        },
        {
          id: "current-case-2",
          externalId: "current-case-2-external",
          stateCode: "US_ID",
          dueDate: moment().utc().subtract(29, "days").toDate(), // Within the last 30 days
          staffId: "staff-with-current-cases",
        },
        {
          id: "old-case-1",
          externalId: "old-case-1-external",
          stateCode: "US_ID",
          dueDate: moment().utc().subtract(31, "days").toDate(), // More than 30 days ago
          staffId: "staff-with-old-cases",
        },
        {
          id: "old-case-2",
          externalId: "old-case-2-external",
          stateCode: "US_ID",
          dueDate: moment().utc().subtract(60, "days").toDate(), // More than 30 days ago
          staffId: "staff-with-old-cases",
        },
      ],
    });

    const result = await getSupervisorDashboardStats(
      supervisor,
      testPrismaClient,
    );

    // Should only include staff with cases due this month
    expect(result?.staffStats).toHaveLength(1);
    expect(result?.staffStats[0].pseudonymizedId).toBe(
      "staff-with-current-pseudo-id",
    );

    // Staff with old cases or no cases should not be included
    const staffIds = result?.staffStats.map((s) => s.pseudonymizedId);
    expect(staffIds).not.toContain("staff-with-old-pseudo-id");
    expect(staffIds).not.toContain("staff-with-no-pseudo-id");
  });
});
