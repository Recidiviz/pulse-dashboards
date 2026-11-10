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
import { getOverrides } from "~@idaho-th/trpc/routes/aiExtractionMetrics/aiExtractionMetrics.service";
import {
  createAiExtractionMetrics,
  createHousingApplication,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * MS_PER_DAY;

type ScanOptions = {
  scannedAt?: Date;
  submitted?: boolean;
  overriddenFields?: string[];
};

/**
 * One scanned application. `scannedAt` defaults to now, which is inside the
 * service's default trailing window.
 */
async function seedScan({
  scannedAt,
  submitted = false,
  overriddenFields = [],
}: ScanOptions = {}) {
  const application = await createHousingApplication(testPrismaClient);

  return createAiExtractionMetrics(testPrismaClient, {
    applicationId: application.id,
    scannedAt,
    submittedAt: submitted ? scannedAt ?? new Date() : null,
    overriddenFieldCount: overriddenFields.length,
    overriddenFields,
  });
}

describe("getOverrides", () => {
  test("defaults to a trailing 30-day window and aggregates scan/override totals", async () => {
    await seedScan({
      submitted: true,
      overriddenFields: [FIELD_KEYS.dob, FIELD_KEYS.age, FIELD_KEYS.gender],
    });
    await seedScan({
      submitted: true,
      overriddenFields: [FIELD_KEYS.dob, FIELD_KEYS.age],
    });
    await seedScan({ submitted: true, overriddenFields: [FIELD_KEYS.dob] });
    await seedScan();
    // Outside the trailing window, so none of its numbers may show up below.
    await seedScan({
      scannedAt: new Date(Date.now() - 60 * MS_PER_DAY),
      submitted: true,
      overriddenFields: [FIELD_KEYS.ssnLast4],
    });

    const result = await getOverrides(testPrismaClient, {});

    expect(result.applicationsScanned).toBe(4);
    expect(result.applicationsSubmitted).toBe(3);
    expect(result.totalOverrides).toBe(6);
    expect(result.avgOverridesPerApplicationSubmitted).toBe(2);
    expect(result.overridesByField).toEqual([
      { field: FIELD_KEYS.dob, count: 3 },
      { field: FIELD_KEYS.age, count: 2 },
      { field: FIELD_KEYS.gender, count: 1 },
    ]);
    expect(result.window.to.getTime() - result.window.from.getTime()).toBe(
      THIRTY_DAYS_MS,
    );
  });

  test("returns a zero average instead of dividing by zero when nothing was scanned", async () => {
    const result = await getOverrides(testPrismaClient, {});

    expect(result.applicationsScanned).toBe(0);
    expect(result.applicationsSubmitted).toBe(0);
    expect(result.totalOverrides).toBe(0);
    expect(result.avgOverridesPerApplicationSubmitted).toBe(0);
    expect(result.overridesByField).toEqual([]);
  });

  test("returns a zero average when applications were scanned but none submitted yet", async () => {
    await seedScan();
    await seedScan();

    const result = await getOverrides(testPrismaClient, {});

    expect(result.applicationsScanned).toBe(2);
    expect(result.applicationsSubmitted).toBe(0);
    expect(result.totalOverrides).toBe(0);
    expect(result.avgOverridesPerApplicationSubmitted).toBe(0);
  });

  test("honors an explicit from/to window", async () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-01-31T00:00:00.000Z");

    await seedScan({
      scannedAt: new Date("2026-01-15T00:00:00.000Z"),
      submitted: true,
      overriddenFields: [FIELD_KEYS.dob],
    });
    await seedScan({
      scannedAt: new Date("2025-12-31T00:00:00.000Z"),
      submitted: true,
      overriddenFields: [FIELD_KEYS.age],
    });
    await seedScan({
      scannedAt: new Date("2026-02-01T00:00:00.000Z"),
      submitted: true,
      overriddenFields: [FIELD_KEYS.gender],
    });

    const result = await getOverrides(testPrismaClient, { from, to });

    expect(result.window).toEqual({ from, to });
    expect(result.applicationsScanned).toBe(1);
    expect(result.applicationsSubmitted).toBe(1);
    expect(result.totalOverrides).toBe(1);
    expect(result.avgOverridesPerApplicationSubmitted).toBe(1);
    expect(result.overridesByField).toEqual([
      { field: FIELD_KEYS.dob, count: 1 },
    ]);
  });
});
