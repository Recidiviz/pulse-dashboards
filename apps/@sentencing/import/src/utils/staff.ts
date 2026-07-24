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

import z from "zod";

import { staffImportSchema } from "~@sentencing/import/models";
import { getMODistrictFullName } from "~@sentencing/import/utils/helpers";
import { PrismaClient } from "~@sentencing/prisma/client";

export async function transformAndLoadStaffData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof staffImportSchema>>,
) {
  const existingCaseExternalIds = new Set(
    (
      await prismaClient.case.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );

  const supervisorUpdates: {
    externalId: string;
    supervisorId: string | null;
  }[] = [];

  // First pass: upsert all staff without supervisor connections so that all
  // records exist before we attempt to link them (supervisors may appear after
  // their direct reports in the source data).
  for await (const staffData of data) {
    if (!staffData.full_name) {
      console.warn(
        `Skipping staff record ${staffData.external_id}: missing full_name.`,
      );
      continue;
    }

    const existingCasesForStaff = staffData.case_ids
      .filter((externalId) => existingCaseExternalIds.has(externalId))
      .map((externalId) => ({ externalId }));

    const districtConnection =
      staffData.state_code === "US_MO" && staffData.district
        ? {
            connectOrCreate: {
              where: {
                name: getMODistrictFullName(staffData.district),
              },
              create: {
                stateCode: staffData.state_code,
                name: getMODistrictFullName(staffData.district),
              },
            },
          }
        : undefined;

    const newStaff = {
      externalId: staffData.external_id,
      pseudonymizedId: staffData.pseudonymized_id,
      stateCode: staffData.state_code,
      fullName: staffData.full_name,
      email: staffData.email,
      cases: {
        connect: existingCasesForStaff,
      },
      supervisesAll: !!staffData.supervises_all,
      officeAddress: staffData.officeAddress,
      officePhoneNumber: staffData.officePhoneNumber,
      district: districtConnection,
    };

    await prismaClient.staff.upsert({
      where: { externalId: newStaff.externalId },
      create: newStaff,
      update: newStaff,
    });

    supervisorUpdates.push({
      externalId: staffData.external_id,
      supervisorId: staffData.supervisor_id ?? null,
    });
  }

  // Second pass: now that all staff records exist, wire up (or clear) supervisor
  // links. We do this in a for loop instead of Promise.all to avoid a prisma
  // pool connection error (same reasoning as transformAndLoadCaseData). Each
  // update is wrapped in a try/catch so one bad reference doesn't abort the
  // remaining updates.
  for (const { externalId, supervisorId } of supervisorUpdates) {
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential to avoid exhausting the Prisma connection pool
      await prismaClient.staff.update({
        where: { externalId },
        data: {
          supervisor: supervisorId
            ? { connect: { externalId: supervisorId } }
            : { disconnect: true },
        },
      });
    } catch (error) {
      console.error(
        `Failed to update supervisor link for staff ${externalId}:`,
        error,
      );
    }
  }
}
