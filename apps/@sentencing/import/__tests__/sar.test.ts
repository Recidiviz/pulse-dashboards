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

import { CASES_FILE_NAME } from "~@sentencing/import/constants";
import { SARImportSchema } from "~@sentencing/import/models";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  createSAR as createSARForClient,
  fakeClient,
  fakeStaff,
  SAR_EXTERNAL_ID,
} from "~@sentencing/import/test/setup/seed";
import {
  importFile,
  ImportRowOverrides,
} from "~@sentencing/import/test/setup/utils";
import {
  AssessmentType,
  DomainRiskLevel,
  SARReportType,
  StateCode,
} from "~@sentencing/prisma/client";

const DUE_DATE = new Date("2026-11-01T00:00:00.000Z");
const COURT_DATE = new Date("2026-11-15T00:00:00.000Z");

/** A row for SAR_EXTERNAL_ID. Tests pass the fields they care about. */
function createSARImportRow(
  overrides: ImportRowOverrides<typeof SARImportSchema> = {},
) {
  return {
    external_id: SAR_EXTERNAL_ID,
    state_code: StateCode.US_MO,
    staff_id: fakeStaff.externalId,
    client_id: fakeClient.externalId,
    ...overrides,
  };
}

// SARs arrive in the case record file, loaded with US_MO's SAR loaders.
async function importSARs(rows: unknown[]) {
  await importFile(CASES_FILE_NAME, rows, StateCode.US_MO);
}

function createSAR(data: Parameters<typeof createSARForClient>[1] = {}) {
  return createSARForClient(testPrismaClient, data);
}

function findSAR() {
  return testPrismaClient.sentencingAssessmentReport.findUnique({
    where: { externalId: SAR_EXTERNAL_ID },
  });
}

describe("import SAR data", () => {
  test("should create new SARs linked to their staff and client", async () => {
    await importSARs([
      createSARImportRow({ due_date: DUE_DATE, court_date: COURT_DATE }),
    ]);

    expect(await findSAR()).toEqual(
      expect.objectContaining({
        staffId: fakeStaff.externalId,
        clientId: fakeClient.externalId,
        dueDate: DUE_DATE,
        courtDate: COURT_DATE,
        completionDate: null,
      }),
    );
  });

  test("should skip SARs whose client isn't in the database", async () => {
    await importSARs([
      createSARImportRow({ client_id: "unknown-client-ext-id" }),
    ]);

    expect(await findSAR()).toBeNull();
  });

  test("should unlink the staff when they aren't in the database", async () => {
    await createSAR({
      staff: { connect: { externalId: fakeStaff.externalId } },
    });

    await importSARs([
      createSARImportRow({ staff_id: "unknown-staff-ext-id" }),
    ]);

    expect((await findSAR())?.staffId).toBeNull();
  });

  // Unlike cases, which keep a due date the import leaves out, SAR dates are
  // always overwritten by the import, including with null.
  test("should clear dates that are missing from the import", async () => {
    await createSAR({ dueDate: DUE_DATE, courtDate: COURT_DATE });

    await importSARs([createSARImportRow()]);

    expect(await findSAR()).toEqual(
      expect.objectContaining({ dueDate: null, courtDate: null }),
    );
  });

  describe("report type lock", () => {
    test("should default new SARs to SAR and lock the report type", async () => {
      await importSARs([createSARImportRow()]);

      expect(await findSAR()).toEqual(
        expect.objectContaining({
          reportType: SARReportType.SAR,
          isReportTypeLocked: true,
        }),
      );
    });

    test("should leave the report type unlocked for PSRs", async () => {
      await importSARs([createSARImportRow({ report_type: "PSR" })]);

      expect(await findSAR()).toEqual(
        expect.objectContaining({
          reportType: SARReportType.PSR,
          isReportTypeLocked: false,
        }),
      );
    });

    test("should set the report type on existing SARs without a lock", async () => {
      await createSAR({ isReportTypeLocked: null });

      await importSARs([createSARImportRow({ report_type: "PSR" })]);

      expect(await findSAR()).toEqual(
        expect.objectContaining({
          reportType: SARReportType.PSR,
          isReportTypeLocked: false,
        }),
      );
    });

    test("should not overwrite a report type once the lock is set", async () => {
      // An officer changed this PSR's report type in the tool.
      await createSAR({
        reportType: SARReportType.PSR,
        isReportTypeLocked: false,
      });

      await importSARs([createSARImportRow({ report_type: "SAR" })]);

      expect(await findSAR()).toEqual(
        expect.objectContaining({
          reportType: SARReportType.PSR,
          isReportTypeLocked: false,
        }),
      );
    });
  });

  describe("ORAS assessment data", () => {
    test("should import ORAS data for incomplete SARs", async () => {
      const assessmentDate = new Date("2026-09-01T00:00:00.000Z");
      const assignedDate = new Date("2026-09-02T00:00:00.000Z");
      const orasLastUpdated = new Date("2026-09-03T00:00:00.000Z");

      await importSARs([
        createSARImportRow({
          assessment_score: "12",
          assessment_type: "ORAS_COMMUNITY_SUPERVISION",
          assessment_date: assessmentDate,
          assigned_date: assignedDate,
          assessment_administered_by: '"Assessing Officer"',
          oras_last_updated: orasLastUpdated,
          assessment_metadata: [
            {
              domain_name: "Criminal History",
              domain_score: "5",
              domain_risk_level: "3",
            },
            {
              domain_name: "Criminal Attitudes & Behavioral Patterns",
              domain_score: "2",
              domain_risk_level: "1",
            },
            { domain_name: "Age", domain_score: "1" },
            // A score that isn't a number is ignored.
            { domain_name: "Peer Associates", domain_score: "N/A" },
            // So is a domain we don't store.
            { domain_name: "Responsivity", domain_score: "4" },
          ],
        }),
      ]);

      expect(await findSAR()).toEqual(
        expect.objectContaining({
          assessmentScore: 12,
          assessmentType: AssessmentType.ORAS_CST,
          assessmentDate,
          dateRequested: assignedDate,
          // Surrounding quotes from the source data are stripped.
          assessmentAdministeredBy: "Assessing Officer",
          ORASLastUpdatedAt: orasLastUpdated,
          criminalHistoryLevel: 5,
          criminalHistoryRiskLevel: DomainRiskLevel.HIGH,
          criminalBehaviorLevel: 2,
          criminalBehaviorRiskLevel: DomainRiskLevel.LOW,
          ageLevel: 1,
          peerAssociatesLevel: null,
          responsivityLevel: null,
        }),
      );
    });

    test("should not overwrite ORAS data the officer entered manually", async () => {
      await createSAR({ ORASEnteredManually: true, assessmentScore: 7 });

      await importSARs([createSARImportRow({ assessment_score: "12" })]);

      expect((await findSAR())?.assessmentScore).toEqual(7);
    });

    test("should not update ORAS data once a SAR is complete", async () => {
      const completionDate = new Date("2026-10-01T00:00:00.000Z");
      await createSAR({ assessmentScore: 7 });

      await importSARs([
        createSARImportRow({
          completion_date: completionDate,
          assessment_score: "12",
        }),
      ]);

      expect(await findSAR()).toEqual(
        expect.objectContaining({ completionDate, assessmentScore: 7 }),
      );
    });
  });
});
