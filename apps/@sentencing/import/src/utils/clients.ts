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

import { z } from "zod";

import { clientImportSchema } from "~@sentencing/import/models";
import { Gender, PrismaClient } from "~@sentencing/prisma/client";

export async function transformAndLoadClientData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof clientImportSchema>>,
) {
  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  // Load new client data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const clientData of data) {
    // Just get the cases which are already in the database (if a case hasn't been uploaded yet, it will be linked to this client during the case upload process)
    const existingCasesForClient = existingCases.filter(({ externalId }) =>
      clientData.case_ids.includes(externalId),
    );

    const hasKnownGender =
      clientData.gender !== Gender.INTERNAL_UNKNOWN &&
      clientData.gender !== Gender.EXTERNAL_UNKNOWN;
    const isCountyLocked = Boolean(clientData.county);

    const newClient = {
      externalId: clientData.external_id,
      pseudonymizedId: clientData.pseudonymized_id,
      stateCode: clientData.state_code,
      fullName: clientData.full_name,
      birthDate: clientData.birth_date,
      isGenderLocked: hasKnownGender,
      isCountyLocked,
      cases: {
        connect: existingCasesForClient,
      },
    };

    // County connection - both create and update use the same logic
    const countyConnection = clientData.county
      ? {
          connectOrCreate: {
            where: {
              stateCode: clientData.state_code,
              name: clientData.county,
            },
            create: {
              stateCode: clientData.state_code,
              name: clientData.county,
            },
          },
        }
      : undefined;

    // District connection - both create and update use the same logic
    // Both county and district can be set simultaneously (e.g., US_ID has both)
    const districtConnection = clientData.district
      ? {
          connectOrCreate: {
            where: {
              stateCode: clientData.state_code,
              name: clientData.district,
            },
            create: {
              stateCode: clientData.state_code,
              name: clientData.district,
            },
          },
        }
      : undefined;

    // Load data
    await prismaClient.client.upsert({
      where: {
        externalId: newClient.externalId,
      },
      create: {
        ...newClient,
        county: countyConnection,
        district: districtConnection,
        // When creating, always set the gender
        gender: clientData.gender,
      },
      update: {
        ...newClient,
        county: countyConnection,
        district: districtConnection,
        // When updating, only change the gender if it's defined
        gender: hasKnownGender ? clientData.gender : undefined,
      },
    });
  }
}
