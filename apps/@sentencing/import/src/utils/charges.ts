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

import { chargeImportSchema } from "~@sentencing/import/models";
import { bulkUpsert, lastRowPerKey } from "~@sentencing/import/utils/batching";
import { getMOCountyFullName } from "~@sentencing/import/utils/helpers";
import { PrismaClient } from "~@sentencing/prisma/client";
import { getMostSevereCharges } from "~@sentencing/trpc-types";

async function updateMostSevereOffenses(
  prismaClient: PrismaClient,
  sarExternalIds: string[],
) {
  const sars = await prismaClient.sentencingAssessmentReport.findMany({
    where: { externalId: { in: sarExternalIds } },
    select: {
      id: true,
      mostSevereOffenseName: true,
      charges: {
        select: {
          offense: true,
          classificationType: true,
          classificationSubtype: true,
        },
      },
    },
  });

  const updates: { id: string; mostSevereOffenseName: string | null }[] = [];

  for (const sar of sars) {
    if (sar.charges.length === 0) continue;

    const mostSevere = getMostSevereCharges(sar.charges);

    const newValue = mostSevere.length === 1 ? mostSevere[0].offenseName : null;

    // Skip if no update is needed, to avoid bloating the transaction:
    // - value unchanged (covers single-charge match and null → null tie no-ops)
    // - tie where the current value is already one of the tied offenses (preserve existing choice)
    if (
      sar.mostSevereOffenseName === newValue ||
      (mostSevere.length > 1 &&
        sar.mostSevereOffenseName &&
        mostSevere
          .map((c) => c.offenseName)
          .includes(sar.mostSevereOffenseName))
    ) {
      continue;
    }

    updates.push({ id: sar.id, mostSevereOffenseName: newValue });
  }

  await prismaClient.$transaction(
    updates.map(({ id, mostSevereOffenseName }) =>
      prismaClient.sentencingAssessmentReport.update({
        where: { id },
        data: { mostSevereOffenseName },
      }),
    ),
  );
}

export async function transformAndLoadChargeData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof chargeImportSchema>>,
) {
  // Get existing SAR IDs to check if the referenced SAR exists
  const sarIdsByExternalId = new Map(
    (
      await prismaClient.sentencingAssessmentReport.findMany({
        select: { id: true, externalId: true },
      })
    ).map(({ id, externalId }) => [externalId, id]),
  );
  const sarExternalIds = new Set(sarIdsByExternalId.keys());

  if (sarExternalIds.size === 0) {
    return;
  }

  // Charges are loaded all at once, since the delete below needs every charge
  // in the file.
  const allCharges: z.infer<typeof chargeImportSchema>[] = [];
  for await (const chargeData of data) {
    allCharges.push(chargeData);
  }

  // Batch-fetch all existing charges for the relevant SARs to avoid N+1 queries
  const existingChargeIdsBySarAndExternalId = new Map(
    (
      await prismaClient.charge.findMany({
        where: {
          sentencingAssessmentReport: {
            externalId: { in: [...sarExternalIds] },
          },
        },
        select: {
          id: true,
          chargeExternalId: true,
          sentencingAssessmentReport: { select: { externalId: true } },
        },
      })
    ).map((c) => [
      `${c.sentencingAssessmentReport.externalId}|${c.chargeExternalId}`,
      c.id,
    ]),
  );

  const chargesToLoad = allCharges.filter((chargeData) => {
    // Skip if SAR doesn't exist
    if (!sarExternalIds.has(chargeData.case_external_id)) {
      console.warn(
        `Skipping charge for SAR ${chargeData.case_external_id}: SAR not found`,
      );
      return false;
    }
    return true;
  });

  // A case can have multiple charges with the same court case number, so each
  // charge is identified by its SAR and the offense_external_id from the source.
  const chargeKey = (chargeData: z.infer<typeof chargeImportSchema>) =>
    `${chargeData.case_external_id}|${chargeData.offense_external_id}`;

  // Existing charges are matched by id, so this updates them in place and
  // inserts the new ones with fresh ids.
  await bulkUpsert(prismaClient, {
    table: "Charge",
    rows: lastRowPerKey(chargesToLoad, chargeKey).map((chargeData) => {
      // Transform county abbreviation to full name for MO, or title case for others
      let countyFullName: string | undefined;
      if (chargeData.county) {
        countyFullName =
          chargeData.state_code === "US_MO"
            ? getMOCountyFullName(chargeData.county)
            : chargeData.county
                .toLocaleLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase());
      }

      return {
        id:
          existingChargeIdsBySarAndExternalId.get(chargeKey(chargeData)) ??
          randomUUID(),
        sentencingAssessmentReportId: sarIdsByExternalId.get(
          chargeData.case_external_id,
        ),
        // Prisma sets this automatically, but raw SQL has to set it itself.
        updatedAt: new Date(),
        chargeExternalId: chargeData.offense_external_id,
        offense: chargeData.description,
        causeNum: chargeData.court_case_number,
        judgeNames: chargeData.judges ?? [],
        classificationType: chargeData.classification_type,
        classificationSubtype: chargeData.classification_subtype,
        division: chargeData.division,
        county: countyFullName,
        moCode: chargeData.charge_code,
      };
    }),
    conflictColumns: ["id"],
    // Fields missing from the import leave the current value in place.
    keepExistingWhenNull: [
      "classificationType",
      "classificationSubtype",
      "division",
      "county",
      "moCode",
    ],
  });

  const incomingChargeExternalIds = new Set(
    chargesToLoad.map((c) => c.offense_external_id),
  );

  await prismaClient.charge.deleteMany({
    where: {
      sentencingAssessmentReport: {
        externalId: { in: [...sarExternalIds] },
      },
      chargeExternalId: { notIn: [...incomingChargeExternalIds] },
    },
  });

  await updateMostSevereOffenses(prismaClient, [...sarExternalIds]);
}
