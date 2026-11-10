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

import { FIELD_KEYS } from "~@idaho-th/shared";
import { staffCaller } from "~@idaho-th/trpc/test/caller";
import {
  createAiExtractionMetrics,
  createHousingApplication,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

/**
 * One scanned application. `scannedAt` defaults to now, which is inside the
 * service's default trailing window (see aiExtractionMetrics.service.test.ts
 * for window-boundary coverage — this file only exercises the router).
 */
async function seedScan({
  submitted = false,
  overriddenFields = [],
}: { submitted?: boolean; overriddenFields?: string[] } = {}) {
  const application = await createHousingApplication(testPrismaClient);

  return createAiExtractionMetrics(testPrismaClient, {
    applicationId: application.id,
    submittedAt: submitted ? new Date() : null,
    overriddenFieldCount: overriddenFields.length,
    overriddenFields,
  });
}

describe("aiExtractionMetricsRouter", () => {
  describe("input validation", () => {
    it("rejects a `from` value that cannot be coerced to a date", async () => {
      await expect(
        staffCaller().aiExtractionMetrics.getOverrides({
          from: "not-a-date",
        } as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a `to` value that cannot be coerced to a date", async () => {
      await expect(
        staffCaller().aiExtractionMetrics.getOverrides({
          to: "not-a-date",
        } as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("accepts an empty input and applies the default trailing window", async () => {
      await expect(
        staffCaller().aiExtractionMetrics.getOverrides({}),
      ).resolves.toBeDefined();
    });
  });

  describe("getOverrides", () => {
    it("returns aggregated override metrics for the authenticated staff caller", async () => {
      // Distinct counts per field so the ORDER BY count DESC result is deterministic.
      await seedScan({
        submitted: true,
        overriddenFields: [FIELD_KEYS.dob, FIELD_KEYS.age],
      });
      await seedScan({ submitted: true, overriddenFields: [FIELD_KEYS.dob] });
      await seedScan();

      const result = await staffCaller().aiExtractionMetrics.getOverrides({});

      expect(result).toMatchObject({
        applicationsScanned: 3,
        applicationsSubmitted: 2,
        totalOverrides: 3,
        avgOverridesPerApplicationSubmitted: 1.5,
        overridesByField: [
          { field: FIELD_KEYS.dob, count: 2 },
          { field: FIELD_KEYS.age, count: 1 },
        ],
      });
    });
  });
});
