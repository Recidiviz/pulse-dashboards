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

import { PrismaClient } from "@prisma/sentencing-server/client";
import z from "zod";

import { staffImportSchema } from "~@sentencing-server/import/models";

export async function transformAndLoadStaffData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof staffImportSchema>>,
) {
  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  // Load new staff data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const staffData of data) {
    // Just get the cases which are already in the database (if a case hasn't been uploaded yet, it will be linked to this client during the case upload process)
    const existingCasesForStaff = existingCases.filter(({ externalId }) =>
      staffData.case_ids.includes(externalId),
    );

    const newStaff = {
      externalId: staffData.external_id,
      pseudonymizedId: staffData.pseudonymized_id,
      stateCode: staffData.state_code,
      fullName: staffData.full_name,
      email: staffData.email,
      cases: {
        connect: existingCasesForStaff,
      },
      supervisorId: staffData.supervisor_id,
    };

    // Load data
    await prismaClient.staff.upsert({
      where: {
        externalId: newStaff.externalId,
      },
      create: newStaff,
      update: newStaff,
    });
  }
}
