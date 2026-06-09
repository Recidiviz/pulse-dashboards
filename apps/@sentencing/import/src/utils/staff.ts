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
  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  const supervisorUpdates: {
    externalId: string;
    supervisorId: string | null;
  }[] = [];

  // First pass: upsert all staff without supervisor connections so that all
  // records exist before we attempt to link them (supervisors may appear after
  // their direct reports in the source data).
  for await (const staffData of data) {
    const existingCasesForStaff = existingCases.filter(({ externalId }) =>
      staffData.case_ids.includes(externalId),
    );

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
  // links. Promise.allSettled isolates failures so one bad reference doesn't
  // abort the remaining updates.
  const results = await Promise.allSettled(
    supervisorUpdates.map(({ externalId, supervisorId }) =>
      prismaClient.staff.update({
        where: { externalId },
        data: {
          supervisor: supervisorId
            ? { connect: { externalId: supervisorId } }
            : { disconnect: true },
        },
      }),
    ),
  );

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to update supervisor link for staff ${supervisorUpdates[i].externalId}:`,
        result.reason,
      );
    }
  });
}
