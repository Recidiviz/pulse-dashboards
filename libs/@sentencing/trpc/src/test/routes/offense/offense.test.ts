// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { testPrismaClient, testTRPCClient } from "~@sentencing/trpc/test/setup";
import {
  fakeInsightPrismaInput,
  fakeOffense,
} from "~@sentencing/trpc/test/setup/seed";

describe("offense router", () => {
  describe("getOffenses", () => {
    test("should return only offenses that have insights", async () => {
      // Create a new offense that won't have an insight
      await testPrismaClient.offense.create({
        data: {
          stateCode: fakeOffense.stateCode,
          name: "New Offense",
          isSexOffense: false,
          isViolentOffense: true,
          frequency: 10,
        },
      });

      const returnedOffenses = await testTRPCClient.offense.getOffenses.query();

      // Only the original fake offense should be returned
      expect(returnedOffenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: fakeOffense.name,
            isSexOffense: false,
            isViolentOffense: true,
            frequency: fakeOffense.frequency,
          }),
        ]),
      );
    });

    test("should not return placeholder offenses", async () => {
      // Create a new offense with the placeholder text
      await testPrismaClient.offense.createMany({
        data: [
          {
            stateCode: fakeOffense.stateCode,
            name: "[PLACEHOLDER] Ben's Offense",
            isSexOffense: false,
            isViolentOffense: true,
            frequency: 10,
          },
        ],
      });

      // Create an insight for the new offense so that isn't the reason it's not returned
      await testPrismaClient.insight.create({
        data: {
          stateCode: "US_ID",
          gender: "MALE",
          offense: {
            connect: {
              stateCode: fakeOffense.stateCode,
              name: "[PLACEHOLDER] Ben's Offense",
            },
          },
          assessmentScoreBucketStart: 10,
          assessmentScoreBucketEnd: 20,
          rollupStateCode: "US_ID",
          rollupGender: null,
          rollupAssessmentScoreBucketStart: null,
          rollupAssessmentScoreBucketEnd: null,
          rollupOffenseId: undefined,
          rollupNcicCategory: null,
          rollupCombinedOffenseCategory: "Sex offense, Drug offense",
          rollupViolentOffense: null,
          rollupRecidivismSeries: undefined,
          dispositionData: fakeInsightPrismaInput.dispositionData,
          rollupRecidivismNumRecords: 1,
          dispositionNumRecords: 1,
        },
      });

      const returnedOffenses = await testTRPCClient.offense.getOffenses.query();

      expect(returnedOffenses).toHaveLength(1);
      // Only the original fake offense should be returned
      expect(returnedOffenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: fakeOffense.name,
            isSexOffense: false,
            isViolentOffense: true,
            frequency: fakeOffense.frequency,
          }),
        ]),
      );
    });
  });
});
