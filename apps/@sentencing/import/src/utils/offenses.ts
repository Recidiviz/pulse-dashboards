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

import { Prisma, PrismaClient } from "@prisma/sentencing/client";
import { z } from "zod";

import { offenseImportSchema } from "~@sentencing/import/models";
import { PLACEHOLDER_SIGNIFIER } from "~@sentencing/prisma";

export async function transformAndLoadOffenseData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof offenseImportSchema>>,
) {
  const newOffenseNames = [];

  for await (const offenseData of data) {
    const newOffense = {
      stateCode: offenseData.state_code,
      name: offenseData.charge,
      // If the data doesn't specify the value, make sure to set it to be explicitly
      // null (passing an undefined value to Prisma will just leave the field as is)
      isSexOffense:
        offenseData.is_sex_offense === undefined
          ? null
          : offenseData.is_sex_offense,
      isViolentOffense:
        offenseData.is_violent === undefined ? null : offenseData.is_violent,
      frequency: offenseData.frequency,
    } satisfies Prisma.OffenseCreateInput | Prisma.OffenseUpdateInput;

    newOffenseNames.push(newOffense.name);

    // Load data
    const upsertedOffense = await prismaClient.offense.upsert({
      where: {
        name: newOffense.name,
      },
      create: newOffense,
      update: {
        ...newOffense,
        // delete all of the existing mandatory minimums because we are replacing them
        //  with the new ones
        mandatoryMinimums: {
          deleteMany: {},
        },
      },
    });

    // Recreate all of the mandatory minimums
    await prismaClient.mandatoryMinimum.createMany({
      data:
        offenseData.mandatory_minimums?.map((m) => ({
          offenseId: upsertedOffense.id,
          sentenceType: m.SentenceType,
          minimumSentenceLength: m.MinimumSentenceLength,
          maximumSentenceLength: m.MaximumSentenceLength,
          statuteNumber: m.StatuteNumber,
          statuteLink: m.StatuteLink,
        })) ?? [],
    });
  }

  const missingExistingOffenses = await prismaClient.offense.findMany({
    where: {
      NOT: [
        {
          name: {
            in: newOffenseNames,
          },
        },
        {
          name: {
            contains: PLACEHOLDER_SIGNIFIER,
          },
        },
      ],
    },
  });
  // If there are any non-placeholder offenses in the database that aren't in the data import, log an error
  if (missingExistingOffenses.length > 0) {
    throw new Error(
      `Error when importing offenses! These offenses exist in the database but are missing from the data import: ${missingExistingOffenses.map((offense) => offense.name).join(", ")}`,
    );
  }
}
