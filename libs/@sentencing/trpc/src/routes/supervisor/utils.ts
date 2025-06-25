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

import moment from "moment";

import { Case, Prisma, PrismaClient } from "~@sentencing/prisma/client";
import { PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR } from "~@sentencing/trpc/routes/supervisor/constants";
import { SupervisorStats } from "~@sentencing/trpc/routes/supervisor/types";

type StaffData = Prisma.StaffGetPayload<
  typeof PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR
>;

const calculateRate = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : (numerator / denominator) * 100;

export const isDueWithinLast30Days = (dueDate: Date | null): boolean => {
  if (!dueDate) return false;

  const dueMoment = moment(dueDate).utc().startOf("day");
  const now = moment().utc().startOf("day");
  const thirtyDaysAgo = now.clone().subtract(30, "days").startOf("day");

  // "[)" means include the lower boundary (30 days ago) and exclude the upper boundary (now)
  return dueMoment.isBetween(thirtyDaysAgo, now, undefined, "[)");
};

const isCompletedWithinLast30Days = (
  caseInfo: Pick<Case, "selectedRecommendation" | "dueDate">,
): boolean =>
  Boolean(caseInfo.selectedRecommendation) &&
  isDueWithinLast30Days(caseInfo.dueDate);

export async function getSupervisorDashboardStats(
  supervisor: StaffData,
  prisma: PrismaClient,
): Promise<SupervisorStats | undefined> {
  if (supervisor.supervisorId) return;

  const allSupervisedStaff = await prisma.staff.findMany({
    where: {
      supervisorId: supervisor.externalId,
    },
    omit: {
      externalId: true,
    },
    include: {
      cases: {
        select: {
          id: true,
          dueDate: true,
          selectedRecommendation: true,
        },
      },
    },
  });
  const totalSupervisedStaff = allSupervisedStaff.length;

  if (totalSupervisedStaff > 0) {
    // Top Line Stats
    const allCases = allSupervisedStaff.flatMap((s) => s.cases);
    const allCasesDueLast30Days = allCases.filter((c) =>
      isDueWithinLast30Days(c.dueDate),
    );
    const staffWithOneCaseRecommendationDueLast30Days =
      allSupervisedStaff.filter((s) =>
        s.cases.some(isCompletedWithinLast30Days),
      );
    const staffWithCasesDueLast30Days = allSupervisedStaff.filter((s) =>
      s.cases.some((c) => isDueWithinLast30Days(c.dueDate)),
    );
    const totalCasesWithRecommendationsDueLast30Days =
      allCasesDueLast30Days.filter((c) => c.selectedRecommendation).length;

    const topLineStats = {
      casesDue: allCasesDueLast30Days.length,
      teamUsageRate: calculateRate(
        staffWithOneCaseRecommendationDueLast30Days.length,
        staffWithCasesDueLast30Days.length,
      ),
      totalCaseCompletionRate: calculateRate(
        totalCasesWithRecommendationsDueLast30Days,
        allCasesDueLast30Days.length,
      ),
    };

    // Staff Stats
    const staffStats = allSupervisedStaff.map((s) => {
      const totalCasesDueLast30Days = s.cases.filter((c) =>
        isDueWithinLast30Days(c.dueDate),
      );
      const completedCasesDueLast30Days = s.cases.filter(
        isCompletedWithinLast30Days,
      ).length;
      const activeCasesAssigned = s.cases.filter(
        (c) => moment().utc() < moment(c.dueDate).utc().add(1, "day"),
      ).length;

      return {
        ...s,
        cases: undefined,
        totalCasesDueLast30Days: totalCasesDueLast30Days.length,
        caseCompletionRate: calculateRate(
          completedCasesDueLast30Days,
          totalCasesDueLast30Days.length,
        ),
        activeCasesAssigned,
      };
    });

    return { topLineStats, staffStats };
  }

  return undefined;
}
