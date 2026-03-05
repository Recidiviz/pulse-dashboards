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

import { countyAndDistrictImportSchema } from "~@sentencing/import/models";
import {
  getMOCountyFullName,
  getMODistrictFullName,
} from "~@sentencing/import/utils/helpers";
import { PrismaClient } from "~@sentencing/prisma/client";

export async function transformAndLoadCountyAndDistrictData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof countyAndDistrictImportSchema>>,
) {
  const newCountyNames = [];

  for await (const countyData of data) {
    // Transform abbreviations to full names for MO
    const countyName =
      countyData.state_code === "US_MO"
        ? getMOCountyFullName(countyData.county)
        : countyData.county;
    const districtName =
      countyData.state_code === "US_MO"
        ? getMODistrictFullName(countyData.district)
        : countyData.district;

    const newCounty = {
      stateCode: countyData.state_code,
      name: countyName,
      district: {
        connectOrCreate: {
          where: {
            name: districtName,
          },
          create: {
            stateCode: countyData.state_code,
            name: districtName,
          },
        },
      },
    };

    newCountyNames.push(newCounty.name);

    // Load data
    await prismaClient.county.upsert({
      where: {
        name: newCounty.name,
      },
      create: newCounty,
      update: newCounty,
    });
  }

  // Delete all of the old counties that weren't just loaded if we haven't hit any errors
  await prismaClient.county.deleteMany({
    where: {
      NOT: {
        name: {
          in: newCountyNames,
        },
      },
    },
  });

  // Delete all of the districts that no longer have counties (that means that they were deleted)
  await prismaClient.district.deleteMany({
    where: {
      counties: {
        none: {},
      },
    },
  });
}
