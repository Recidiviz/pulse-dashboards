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

import { Gender, PrismaClient } from "@prisma/sentencing-server/client";
import { z } from "zod";

import { clientImportSchema } from "~@sentencing-server/import/models";

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
    const existingClient = await prismaClient.case.findUnique({
      where: { externalId: clientData.external_id },
      include: {
        county: true,
      },
    });
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

    const createCountyConnection = clientData.county
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
    const createDistrictConnection =
      !clientData.county && clientData.district
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

    // If we don't ingest a county, do nothing so we don't override the county the user sets
    const updateCountyConnection = clientData.county
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
    // Disconnect the district if we have a county, since the district connected to the county will be the source of truth
    // If we don't ingest a district, we can disconnect it too because we'll create a county or the user will set a county at which point,
    // we'll use the district connected to the county as the source of truth
    const updateDistrictConnection =
      existingClient?.county || clientData.county || !clientData.district
        ? { disconnect: true }
        : {
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
          };

    // Load data
    await prismaClient.client.upsert({
      where: {
        externalId: newClient.externalId,
      },
      create: {
        ...newClient,
        county: createCountyConnection,
        district: createDistrictConnection,
        // When creating, always set the gender
        gender: clientData.gender,
      },
      update: {
        ...newClient,
        county: updateCountyConnection,
        district: updateDistrictConnection,
        // When updating, only change the gender if it's defined
        gender: hasKnownGender ? clientData.gender : undefined,
      },
    });
  }
}
