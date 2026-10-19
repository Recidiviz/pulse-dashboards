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

import { describe, expect, test } from "vitest";

import { CLIENT_HISTORY_FILE_NAME } from "~@sentencing/import/constants";
import { clientHistoryImportSchema } from "~@sentencing/import/models";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import { createSAR, fakeClient } from "~@sentencing/import/test/setup/seed";
import {
  importFile,
  ImportRowOverrides,
} from "~@sentencing/import/test/setup/utils";
import {
  StateCode,
  TreatmentProgramCategory,
} from "~@sentencing/prisma/client";

const COMPLETED_ON = new Date("2025-06-01T00:00:00.000Z");
const EMPLOYMENT_START = new Date("2024-01-01T00:00:00.000Z");
const EMPLOYMENT_END = new Date("2025-01-01T00:00:00.000Z");

/** A row for the seeded client. Tests pass the fields they care about. */
function createClientHistoryImportRow(
  overrides: ImportRowOverrides<typeof clientHistoryImportSchema> = {},
) {
  return {
    state_code: StateCode.US_MO,
    client_external_id: fakeClient.externalId,
    ...overrides,
  };
}

const completedProgram = {
  category: "COGNITIVE",
  program_name: "Thinking for a Change",
  start_date: "2025-01-01",
  completion_date: COMPLETED_ON,
};

const job = {
  employer_name: "New Employer",
  start_date: EMPLOYMENT_START,
  end_date: EMPLOYMENT_END,
};

async function importClientHistory(rows: unknown[]) {
  await importFile(CLIENT_HISTORY_FILE_NAME, rows, StateCode.US_MO);
}

function findEmploymentHistory(sentencingAssessmentReportId: string) {
  return testPrismaClient.employmentHistory.findMany({
    where: { sentencingAssessmentReportId },
    orderBy: { employerName: "asc" },
  });
}

describe("import client history data", () => {
  describe("completed programs", () => {
    test("should create completed programs for existing clients", async () => {
      await importClientHistory([
        createClientHistoryImportRow({
          completed_programs: [completedProgram],
        }),
      ]);

      expect(await testPrismaClient.dOCTreatmentHistory.findMany()).toEqual([
        expect.objectContaining({
          clientExternalId: fakeClient.externalId,
          programCategory: TreatmentProgramCategory.Cognitive,
          programName: completedProgram.program_name,
          completedOn: COMPLETED_ON,
        }),
      ]);
    });

    test("should update a program's category instead of duplicating it on re-import", async () => {
      await testPrismaClient.dOCTreatmentHistory.create({
        data: {
          clientExternalId: fakeClient.externalId,
          programCategory: TreatmentProgramCategory.Education,
          programName: completedProgram.program_name,
          completedOn: COMPLETED_ON,
        },
      });

      await importClientHistory([
        createClientHistoryImportRow({
          completed_programs: [completedProgram],
        }),
      ]);

      expect(await testPrismaClient.dOCTreatmentHistory.findMany()).toEqual([
        expect.objectContaining({
          programCategory: TreatmentProgramCategory.Cognitive,
        }),
      ]);
    });

    test("should skip rows for clients that aren't in the database", async () => {
      await importClientHistory([
        createClientHistoryImportRow({
          client_external_id: "unknown-client-ext-id",
          completed_programs: [completedProgram],
        }),
      ]);

      expect(await testPrismaClient.dOCTreatmentHistory.count()).toBe(0);
    });
  });

  describe("employment history", () => {
    test("should replace imported employment history and keep entries the officer added", async () => {
      const sar = await createSAR(testPrismaClient, {
        employmentHistories: {
          create: [
            { employerName: "Old Employer", importedFromDOC: true },
            { employerName: "Officer Added Employer", importedFromDOC: false },
          ],
        },
      });

      await importClientHistory([
        createClientHistoryImportRow({ employment_history: [job] }),
      ]);

      expect(await findEmploymentHistory(sar.id)).toEqual([
        expect.objectContaining({
          employerName: "New Employer",
          startDate: EMPLOYMENT_START,
          endDate: EMPLOYMENT_END,
          importedFromDOC: true,
          verifiedByReportAuthor: true,
        }),
        expect.objectContaining({
          employerName: "Officer Added Employer",
          importedFromDOC: false,
        }),
      ]);
    });

    test("should copy employment history to each of the client's open SARs", async () => {
      const firstSAR = await createSAR(testPrismaClient);
      const secondSAR = await createSAR(testPrismaClient, {
        externalId: "sar-ext-2",
      });

      await importClientHistory([
        createClientHistoryImportRow({ employment_history: [job] }),
      ]);

      const newEmployer = [
        expect.objectContaining({ employerName: "New Employer" }),
      ];
      expect(await findEmploymentHistory(firstSAR.id)).toEqual(newEmployer);
      expect(await findEmploymentHistory(secondSAR.id)).toEqual(newEmployer);
    });

    test.each([
      [
        "the officer has edited it",
        { hasManuallyUpdatedEmploymentHistory: true },
      ],
      [
        "the SAR is complete",
        { completionDate: new Date("2026-01-01T00:00:00.000Z") },
      ],
    ])(
      "should not add, update, or delete employment history once %s",
      async (_, sarFields) => {
        const sar = await createSAR(testPrismaClient, {
          ...sarFields,
          employmentHistories: {
            create: [
              {
                employerName: "Officer Added Employer",
                importedFromDOC: false,
              },
              // Even entries from an earlier import are left alone.
              { employerName: "Old Employer", importedFromDOC: true },
            ],
          },
        });
        const before = await findEmploymentHistory(sar.id);
        expect(before).toHaveLength(2);

        await importClientHistory([
          createClientHistoryImportRow({ employment_history: [job] }),
        ]);

        expect(await findEmploymentHistory(sar.id)).toEqual(before);
      },
    );
  });
});
