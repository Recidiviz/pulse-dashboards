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

  for await (const chargeData of data) {
    const sarExternalId = chargeData.case_external_id;

    // Skip if SAR doesn't exist
    if (!sarExternalIds.has(sarExternalId)) {
      console.warn(`Skipping charge for SAR ${sarExternalId}: SAR not found`);
      continue;
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

    // Transform county to title case (e.g., "DAVI" -> "Davi")
    const countyTitleCase = chargeData.county
      ? chargeData.county.charAt(0).toUpperCase() +
        chargeData.county.slice(1).toLowerCase()
      : undefined;

    const chargeFields = {
      chargeExternalId: chargeData.offense_external_id,
      offense: chargeData.description,
      causeNum: chargeData.court_case_number,
      judgeNames: chargeData.judges ?? [],
      classificationType: chargeData.classification_type,
      classificationSubtype: chargeData.classification_subtype,
      division: chargeData.division,
      county: countyTitleCase,
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
  }
}
