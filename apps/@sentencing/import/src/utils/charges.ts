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

import { chargeImportSchema } from "~@sentencing/import/models";
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
  const sarExternalIds = new Set(
    (
      await prismaClient.sentencingAssessmentReport.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );

  if (sarExternalIds.size === 0) {
    return;
  }

  // Collect all charge records so we can iterate over them multiple times (first to upsert Offense records, then to load Charges):
  const allCharges: z.infer<typeof chargeImportSchema>[] = [];
  for await (const chargeData of data) {
    allCharges.push(chargeData);
  }

  // SAR uses a separate Charge table (not the shared Offense table) because PSI and SAR
  // have almost no field overlap. However, Insight records are keyed off Offense.name,
  // so we upsert one Offense row per unique charge description here to make the
  // Insight lookup work for SAR clients.
  const uniqueOffenses = [
    ...new Map(allCharges.map((c) => [c.description, c])).values(),
  ];

  // Process sequentially to avoid exhausting the Prisma connection pool
  for (const chargeData of uniqueOffenses) {
    // eslint-disable-next-line no-await-in-loop
    await prismaClient.offense.upsert({
      where: { name: chargeData.description },
      create: {
        stateCode: chargeData.state_code,
        name: chargeData.description,
      },
      update: {},
    });
  }

  // Batch-fetch all existing charges for the relevant SARs to avoid N+1 queries
  const existingChargesBySarAndExternalId = new Map(
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
      c,
    ]),
  );

  // Process sequentially to avoid exhausting the Prisma connection pool
  for (const chargeData of allCharges) {
    const sarExternalId = chargeData.case_external_id;

    // Skip if SAR doesn't exist
    if (!sarExternalIds.has(sarExternalId)) {
      console.warn(`Skipping charge for SAR ${sarExternalId}: SAR not found`);
      continue;
    }

    // Look up existing charge by SAR + chargeExternalId using pre-fetched map
    // (a case can have multiple charges with the same court case number)
    // Use the offense_external_id from source to uniquely identify the charge
    const existingCharge = existingChargesBySarAndExternalId.get(
      `${sarExternalId}|${chargeData.offense_external_id}`,
    );

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

    const chargeFields = {
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

    if (existingCharge) {
      // eslint-disable-next-line no-await-in-loop
      await prismaClient.charge.update({
        where: { id: existingCharge.id },
        data: chargeFields,
      });
    } else {
      // eslint-disable-next-line no-await-in-loop
      await prismaClient.charge.create({
        data: {
          ...chargeFields,
          sentencingAssessmentReport: {
            connect: { externalId: sarExternalId },
          },
        },
      });
    }
  }

  await updateMostSevereOffenses(prismaClient, [...sarExternalIds]);
}
