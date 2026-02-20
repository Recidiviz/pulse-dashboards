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

import { docTreatmentHistoryImportSchema } from "~@sentencing/import/models";
import { PrismaClient } from "~@sentencing/prisma/client";

export async function transformAndLoadDOCTreatmentHistoryData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof docTreatmentHistoryImportSchema>>,
) {
  // Get existing client external IDs
  const clientExternalIds = new Set(
    (
      await prismaClient.client.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );

  for await (const treatmentData of data) {
    const clientExternalId = treatmentData.client_external_id;

    // Skip if client doesn't exist
    if (!clientExternalIds.has(clientExternalId)) {
      console.warn(
        `Skipping DOC treatment history for client ${clientExternalId}: client not found`,
      );
      continue;
    }

    // Process each completed program
    for (const program of treatmentData.completed_programs) {
      // Check if record already exists (by client, program name, and completion date)
      // eslint-disable-next-line no-await-in-loop
      const existingRecord = await prismaClient.dOCTreatmentHistory.findFirst({
        where: {
          clientExternalId,
          programName: program.program_name,
          completedOn: program.completion_date,
        },
      });

      if (existingRecord) {
        // Update if exists
        // eslint-disable-next-line no-await-in-loop
        await prismaClient.dOCTreatmentHistory.update({
          where: { id: existingRecord.id },
          data: {
            programCategory: program.category,
            programName: program.program_name,
            completedOn: program.completion_date,
          },
        });
      } else {
        // Create new
        // eslint-disable-next-line no-await-in-loop
        await prismaClient.dOCTreatmentHistory.create({
          data: {
            clientExternalId,
            programCategory: program.category,
            programName: program.program_name,
            completedOn: program.completion_date,
          },
        });
      }
    }
  }
}
