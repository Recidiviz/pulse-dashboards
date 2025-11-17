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

import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { testTRPCClient } from "~@sentencing/trpc/test/setup";
import { fakeSAR, fakeSARClient } from "~@sentencing/trpc/test/setup/seed";

describe("SAR router", () => {
  describe("getSAR", () => {
    test("should return SAR if SAR exists", async () => {
      const returnedSAR = await testTRPCClient.sar.getSAR.query({
        id: fakeSAR.id,
      });

      expect(returnedSAR).toEqual(
        expect.objectContaining({
          id: fakeSAR.id,
          externalId: fakeSAR.externalId,
          status: fakeSAR.status,
          requestingJudgeName: fakeSAR.requestingJudgeName,
          dateRequested: fakeSAR.dateRequested,
          dateDueToCourt: fakeSAR.dateDueToCourt,
          division: fakeSAR.division,
          address: fakeSAR.address,
          needsToBeAddressed: fakeSAR.needsToBeAddressed,
          otherNeedToBeAddressed: fakeSAR.otherNeedToBeAddressed,
          mitigatingFactors: fakeSAR.mitigatingFactors,
          otherMitigatingFactor: fakeSAR.otherMitigatingFactor,
          levelOfEducation: fakeSAR.levelOfEducation,
          assessmentScore: fakeSAR.assessmentScore,
          assessmentType: fakeSAR.assessmentType,
          assessmentDate: fakeSAR.assessmentDate,
          assessmentAdministeredBy: fakeSAR.assessmentAdministeredBy,
          criminalHistoryLevel: fakeSAR.criminalHistoryLevel,
          educationLevelScore: fakeSAR.educationLevelScore,
          neighborhoodLevel: fakeSAR.neighborhoodLevel,
          substanceAbuseLevel: fakeSAR.substanceAbuseLevel,
          familySocialSupportLevel: fakeSAR.familySocialSupportLevel,
          peerAssociatesLevel: fakeSAR.peerAssociatesLevel,
          criminalBehaviorLevel: fakeSAR.criminalBehaviorLevel,
          defendantStatement: fakeSAR.defendantStatement,
          victimImpactStatement: fakeSAR.victimImpactStatement,
          criminalHistorySummary: fakeSAR.criminalHistorySummary,
          employerAtOffense: fakeSAR.employerAtOffense,
          currentEmployer: fakeSAR.currentEmployer,
          employmentSummary: fakeSAR.employmentSummary,
          familyAndSocialSupportSummary: fakeSAR.familyAndSocialSupportSummary,
          homePlan: fakeSAR.homePlan,
          housingSummary: fakeSAR.housingSummary,
          drugHistorySummary: fakeSAR.drugHistorySummary,
          peerAssociatesSummary: fakeSAR.peerAssociatesSummary,
          criminalAttitudesSummary: fakeSAR.criminalAttitudesSummary,
          responsivityAndBarriersSummary:
            fakeSAR.responsivityAndBarriersSummary,
          communityStrategyRecommendation:
            fakeSAR.communityStrategyRecommendation,
          institutionalStrategyRecommendation:
            fakeSAR.institutionalStrategyRecommendation,
          metadata: null,
          client: {
            ..._.pick(fakeSARClient, [
              "fullName",
              "gender",
              "ssn",
              "externalId",
              "birthDate",
            ]),
          },
          charges: expect.arrayContaining([]),
          drugHistories: expect.arrayContaining([]),
        }),
      );
    });

    test("should throw error if SAR does not exist", async () => {
      await expect(() =>
        testTRPCClient.sar.getSAR.query({
          id: "not-a-real-id",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Sentencing Assessment Report with that id was not found",
        }),
      );
    });
  });
});
