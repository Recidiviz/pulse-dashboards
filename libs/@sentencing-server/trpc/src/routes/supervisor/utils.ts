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

import { Case, Prisma, PrismaClient } from "@prisma/sentencing-server/client";
import moment from "moment";

import { PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR } from "~@sentencing-server/trpc/routes/supervisor/constants";
import { SupervisorStats } from "~@sentencing-server/trpc/routes/supervisor/types";

type StaffData = Prisma.StaffGetPayload<
  typeof PRISMA_STAFF_GET_ARGS_FOR_SUPERVISOR
>;

const lastThirtyDays = moment().utc().subtract(30, "days").toDate();

const calculateRate = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : (numerator / denominator) * 100;

const isCompletedInLast30Days = (
  caseInfo: Pick<Case, "selectedRecommendation" | "dueDate">,
): boolean =>
  Boolean(caseInfo.selectedRecommendation) &&
  moment(caseInfo.dueDate).utc() >= moment(lastThirtyDays).utc();

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
    const allCasesDueLast30Days = allCases.filter(
      (c) => moment(c.dueDate).utc() >= moment(lastThirtyDays).utc(),
    );
    const staffWithRecommendationsLast30Days = allSupervisedStaff.filter((s) =>
      s.cases.some(isCompletedInLast30Days),
    );
    const totalCasesWithRecommendationsLast30Days =
      allCasesDueLast30Days.filter((c) => c.selectedRecommendation).length;

    const topLineStats = {
      casesDue: allCasesDueLast30Days.length,
      teamUsageRate: calculateRate(
        staffWithRecommendationsLast30Days.length,
        totalSupervisedStaff,
      ),
      totalCaseCompletionRate: calculateRate(
        totalCasesWithRecommendationsLast30Days,
        allCases.length,
      ),
    };

    // Staff Stats
    const staffStats = allSupervisedStaff.map((s) => {
      const completedCasesLast30Days = s.cases.filter(
        isCompletedInLast30Days,
      ).length;
      const activeCasesAssigned = s.cases.filter(
        (c) => moment().utc() < moment(c.dueDate).utc().add(1, "day"),
      ).length;

      return {
        ...s,
        cases: undefined,
        caseCompletionRate: calculateRate(
          completedCasesLast30Days,
          s.cases.length,
        ),
        activeCasesAssigned,
      };
    });

    return { topLineStats, staffStats };
  }

  return undefined;
}
