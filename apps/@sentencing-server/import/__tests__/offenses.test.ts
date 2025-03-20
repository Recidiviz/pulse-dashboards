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

import { StateCode } from "@prisma/sentencing-server/client";

import { OFFENSES_FILE_NAME } from "~@sentencing-server/import/constants";
import { getImportHandler } from "~@sentencing-server/import/handler";
import { testPrismaClient } from "~@sentencing-server/import/test/setup";
import {
  TEST_OFFENSES_FILE_NAME,
  TEST_STATE_CODE,
} from "~@sentencing-server/import/test/setup/constants";
import {
  fakeMandatoryMinimum,
  fakeOffense,
} from "~@sentencing-server/import/test/setup/seed";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import offense data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should import new offenses", async () => {
    dataProviderSingleton.setData(TEST_OFFENSES_FILE_NAME, [
      // Old offense
      {
        state_code: StateCode.US_ID,
        charge: fakeOffense.name,
        is_sex_offense: false,
        frequency: 100,
        mandatory_minimums: [
          {
            SentenceType: fakeMandatoryMinimum.sentenceType,
            MinimumSentenceLength: fakeMandatoryMinimum.minimumSentenceLength,
            MaximumSentenceLength: fakeMandatoryMinimum.maximumSentenceLength,
            StatuteNumber: fakeMandatoryMinimum.statuteNumber,
            StatuteLink: fakeMandatoryMinimum.statuteLink,
          },
        ],
      },
      // New offense
      {
        state_code: StateCode.US_ID,
        charge: "new-offense",
        is_sex_offense: false,
        frequency: 10,
        mandatory_minimums: [
          {
            SentenceType: "TERM",
            MinimumSentenceLength: 1,
            MaximumSentenceLength: 100,
          },
        ],
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [OFFENSES_FILE_NAME]);

    // Check that the new offense was created
    const dbOffenses = await testPrismaClient.offense.findMany({
      include: { mandatoryMinimums: true },
    });

    // There should only be two offenses in the database - the old one should have been preserved and the new one created
    expect(dbOffenses).toHaveLength(2);

    expect(dbOffenses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: fakeOffense.name,
          isSexOffense: false,
          // This should be explicitly updated to null
          isViolentOffense: null,
          frequency: 100,
          mandatoryMinimums: expect.arrayContaining([
            expect.objectContaining({
              sentenceType: fakeMandatoryMinimum.sentenceType,
              minimumSentenceLength: fakeMandatoryMinimum.minimumSentenceLength,
              maximumSentenceLength: fakeMandatoryMinimum.maximumSentenceLength,
              statuteNumber: fakeMandatoryMinimum.statuteNumber,
              statuteLink: fakeMandatoryMinimum.statuteLink,
            }),
          ]),
        }),
        expect.objectContaining({
          name: "new-offense",
          isSexOffense: false,
          isViolentOffense: null,
          frequency: 10,
          mandatoryMinimums: expect.arrayContaining([
            expect.objectContaining({
              sentenceType: "TERM",
              minimumSentenceLength: 1,
              maximumSentenceLength: 100,
            }),
          ]),
        }),
      ]),
    );
  });

  test("should throw error if existing offense is missing", async () => {
    dataProviderSingleton.setData(TEST_OFFENSES_FILE_NAME, [
      // New offense
      {
        state_code: StateCode.US_ID,
        charge: "new-offense",
        frequency: 10,
      },
    ]);

    await expect(() =>
      importHandler.import(TEST_STATE_CODE, [OFFENSES_FILE_NAME]),
    ).rejects.toThrowError(
      "Error when importing offenses! These offenses exist in the database but are missing from the data import: offense-name",
    );
  });

  test("should not throw any errors if missing offense is a placeholder one", async () => {
    await testPrismaClient.offense.create({
      data: {
        stateCode: "US_ID",
        name: "[PLACEHOLDER] Ben's offense",
      },
    });

    // Missing the placeholder offense
    dataProviderSingleton.setData(TEST_OFFENSES_FILE_NAME, [
      // Old offense
      {
        state_code: StateCode.US_ID,
        charge: fakeOffense.name,
        is_sex_offense: false,
        frequency: 100,
      },
      // New offense
      {
        state_code: StateCode.US_ID,
        charge: "new-offense",
        is_sex_offense: false,
        frequency: 10,
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [OFFENSES_FILE_NAME]);

    // Check that the new offense was created
    const dbOffenses = await testPrismaClient.offense.findMany();

    // There should be three offenses in the database - the real old one, the placeholder old one, and the new one
    expect(dbOffenses).toHaveLength(3);

    expect(dbOffenses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: fakeOffense.name,
          isSexOffense: false,
          // This should be explicitly updated to null
          isViolentOffense: null,
          frequency: 100,
        }),
        expect.objectContaining({
          name: "new-offense",
          isSexOffense: false,
          isViolentOffense: null,
          frequency: 10,
        }),
        expect.objectContaining({
          name: "[PLACEHOLDER] Ben's offense",
        }),
      ]),
    );
  });

  test("should override provided mandatory minimums", async () => {
    dataProviderSingleton.setData(TEST_OFFENSES_FILE_NAME, [
      // Old offense
      {
        state_code: StateCode.US_ID,
        charge: fakeOffense.name,
        is_sex_offense: false,
        frequency: 100,
        // New mandatory minimum
        mandatory_minimums: [
          {
            SentenceType: "PROBATION",
            MinimumSentenceLength: 1,
            MaximumSentenceLength: 2,
            StatuteNumber: "L202",
          },
        ],
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [OFFENSES_FILE_NAME]);

    // Check that the new offense was created
    const dbOffenses = await testPrismaClient.offense.findMany({
      include: { mandatoryMinimums: true },
    });
    expect(dbOffenses).toHaveLength(1);

    expect(dbOffenses).toEqual([
      expect.objectContaining({
        name: fakeOffense.name,
        isSexOffense: false,
        // This should be explicitly updated to null
        isViolentOffense: null,
        frequency: 100,
        mandatoryMinimums: [
          expect.objectContaining({
            sentenceType: "PROBATION",
            minimumSentenceLength: 1,
            maximumSentenceLength: 2,
            statuteNumber: "L202",
          }),
        ],
      }),
    ]);
  });
});
