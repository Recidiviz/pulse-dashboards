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

import _ from "lodash";
import { describe, expect, test } from "vitest";

import { prismaClient } from "~sentencing-server/prisma";
import { testAndGetSentryReports } from "~sentencing-server/test/common/utils";
import { testTRPCClient } from "~sentencing-server/test/setup";
import {
  fakeInsight,
  fakeInsightPrismaInput,
} from "~sentencing-server/test/setup/seed";

describe("insight router", () => {
  describe("getInsight", () => {
    test("should return insight if there is a matching one", async () => {
      const returnedInsight = await testTRPCClient.insight.getInsight.query({
        offenseName: fakeInsight.offense,
        lsirScore: 15,
        gender: fakeInsight.gender,
      });

      expect(returnedInsight).toEqual(
        expect.objectContaining({
          ..._.pick(fakeInsight, [
            "gender",
            "assessmentScoreBucketStart",
            "assessmentScoreBucketEnd",
          ]),
          offense: expect.objectContaining({
            name: fakeInsight.offense,
          }),
        }),
      );
    });

    test("should return null if there isn't a matching one", async () => {
      const returnedInsight = await testTRPCClient.insight.getInsight.query({
        offenseName: fakeInsight.offense,
        lsirScore: 100,
        gender: fakeInsight.gender,
      });

      expect(returnedInsight).toBeNull();
    });

    test("should capture exception and return first insight if there are multiple", async () => {
      // Create a new insight that the fake case still applies to (this one just has a very large assessment bucket range)
      await prismaClient.insight.create({
        data: {
          ...fakeInsightPrismaInput,
          assessmentScoreBucketStart: 0,
          assessmentScoreBucketEnd: 100,
        },
      });

      const returnedInsight = await testTRPCClient.insight.getInsight.query({
        offenseName: fakeInsight.offense,
        lsirScore: 15,
        gender: fakeInsight.gender,
      });

      expect(returnedInsight).toEqual(
        expect.objectContaining({
          gender: fakeInsight.gender,
          offense: expect.objectContaining({
            name: fakeInsight.offense,
          }),
        }),
      );

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Multiple insights found for attributes offense name of offense-name, gender of FEMALE, and LSI-R Score of 15",
      );
    });
  });
});
