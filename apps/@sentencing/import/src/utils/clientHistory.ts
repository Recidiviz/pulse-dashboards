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

import { clientHistoryImportSchema } from "~@sentencing/import/models";
import {
  bulkUpsert,
  chunkForStatement,
  inBatches,
} from "~@sentencing/import/utils/batching";
import { PrismaClient } from "~@sentencing/prisma/client";

type EmploymentHistoryRow = NonNullable<
  z.infer<typeof clientHistoryImportSchema>["employment_history"]
>[number];

// A client's program is identified by its name and completion date.
const programKey = (
  clientExternalId: string,
  programName: string | null,
  completedOn: Date | null,
) => `${clientExternalId}|${programName}|${completedOn?.toISOString()}`;

/**
 * Replaces the imported employment history on each client's SARs. Skips
 * reports whose employment history the officer has edited, and completed
 * reports, which shouldn't change underneath them.
 */
async function loadEmploymentHistory(
  prismaClient: PrismaClient,
  jobsByClient: Map<string, EmploymentHistoryRow[]>,
) {
  if (jobsByClient.size === 0) return;

  const sars = await prismaClient.sentencingAssessmentReport.findMany({
    where: {
      clientId: { in: [...jobsByClient.keys()] },
      hasManuallyUpdatedEmploymentHistory: false,
      completionDate: null,
    },
    select: { id: true, clientId: true },
  });
  if (sars.length === 0) return;

  const newEmploymentHistory = sars.flatMap((sar) =>
    (jobsByClient.get(sar.clientId) ?? []).map((job) => ({
      sentencingAssessmentReportId: sar.id,
      employerName: job.employer_name,
      startDate: job.start_date,
      endDate: job.end_date,
      verifiedByReportAuthor: true,
      importedFromDOC: true,
    })),
  );

  // One transaction, so a report never shows its imported jobs half replaced.
  await prismaClient.$transaction([
    ...chunkForStatement(
      sars.map(({ id }) => id),
      1,
    ).map((sarIds) =>
      prismaClient.employmentHistory.deleteMany({
        where: {
          sentencingAssessmentReportId: { in: sarIds },
          importedFromDOC: true,
        },
      }),
    ),
    ...chunkForStatement(newEmploymentHistory, 6).map((chunk) =>
      prismaClient.employmentHistory.createMany({ data: chunk }),
    ),
  ]);
}

export async function transformAndLoadClientHistoryData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof clientHistoryImportSchema>>,
) {
  const clientExternalIds = new Set(
    (
      await prismaClient.client.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );

  // New programs are added as they're written, so a program repeated in a
  // later batch updates the same row.
  const existingProgramIdsByKey = new Map(
    (
      await prismaClient.dOCTreatmentHistory.findMany({
        select: {
          id: true,
          clientExternalId: true,
          programName: true,
          completedOn: true,
        },
      })
    ).map((program) => [
      programKey(
        program.clientExternalId,
        program.programName,
        program.completedOn,
      ),
      program.id,
    ]),
  );

  for await (const batch of inBatches(data)) {
    const rows = batch.filter((treatmentData) => {
      if (!clientExternalIds.has(treatmentData.client_external_id)) {
        console.warn(
          `Skipping client history for client ${treatmentData.client_external_id}: client not found`,
        );
        return false;
      }
      return true;
    });

    // Keyed by program, so a later row for the same program wins.
    const programsByKey = new Map(
      rows.flatMap((treatmentData) =>
        (treatmentData.completed_programs ?? []).map(
          (program) =>
            [
              programKey(
                treatmentData.client_external_id,
                program.program_name,
                program.completion_date,
              ),
              {
                clientExternalId: treatmentData.client_external_id,
                ...program,
              },
            ] as const,
        ),
      ),
    );

    // Existing programs are matched by id, so this updates them in place and
    // inserts the new ones with fresh ids.
    await bulkUpsert(prismaClient, {
      table: "DOCTreatmentHistory",
      rows: [...programsByKey].map(([key, program]) => {
        const id = existingProgramIdsByKey.get(key) ?? randomUUID();
        existingProgramIdsByKey.set(key, id);
        return {
          id,
          clientExternalId: program.clientExternalId,
          // Prisma sets this automatically, but raw SQL has to set it itself.
          updatedAt: new Date(),
          programCategory: program.category,
          programName: program.program_name,
          completedOn: program.completion_date,
        };
      }),
      conflictColumns: ["id"],
      // A category missing from the import leaves the current one in place.
      keepExistingWhenNull: ["programCategory"],
    });

    // A row without employment history leaves the client's in place, so only
    // rows that have it count, and a later row for the same client wins.
    await loadEmploymentHistory(
      prismaClient,
      new Map(
        rows.flatMap(({ client_external_id, employment_history }) =>
          employment_history
            ? [[client_external_id, employment_history] as const]
            : [],
        ),
      ),
    );
  }
}
