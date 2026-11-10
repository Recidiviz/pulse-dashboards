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

import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  applyMigration,
  createScratchDb,
  dropScratchDatabases,
  migrationsBefore,
} from "../migrations";

// The backfill runs once against production data, so the shipped SQL file is
// what is under test, replayed on a scratch database.
const MIGRATION = "20261106120000_add_parole_commission_decision";

const OLD_DECISIONS = ["PAROLE_GRANTED", "PAROLE_DENIED", "NOT_APPLICABLE"];

type Seed = {
  q6: string | null;
  old: string | null;
  advanced?: boolean;
  investigation?: string | null;
};

// Q6 spellings covering the cohort rule: trimmed, case-insensitive "rider".
const COHORTS = {
  rider: ["Rider", "  rider "],
  termerOrPv: ["Termer", "Parole Violator", null],
} as const;

let db: Client;

async function seedCase(
  index: number,
  { q6, old, advanced = false, investigation = null }: Seed,
) {
  const applicationId = `app-${index}`;
  const formData = q6 == null ? {} : { legalCurrentStatus: q6 };

  await db.query(
    `INSERT INTO "HousingApplication" ("id", "stateCode", "clientName", "formData", "updatedAt")
     VALUES ($1, 'US_ID', 'Jane Doe', $2, NOW())`,
    [applicationId, JSON.stringify(formData)],
  );
  await db.query(
    `INSERT INTO "StaffHousingApplication" ("id", "applicationId", "staffPseudonymizedId", "updatedAt")
     VALUES ($1, $2, 'staff-1', NOW())`,
    [`staff-${index}`, applicationId],
  );
  await db.query(
    `INSERT INTO "HousingApplicationHomePlan" ("id", "applicationId", "type", "createdByStaffPseudonymizedId", "releaseDecision", "homePlanInvestigation", "approvalsAt", "updatedAt")
     VALUES ($1, $2, 'MANUAL_ADDRESS', 'staff-1', $3, $4, $5, NOW())`,
    [
      `plan-${index}`,
      applicationId,
      old,
      investigation,
      advanced ? new Date() : null,
    ],
  );
  return applicationId;
}

async function readCase(applicationId: string) {
  const { rows } = await db.query(
    `SELECT s."paroleCommissionDecision", p."releaseDecision", p."homePlanInvestigation"
     FROM "StaffHousingApplication" s
     JOIN "HousingApplicationHomePlan" p USING ("applicationId")
     WHERE s."applicationId" = $1`,
    [applicationId],
  );
  return rows[0];
}

const seeds: Seed[] = [...COHORTS.rider, ...COHORTS.termerOrPv].flatMap((q6) =>
  [...OLD_DECISIONS, null].map((old) => ({ q6, old })),
);

// Investigation backfills: a served case that advanced before the gate required
// an investigation, and a Rider N/A the new Rider gate cannot clear.
const INVESTIGATION_CASES: { seed: Seed; expected: string | null }[] = [
  {
    seed: { q6: "Termer", old: "NOT_APPLICABLE", advanced: true },
    expected: "NOT_APPLICABLE",
  },
  {
    seed: { q6: "Termer", old: "NOT_APPLICABLE", advanced: false },
    expected: null,
  },
  {
    seed: {
      q6: "Termer",
      old: "NOT_APPLICABLE",
      advanced: true,
      investigation: "REJECTED",
    },
    expected: "REJECTED",
  },
  {
    seed: { q6: "Termer", old: "PAROLE_GRANTED", advanced: true },
    expected: null,
  },
  {
    seed: { q6: "Rider", old: "NOT_APPLICABLE", advanced: true },
    expected: "APPROVED",
  },
  {
    seed: { q6: "Rider", old: "NOT_APPLICABLE", advanced: false },
    expected: null,
  },
  {
    seed: { q6: "Rider", old: "PAROLE_GRANTED", advanced: true },
    expected: null,
  },
  // A Rider still in Approvals with an N/A investigation the gate never clears.
  {
    seed: { q6: "Rider", old: null, investigation: "NOT_APPLICABLE" },
    expected: null,
  },
  {
    seed: {
      q6: "Rider",
      old: "PAROLE_GRANTED",
      advanced: true,
      investigation: "NOT_APPLICABLE",
    },
    expected: "NOT_APPLICABLE",
  },
  {
    seed: { q6: "Termer", old: null, investigation: "NOT_APPLICABLE" },
    expected: "NOT_APPLICABLE",
  },
];
const applicationIds: string[] = [];
const investigationIds: string[] = [];

beforeAll(async () => {
  db = await createScratchDb("idaho_th_parole_commission_decision");
  for (const name of migrationsBefore(MIGRATION)) {
    // eslint-disable-next-line no-await-in-loop -- migrations apply in order
    await applyMigration(db, name);
  }
  for (const [index, seed] of seeds.entries()) {
    // eslint-disable-next-line no-await-in-loop -- one connection
    applicationIds.push(await seedCase(index, seed));
  }
  for (const [index, { seed }] of INVESTIGATION_CASES.entries()) {
    // eslint-disable-next-line no-await-in-loop -- one connection
    investigationIds.push(await seedCase(seeds.length + index, seed));
  }
  await applyMigration(db, MIGRATION);
}, 120_000);

afterAll(dropScratchDatabases);

const RIDER_MAPPING: Record<string, string | null> = {
  PAROLE_GRANTED: "PROBATION_GRANTED",
  PAROLE_DENIED: "PROBATION_DENIED",
  NOT_APPLICABLE: "PROBATION_GRANTED",
};

describe(`${MIGRATION} backfill`, () => {
  it.each(seeds.map((seed, index) => ({ ...seed, index })))(
    "Q6 $q6 with old decision $old",
    async ({ q6, old, index }) => {
      const isRider = q6?.trim().toLowerCase() === "rider";

      await expect(readCase(applicationIds[index])).resolves.toEqual(
        isRider
          ? {
              paroleCommissionDecision: null,
              releaseDecision: old == null ? null : RIDER_MAPPING[old],
              homePlanInvestigation: null,
            }
          : {
              paroleCommissionDecision: old,
              releaseDecision: null,
              homePlanInvestigation: null,
            },
      );
    },
  );

  it.each(
    INVESTIGATION_CASES.map((testCase, index) => ({ ...testCase, index })),
  )(
    "investigation for Q6 $seed.q6, old $seed.old, advanced $seed.advanced, recorded $seed.investigation",
    async ({ expected, index }) => {
      const { homePlanInvestigation } = await readCase(investigationIds[index]);
      expect(homePlanInvestigation).toBe(expected);
    },
  );
});
