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

import { clientHistoryImportSchema } from "~@sentencing/import/models";
import { PrismaClient } from "~@sentencing/prisma/client";

export async function transformAndLoadClientHistoryData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof clientHistoryImportSchema>>,
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
        `Skipping client history for client ${clientExternalId}: client not found`,
      );
      continue;
    }

    // Process each completed program
    if (treatmentData.completed_programs) {
      for (const program of treatmentData.completed_programs) {
        // Each program's create-or-update path depends on the existence check result — can't batch
        // eslint-disable-next-line no-await-in-loop
        const existingRecord = await prismaClient.dOCTreatmentHistory.findFirst(
          {
            where: {
              clientExternalId,
              programName: program.program_name,
              completedOn: program.completion_date,
            },
          },
        );

        if (existingRecord) {
          // Depends on existingRecord.id from the findFirst above — sequential dependency
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
          // Same sequential dependency — proceeds only when findFirst returned null
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

    const employmentHistory = treatmentData.employment_history;
    if (employmentHistory) {
      // Find all SARs for this client where employment history hasn't been manually updated
      // Records are processed per-client from an async generator; sequential awaits are necessary

      const sars = await prismaClient.sentencingAssessmentReport.findMany({
        where: {
          clientId: clientExternalId,
          hasManuallyUpdatedEmploymentHistory: false,
        },
        select: { id: true },
      });

      if (sars.length > 0) {
        const sarIds = sars.map((s) => s.id);
        // Transaction depends on sarIds from the findMany above — must follow sequentially

        await prismaClient.$transaction([
          prismaClient.employmentHistory.deleteMany({
            where: {
              sentencingAssessmentReportId: { in: sarIds },
              importedFromDOC: true,
            },
          }),
          prismaClient.employmentHistory.createMany({
            data: sarIds.flatMap((sarId) =>
              employmentHistory.map((job) => ({
                sentencingAssessmentReportId: sarId,
                employerName: job.employer_name,
                startDate: job.start_date ?? null,
                endDate: job.end_date ?? null,
                verifiedByReportAuthor: true,
                importedFromDOC: true,
              })),
            ),
          }),
        ]);
      }
    }
  }
}
