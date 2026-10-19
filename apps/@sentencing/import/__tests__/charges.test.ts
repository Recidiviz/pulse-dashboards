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

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test } from "vitest";

import { CHARGES_FILE_NAME } from "~@sentencing/import/constants";
import { chargeImportSchema } from "~@sentencing/import/models";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import {
  createSAR,
  fakeOffense,
  SAR_EXTERNAL_ID,
} from "~@sentencing/import/test/setup/seed";
import {
  importFile,
  ImportRowOverrides,
} from "~@sentencing/import/test/setup/utils";
import { StateCode } from "~@sentencing/prisma/client";
import { getMostSevereCharges } from "~@sentencing/trpc-types";

const charge = (
  offense: string,
  classificationType: string | null,
  classificationSubtype: string | null,
) => ({ offense, classificationType, classificationSubtype });

function createChargeImportRow(
  overrides: ImportRowOverrides<typeof chargeImportSchema> = {},
) {
  return {
    state_code: StateCode.US_MO,
    case_external_id: SAR_EXTERNAL_ID,
    court_case_number: "22CR-00001",
    offense_external_id: faker.string.uuid(),
    description: "ROBBERY 1ST DEGREE",
    ...overrides,
  };
}

// Charges are only imported for SAR states, so they run with US_MO's loaders.
async function importCharges(rows: unknown[]) {
  await importFile(CHARGES_FILE_NAME, rows, StateCode.US_MO);
}

async function createCharge(data: Record<string, unknown>) {
  return testPrismaClient.charge.create({
    data: {
      offense: "OLD OFFENSE",
      sentencingAssessmentReport: { connect: { externalId: SAR_EXTERNAL_ID } },
      ...data,
    },
  });
}

describe("getMostSevereCharges", () => {
  test("returns empty array for empty input", () => {
    expect(getMostSevereCharges([])).toEqual([]);
  });

  test("returns the single charge when there is only one", () => {
    const result = getMostSevereCharges([
      charge("Drug Possession", "FELONY", "B"),
    ]);
    expect(result).toEqual([
      { offenseName: "Drug Possession", offenseClass: "Felony B" },
    ]);
  });

  test("returns the unambiguous most severe charge", () => {
    const result = getMostSevereCharges([
      charge("Speeding", "INFRACTION", null),
      charge("Drug Trafficking", "FELONY", "A"),
      charge("Theft", "MISDEMEANOR", "B"),
    ]);
    expect(result).toEqual([
      { offenseName: "Drug Trafficking", offenseClass: "Felony A" },
    ]);
  });

  test("breaks ties by subtype — Felony A beats Felony B", () => {
    const result = getMostSevereCharges([
      charge("Lesser Felony", "FELONY", "B"),
      charge("Greater Felony", "FELONY", "A"),
    ]);
    expect(result).toEqual([
      { offenseName: "Greater Felony", offenseClass: "Felony A" },
    ]);
  });

  test("returns all tied charges when multiple share the top rank", () => {
    const result = getMostSevereCharges([
      charge("Drug Trafficking", "FELONY", "A"),
      charge("Assault", "FELONY", "A"),
      charge("Theft", "MISDEMEANOR", "B"),
    ]);
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        { offenseName: "Drug Trafficking", offenseClass: "Felony A" },
        { offenseName: "Assault", offenseClass: "Felony A" },
      ]),
    );
  });

  test("returns top-tier charges as a tie when a felony is unclassified (U)", () => {
    // An unclassified felony can be more severe than a Felony C, so the user
    // must pick instead of auto-selecting. The misdemeanor is excluded.
    const result = getMostSevereCharges([
      charge("Burglary", "FELONY", "C"),
      charge("Unclassified Felony", "FELONY", "U"),
      charge("Theft", "MISDEMEANOR", "A"),
    ]);
    expect(result).toEqual([
      { offenseName: "Burglary", offenseClass: "Felony C" },
      { offenseName: "Unclassified Felony", offenseClass: "Felony U" },
    ]);
  });

  test("returns both charges as a tie when there are two unclassified felonies (U)", () => {
    const result = getMostSevereCharges([
      charge("Unclassified Felony 1", "FELONY", "U"),
      charge("Unclassified Felony 2", "FELONY", "U"),
      charge("Theft", "MISDEMEANOR", "A"),
    ]);
    expect(result).toEqual([
      { offenseName: "Unclassified Felony 1", offenseClass: "Felony U" },
      { offenseName: "Unclassified Felony 2", offenseClass: "Felony U" },
    ]);
  });

  test("ignores a misdemeanor without a subtype when there is a felony", () => {
    const result = getMostSevereCharges([
      charge("Drug Trafficking", "FELONY", "B"),
      charge("Trespassing", "MISDEMEANOR", null),
    ]);
    expect(result).toEqual([
      { offenseName: "Drug Trafficking", offenseClass: "Felony B" },
    ]);
  });

  test("returns misdemeanors as a tie when one has no subtype and there are no felonies", () => {
    const result = getMostSevereCharges([
      charge("Theft", "MISDEMEANOR", "A"),
      charge("Trespassing", "MISDEMEANOR", null),
      charge("Speeding", "INFRACTION", null),
    ]);
    expect(result).toEqual([
      { offenseName: "Theft", offenseClass: "Misdemeanor A" },
      { offenseName: "Trespassing", offenseClass: "Misdemeanor" },
    ]);
  });

  test("treats null classification as least severe", () => {
    const result = getMostSevereCharges([
      charge("Unknown", null, null),
      charge("Speeding", "INFRACTION", null),
    ]);
    expect(result).toEqual([
      { offenseName: "Speeding", offenseClass: "Infraction" },
    ]);
  });

  test("returns all charges when all are unclassified (tied)", () => {
    const result = getMostSevereCharges([
      charge("Unknown A", null, null),
      charge("Unknown B", null, null),
    ]);
    expect(result).toHaveLength(2);
  });

  test("formats offenseClass without subtype when subtype is null", () => {
    const result = getMostSevereCharges([
      charge("Trespassing", "MISDEMEANOR", null),
    ]);
    expect(result).toEqual([
      { offenseName: "Trespassing", offenseClass: "Misdemeanor" },
    ]);
  });

  test("formats offenseClass as null when charge is unclassified", () => {
    const result = getMostSevereCharges([charge("Unknown", null, null)]);
    expect(result).toEqual([{ offenseName: "Unknown", offenseClass: null }]);
  });

  test("detects a new tie when a same-tier charge is added to an existing winner", () => {
    // Simulates: mostSevereOffenseName was "Murder" (sole Felony A),
    // then re-ingest adds "Robbery" (also Felony A) — should now be a tie,
    // not a no-op, so the FE can prompt the user to pick.
    const result = getMostSevereCharges([
      charge("Murder", "FELONY", "A"),
      charge("Robbery", "FELONY", "A"),
    ]);
    expect(result).toHaveLength(2);
  });

  test("no-op: same single winner returns the same offense name", () => {
    // The update loop skips writing when stored value === computed new value.
    // This test documents what getMostSevereCharges returns in the no-op case.
    const result = getMostSevereCharges([charge("Murder", "FELONY", "A")]);
    expect(result).toEqual([
      { offenseName: "Murder", offenseClass: "Felony A" },
    ]);
  });
});

describe("import charge data", () => {
  beforeEach(async () => {
    await createSAR(testPrismaClient);
  });

  test("should create charges for existing SARs and skip charges for unknown SARs", async () => {
    await importCharges([
      createChargeImportRow({ offense_external_id: "charge-1" }),
      createChargeImportRow({
        offense_external_id: "charge-2",
        case_external_id: "unknown-sar-ext-id",
      }),
    ]);

    const charges = await testPrismaClient.charge.findMany();
    expect(charges).toEqual([
      expect.objectContaining({
        chargeExternalId: "charge-1",
        offense: "ROBBERY 1ST DEGREE",
        causeNum: "22CR-00001",
      }),
    ]);
  });

  test("should update existing charges in place and keep the fields the officer entered", async () => {
    const pleaDate = new Date("2026-01-15T00:00:00.000Z");
    const existingCharge = await createCharge({
      chargeExternalId: "charge-1",
      causeNum: "22CR-00000",
      prosecutingAttorney: "Prosecuting Attorney",
      defenseAttorney: "Defense Attorney",
      pleaAgreement: "Plea agreement",
      pleaDate,
    });

    await importCharges([
      createChargeImportRow({ offense_external_id: "charge-1" }),
    ]);

    // Only the imported fields change. The officer's fields are untouched.
    expect(await testPrismaClient.charge.findMany()).toEqual([
      {
        ...existingCharge,
        offense: "ROBBERY 1ST DEGREE",
        causeNum: "22CR-00001",
        updatedAt: expect.any(Date),
      },
    ]);
  });

  test("should keep imported fields that are missing from the import", async () => {
    const existingCharge = await createCharge({
      chargeExternalId: "charge-1",
      classificationType: "FELONY",
      classificationSubtype: "A",
      division: "Division 1",
      county: "Boone",
      moCode: "1234567",
    });

    await importCharges([
      createChargeImportRow({ offense_external_id: "charge-1" }),
    ]);

    expect(await testPrismaClient.charge.findMany()).toEqual([
      {
        ...existingCharge,
        offense: "ROBBERY 1ST DEGREE",
        causeNum: "22CR-00001",
        updatedAt: expect.any(Date),
      },
    ]);
  });

  test("should delete charges that are no longer in the import", async () => {
    await createCharge({ chargeExternalId: "stale-charge" });

    await importCharges([
      createChargeImportRow({ offense_external_id: "charge-1" }),
    ]);

    const charges = await testPrismaClient.charge.findMany();
    expect(charges.map(({ chargeExternalId }) => chargeExternalId)).toEqual([
      "charge-1",
    ]);
  });

  test("should delete the charges of SARs that have none in the import", async () => {
    await createSAR(testPrismaClient, { externalId: "other-sar-ext-id" });
    await testPrismaClient.charge.create({
      data: {
        offense: "OLD OFFENSE",
        chargeExternalId: "other-sar-charge",
        sentencingAssessmentReport: {
          connect: { externalId: "other-sar-ext-id" },
        },
      },
    });

    await importCharges([
      createChargeImportRow({ offense_external_id: "charge-1" }),
    ]);

    const charges = await testPrismaClient.charge.findMany();
    expect(charges.map(({ chargeExternalId }) => chargeExternalId)).toEqual([
      "charge-1",
    ]);
  });

  test("should create a charge for each row, even when two rows are the same charge", async () => {
    await importCharges([
      createChargeImportRow({ offense_external_id: "charge-1" }),
      createChargeImportRow({ offense_external_id: "charge-1" }),
    ]);

    expect(await testPrismaClient.charge.count()).toBe(2);
  });

  test("should create offenses for new charge descriptions without changing existing ones", async () => {
    await importCharges([
      createChargeImportRow({ description: fakeOffense.name }),
      createChargeImportRow({ description: "NEW OFFENSE" }),
    ]);

    const offenses = await testPrismaClient.offense.findMany({
      orderBy: { name: "asc" },
    });
    expect(offenses).toEqual([
      expect.objectContaining({ name: "NEW OFFENSE", stateCode: "US_MO" }),
      expect.objectContaining({
        name: fakeOffense.name,
        stateCode: fakeOffense.stateCode,
        isViolentOffense: fakeOffense.isViolentOffense,
        frequency: fakeOffense.frequency,
      }),
    ]);
  });

  test("should store a single judge as a list", async () => {
    await importCharges([createChargeImportRow({ judges: "Judge Smith" })]);

    const charge = await testPrismaClient.charge.findFirst();
    expect(charge?.judgeNames).toEqual(["Judge Smith"]);
  });

  test("should set the SAR's most severe offense", async () => {
    await importCharges([
      createChargeImportRow({
        description: "THEFT",
        classification_type: "MISDEMEANOR",
        classification_subtype: "B",
      }),
      createChargeImportRow({
        description: "ROBBERY 1ST DEGREE",
        classification_type: "FELONY",
        classification_subtype: "A",
      }),
    ]);

    const sar = await testPrismaClient.sentencingAssessmentReport.findUnique({
      where: { externalId: SAR_EXTERNAL_ID },
    });
    expect(sar?.mostSevereOffenseName).toEqual("ROBBERY 1ST DEGREE");
  });
});
