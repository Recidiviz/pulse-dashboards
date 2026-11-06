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

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { offenseImportSchema } from "~@sentencing/import/models";
import {
  bulkUpsert,
  chunkForStatement,
  inBatches,
  lastRowPerKey,
} from "~@sentencing/import/utils/batching";
import { PLACEHOLDER_SIGNIFIER } from "~@sentencing/prisma";
import { PrismaClient } from "~@sentencing/prisma/client";

export async function transformAndLoadOffenseData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof offenseImportSchema>>,
) {
  const newOffenseNames: string[] = [];

  for await (const batch of inBatches(data)) {
    const offenses = lastRowPerKey(batch, (offenseData) => offenseData.charge);
    newOffenseNames.push(...offenses.map((offenseData) => offenseData.charge));

    const upsertedOffenses = await bulkUpsert<{ id: string; name: string }>(
      prismaClient,
      {
        table: "Offense",
        rows: offenses.map((offenseData) => ({
          // Prisma generates this id, not the database, so new rows need one.
          id: randomUUID(),
          stateCode: offenseData.state_code,
          name: offenseData.charge,
          category: offenseData.recidiviz_offense_category,
          // If the data doesn't specify the value, it's explicitly set to null.
          isSexOffense: offenseData.is_sex_offense ?? null,
          isViolentOffense: offenseData.is_violent ?? null,
          frequency: offenseData.frequency,
        })),
        conflictColumns: ["name"],
        insertOnlyColumns: ["id"],
        // A missing category leaves the current one in place.
        keepExistingWhenNull: ["category"],
        returning: ["id", "name"],
      },
    );
    const offenseIdsByName = new Map(
      upsertedOffenses.map(({ id, name }) => [name, id]),
    );

    // Replace all of the mandatory minimums for these offenses with the new ones
    await prismaClient.mandatoryMinimum.deleteMany({
      where: { offenseId: { in: [...offenseIdsByName.values()] } },
    });
    const mandatoryMinimums = offenses.flatMap(
      (offenseData) =>
        offenseData.mandatory_minimums?.map((m) => ({
          offenseId: offenseIdsByName.get(offenseData.charge) ?? "",
          sentenceType: m.SentenceType,
          minimumSentenceLength: m.MinimumSentenceLength,
          maximumSentenceLength: m.MaximumSentenceLength,
          statuteNumber: m.StatuteNumber,
          statuteLink: m.StatuteLink,
        })) ?? [],
    );
    for (const chunk of chunkForStatement(mandatoryMinimums, 7)) {
      // eslint-disable-next-line no-await-in-loop -- one statement at a time keeps load on the database low
      await prismaClient.mandatoryMinimum.createMany({ data: chunk });
    }
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
  // Offenses missing from the source data have been retired or renamed by the state.
  // Keep them because existing cases still reference them. They drop out of the
  // offense dropdown on their own, since getOffenses only returns offenses with
  // insights and the insights import removes insights that aren't in the source data.
  if (missingExistingOffenses.length > 0) {
    console.warn(
      `These offenses exist in the database but are missing from the data import: ${missingExistingOffenses.map((offense) => offense.name).join(", ")}`,
    );
  }
}
