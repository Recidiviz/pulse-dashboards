// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { caseNoteInsightsImportSchema } from "~@meetings/import/models";
import { CaseNoteInsightsSummaryCreateInput } from "~@meetings/import/types";
import {
  bulkUpdate,
  type BulkUpdateEntries,
  BulkUpdateEntry,
} from "~@meetings/import/utils/common";
import { PrismaClient } from "~@meetings/prisma/client";

export async function transformAndLoadCaseNoteInsightsSummaryData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof caseNoteInsightsImportSchema>>,
) {
  const BATCH_SIZE = 500;
  const importedAt = new Date();

  const existingSummaries = await prismaClient.caseNoteInsightsSummary.findMany(
    {
      select: {
        clientId: true,
        category: true,
      },
    },
  );

  const existingClientIdsAndCategories = new Set(
    existingSummaries.map(
      ({ clientId, category }) => `${clientId}+${category}`,
    ),
  );

  let categoryToImport: string | undefined;
  let createBatch: CaseNoteInsightsSummaryCreateInput[] = [];
  let updateBatch: BulkUpdateEntries = [];

  const flushCreateBatch = async () => {
    if (createBatch.length === 0) return;
    await prismaClient.caseNoteInsightsSummary.createMany({
      data: createBatch,
    });
    createBatch = [];
  };

  const flushUpdateBatch = async () => {
    if (updateBatch.length === 0) return;
    await bulkUpdate(
      prismaClient,
      "CaseNoteInsightsSummary",
      ["clientId", "category"],
      updateBatch,
    );
    updateBatch = [];
  };

  for await (const summaryData of data) {
    // Look at the data we're importing to determing the current category
    categoryToImport ??= summaryData.category;
    const newSummary = {
      stateCode: summaryData.state_code,
      clientId: summaryData.person_id,
      category: summaryData.category,
      cniFields: summaryData.cni_fields,
      lastImportedAt: importedAt,
    } satisfies CaseNoteInsightsSummaryCreateInput & BulkUpdateEntry;

    if (
      existingClientIdsAndCategories.has(
        `${summaryData.person_id}+${summaryData.category}`,
      )
    ) {
      updateBatch.push(newSummary);
      if (updateBatch.length >= BATCH_SIZE) await flushUpdateBatch();
    } else {
      createBatch.push(newSummary);
      if (createBatch.length >= BATCH_SIZE) await flushCreateBatch();
    }
  }

  await flushCreateBatch();
  await flushUpdateBatch();

  // Delete summaries in this category that are not present in this import.
  // Using lastImportedAt avoids passing all IDs as query parameters (which hits DB limits at scale).
  if (categoryToImport !== undefined) {
    await prismaClient.caseNoteInsightsSummary.deleteMany({
      where: { category: categoryToImport, lastImportedAt: { lt: importedAt } },
    });
  }
}
