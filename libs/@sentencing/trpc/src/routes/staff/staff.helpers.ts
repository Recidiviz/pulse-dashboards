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

import { TRPCError } from "@trpc/server";

import { Prisma, PrismaClient } from "~@sentencing/prisma/client";

/**
 * Fetches a staff member by their pseudonymized ID.
 * @throws TRPCError with NOT_FOUND code if staff doesn't exist
 */
export async function fetchStaffById(
  prisma: PrismaClient,
  pseudonymizedId: string,
) {
  const staff = await prisma.staff.findUnique({
    where: { pseudonymizedId },
    select: {
      externalId: true,
      pseudonymizedId: true,
      fullName: true,
      email: true,
      stateCode: true,
      hasLoggedIn: true,
      supervisorId: true,
      supervisesAll: true,
      officeAddress: true,
      officePhoneNumber: true,
    },
  });

  if (!staff) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Staff with that id was not found",
    });
  }

  return staff;
}

/**
 * Fetches the pseudonymized IDs of all direct reports for a supervisor.
 */
export async function getDirectReportIds(
  prisma: PrismaClient,
  supervisorExternalId: string,
): Promise<string[]> {
  const reports = await prisma.staff.findMany({
    where: { supervisorId: supervisorExternalId },
    select: { pseudonymizedId: true },
  });

  return reports.map((r) => r.pseudonymizedId);
}

export type StaffInfo = Awaited<ReturnType<typeof fetchStaffById>>;

/**
 * Builds a Prisma filter for fetching cases based on supervisor status.
 * - Org-wide supervisors see all cases in the state
 * - Regular supervisors see their direct reports' cases + their own
 * - Regular staff see only their own cases
 */
export async function buildStaffCaseFilter(
  prisma: PrismaClient,
  staff: StaffInfo,
): Promise<Prisma.CaseWhereInput["staff"]> {
  // TODO(#11462): Replace DB supervisesAll flag with route permission check
  if (staff.supervisesAll) {
    return { stateCode: staff.stateCode };
  }

  if (staff.supervisorId === null) {
    const directReportIds = await getDirectReportIds(prisma, staff.externalId);
    return {
      pseudonymizedId: { in: [...directReportIds, staff.pseudonymizedId] },
    };
  }

  return { pseudonymizedId: staff.pseudonymizedId };
}

/**
 * Fetches all cases for the given staff filter.
 */
export async function fetchCasesForStaff(
  prisma: PrismaClient,
  staffFilter: Prisma.CaseWhereInput["staff"],
) {
  return prisma.case.findMany({
    where: { staff: staffFilter },
    select: {
      id: true,
      externalId: true,
      dueDate: true,
      customDueDate: true,
      reportType: true,
      status: true,
      isCancelled: true,
      staff: {
        select: {
          pseudonymizedId: true,
          fullName: true,
        },
      },
      client: {
        select: {
          externalId: true,
          fullName: true,
        },
      },
      offense: {
        select: {
          name: true,
        },
      },
    },
  });
}

export type CaseFromDb = Awaited<ReturnType<typeof fetchCasesForStaff>>[number];

/**
 * Transforms a case from the database format to the response format.
 * - Uses customDueDate if available, otherwise dueDate
 * - Shows assignedTo name for supervisor viewing team cases, "You" for own cases
 * - Omits staff metadata (only returns computed assignedTo field)
 */
export function transformCaseForResponse(
  caseRecord: CaseFromDb,
  loggedInStaffPseudonymizedId: string,
) {
  const { staff, offense, ...rest } = caseRecord;

  return {
    ...rest,
    offense: offense?.name,
    dueDate: caseRecord.customDueDate ?? caseRecord.dueDate,
    assignedTo:
      staff?.pseudonymizedId === loggedInStaffPseudonymizedId
        ? "You"
        : staff?.fullName,
  };
}

/**
 * Removes sensitive fields from staff data before returning to client.
 */
export function sanitizeStaffForResponse(staff: StaffInfo) {
  const { externalId, ...staffWithoutExternalId } = staff;
  void externalId; // Intentionally unused for security
  return staffWithoutExternalId;
}
