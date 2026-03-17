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

import _ from "lodash";
import { z } from "zod";

import { chargeImportSchema } from "~@sentencing/import/models";
import { getMOCountyFullName } from "~@sentencing/import/utils/helpers";
import { PrismaClient } from "~@sentencing/prisma/client";

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

  await Promise.all(
    uniqueOffenses.map((chargeData) =>
      prismaClient.offense.upsert({
        where: { name: chargeData.description },
        create: {
          stateCode: chargeData.state_code,
          name: chargeData.description,
        },
        update: {},
      }),
    ),
  );

  await Promise.all(
    allCharges.map(async (chargeData) => {
      const sarExternalId = chargeData.case_external_id;

      // Skip if SAR doesn't exist
      if (!sarExternalIds.has(sarExternalId)) {
        console.warn(`Skipping charge for SAR ${sarExternalId}: SAR not found`);
        return;
      }

      // Find existing charge by SAR + chargeExternalId
      // (a case can have multiple charges with the same court case number)
      // Use the offense_external_id from source to uniquely identify the charge
      const existingCharge = await prismaClient.charge.findFirst({
        where: {
          sentencingAssessmentReport: { externalId: sarExternalId },
          chargeExternalId: chargeData.offense_external_id,
        },
      });

      // Transform county abbreviation to full name for MO, or title case for others
      let countyFullName: string | undefined;
      if (chargeData.county) {
        countyFullName =
          chargeData.state_code === "US_MO"
            ? getMOCountyFullName(chargeData.county)
            : _.startCase(chargeData.county.toLocaleLowerCase());
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
        await prismaClient.charge.update({
          where: { id: existingCharge.id },
          data: chargeFields,
        });
      } else {
        await prismaClient.charge.create({
          data: {
            ...chargeFields,
            sentencingAssessmentReport: {
              connect: { externalId: sarExternalId },
            },
          },
        });
      }
    }),
  );
}
