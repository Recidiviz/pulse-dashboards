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

import { Gender, StateCode } from "@prisma/sentencing-server/client";
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { testAndGetSentryReports } from "~@sentencing-server/trpc/test/common/utils";
import {
  testPrismaClient,
  testTRPCClient,
} from "~@sentencing-server/trpc/test/setup";
import {
  fakeInsight,
  fakeInsightPrismaInput,
} from "~@sentencing-server/trpc/test/setup/seed";

describe("insight router", () => {
  describe("getInsight", () => {
    describe("without overrides", () => {
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
            offense: fakeInsight.offense,
          }),
        );
      });

      test("should return undefined if there isn't a matching one", async () => {
        const returnedInsight = await testTRPCClient.insight.getInsight.query({
          offenseName: fakeInsight.offense,
          lsirScore: 100,
          gender: fakeInsight.gender,
        });

        expect(returnedInsight).toBeUndefined();
      });

      test("should capture exception and return first insight if there are multiple", async () => {
        // Create a new insight that the fake case still applies to (this one just has a very large assessment bucket range)
        await testPrismaClient.insight.create({
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
            offense: fakeInsight.offense,
          }),
        );

        const sentryReports = await testAndGetSentryReports();
        expect(sentryReports[0].error?.message).toContain(
          "Multiple insights found for attributes offense name of offense-name, gender of FEMALE, LSI-R Score of 15",
        );
      });
    });

    describe("with overrides", () => {
      beforeEach(async () => {
        await testPrismaClient.insight.deleteMany();
      });

      describe("level 5 (combined offense category)", () => {
        test("should return another level 5 rollup if there is a match", async () => {
          // Create three new insights:
          // 1. One for our fake offense that has a level 5 rollup but is labeled as a sex offense + drug offense rollup, which won't match our search parameters
          // 2. One that matches to a different offense but has a level 5 rollup that is labeled as a violent offense rollup, but not a drug offense rollup, which won't match our search parameters
          // 3. One that matches to a different offense but has a level 5 rollup that is labeled as a violent + drug offense rollup, which should match our search parameters
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: "Violent offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 2,
              dispositionNumRecords: 2,
            },
          });
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense-2",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: "Violent offense, Drug Offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries:
                fakeInsightPrismaInput.rollupRecidivismSeries,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 3,
              dispositionNumRecords: 3,
            },
          });

          // Look for an insight that that should only have a violent offense rollup
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              // The offense name, gender, and lsir score buckets should match the original offense
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Violent drug offenses",
              // The recidivism data should match the new insight while the rollup data should match the original one
              rollupRecidivismNumRecords: 3,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("should handle level 5 rollup for Non-* everything", async () => {
          // Create three new insights:
          // 1. One for our fake offense that has a level 5 rollup but is labeled as a sex offense rollup, which won't match our search parameters
          // 2. One that matches to a different offense but has a level 5 rollup that is labeled as a violent offense rollup, which won't match our search parameters
          // 3. One that matches to a different offense but has a level 5 rollup that is labeled as a Non-* everything rollup, which should match our search parameters
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: "Sex offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: "Violent offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 2,
              dispositionNumRecords: 2,
            },
          });
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense-2",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory:
                "Non-violent offense, Non-drug, Non-sex Offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries:
                fakeInsightPrismaInput.rollupRecidivismSeries,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 3,
              dispositionNumRecords: 3,
            },
          });

          // Look for an insight that that should only have a violent offense rollup
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: false,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              // The offense name, gender, and lsir score buckets should match the original offense
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription:
                "Nonviolent offenses, not sex- or drug-related",
              // The recidivism data should match the new insight while the rollup data should match the original one
              rollupRecidivismNumRecords: 3,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("should handle level 5 rollup for everything true", async () => {
          // Create three new insights:
          // 1. One for our fake offense that has a level 5 rollup but is labeled as a drug offense rollup, which won't match our search parameters
          // 2. One that matches to a different offense but has a level 5 rollup that is labeled as a Non-* everything rollup, which won't match our search parameters
          // 3. One that matches to a different offense but has a level 5 rollup that is labeled as a everything true rollup, which should match our search parameters
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: "Drug offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory:
                "Non-violent, Non-drug, Non-sex offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 2,
              dispositionNumRecords: 2,
            },
          });
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense-2",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: "Violent, Drug, Sex offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries:
                fakeInsightPrismaInput.rollupRecidivismSeries,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 3,
              dispositionNumRecords: 3,
            },
          });

          // Look for an insight that that should only have a violent offense rollup
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: true,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              // The offense name, gender, and lsir score buckets should match the original offense
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Violent, drug-related sex offenses",
              // The recidivism data should match the new insight while the rollup data should match the original one
              rollupRecidivismNumRecords: 3,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("should return a level 6 rollup if there is no level 5 match", async () => {
          // Create two new insights:
          // 1. One for our fake offense that has a level 5 rollup (combined offense category) but is labeled as a sex offense + drug offense rollup, which won't match our search parameters
          // 2. One that matches to a different offense but has a level 6 rollup that is labeled as a violent offense rollup, which should match our search parameters
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense-2",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: true,
              rollupRecidivismSeries:
                fakeInsightPrismaInput.rollupRecidivismSeries,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 3,
              dispositionNumRecords: 3,
            },
          });

          // Look for an insight that that should only have a violent offense rollup
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              // The offense name, gender, and lsir score buckets should match the original offense
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Violent offenses",
              // The recidivism data should match the new insight while the rollup data should match the original one
              rollupRecidivismNumRecords: 3,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("should return a level 7 rollup if there is no level 5 or 6 match", async () => {
          // Create two new insights:
          // 1. One for our fake offense that has a level 5 rollup (combined offense category) but is labeled as a sex offense + drug offense rollup, which won't match our search parameters
          // 2. One that matches to a different offense but has a level 7 rollup (just a state code)
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense-2",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: null,
              rollupRecidivismSeries:
                fakeInsightPrismaInput.rollupRecidivismSeries,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 3,
              dispositionNumRecords: 3,
            },
          });

          // Look for an insight that that should only have a violent offense rollup
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              // The offense name, gender, and lsir score buckets should match the original offense
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "All offenses in Idaho",
              // The recidivism data should match the new insight while the rollup data should match the original one
              rollupRecidivismNumRecords: 3,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });
      });

      describe("level 6 (violent offense)", () => {
        test("should return a another level 6 rollup if there is a match", async () => {
          // Create two new insights:
          // 1. One for our fake offense that has a level 6 rollup but is labeled as a non-violent rollup, which won't match our search parameters
          // 2. One that matches to a different offense but has a level 6 rollup that is labeled as a violent offense rollup, which should match our search parameters
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: false,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense-2",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: true,
              rollupRecidivismSeries:
                fakeInsightPrismaInput.rollupRecidivismSeries,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 3,
              dispositionNumRecords: 3,
            },
          });

          // Look for an insight that that should only have a violent offense rollup
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              // The offense name, gender, and lsir score buckets should match the original offense
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Violent offenses",
              // The recidivism data should match the new insight while the rollup data should match the original one
              rollupRecidivismNumRecords: 3,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("should return a level 7 rollup if there is no level 6 match", async () => {
          // Create two new insights:
          // 1. One for our fake offense that has a level 6 rollup but is labeled as a non-violent rollup, which won't match our search parameters
          // 2. One that matches to a different offense but has a level 7 rollup (just a state code)
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: false,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                create: {
                  stateCode: StateCode.US_ID,
                  name: "different-offense-2",
                },
              },
              assessmentScoreBucketStart: 0,
              assessmentScoreBucketEnd: 0,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffenseId: undefined,
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: null,
              rollupRecidivismSeries:
                fakeInsightPrismaInput.rollupRecidivismSeries,
              dispositionData: undefined,
              rollupRecidivismNumRecords: 3,
              dispositionNumRecords: 3,
            },
          });

          // Look for an insight that that should only have a violent offense rollup
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              // The offense name, gender, and lsir score buckets should match the original offense
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "All offenses in Idaho",
              // The recidivism data should match the new insight while the rollup data should match the original one
              rollupRecidivismNumRecords: 3,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });
      });
    });

    describe("formatted offense descriptions", () => {
      beforeEach(async () => {
        await testPrismaClient.insight.deleteMany();
      });

      describe("rollup offense", () => {
        test("rollupOffense + lsir score buckets + gender (level 1)", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
                },
              },
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupStateCode: "US_ID",
              rollupGender: Gender.MALE,
              rollupAssessmentScoreBucketStart: 10,
              rollupAssessmentScoreBucketEnd: 20,
              rollupOffense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
                },
              },
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: Gender.MALE,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: Gender.MALE,
              rollupAssessmentScoreBucketStart: 10,
              rollupAssessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "offense-name offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Just rollupOffense (level 2)", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
                },
              },
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupOffense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
                },
              },
              rollupNcicCategory: null,
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: Gender.MALE,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: Gender.MALE,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "offense-name offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });
      });

      describe("ncic category", () => {
        test("rollupNcicCategory + lsir score buckets + gender (level 3)", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: Gender.MALE,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
                },
              },
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupStateCode: "US_ID",
              rollupGender: Gender.MALE,
              rollupAssessmentScoreBucketStart: 10,
              rollupAssessmentScoreBucketEnd: 20,
              rollupNcicCategory: "Larceny offenses",
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: Gender.MALE,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: Gender.MALE,
              rollupAssessmentScoreBucketStart: 10,
              rollupAssessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Larceny offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Just rollupNcicCategory (level 4)", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
                },
              },
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupNcicCategory: "Larceny offenses",
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Larceny offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("rollupNcicCategory without the word offense in it (level 4)", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
                },
              },
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupStateCode: "US_ID",
              rollupGender: null,
              rollupAssessmentScoreBucketStart: null,
              rollupAssessmentScoreBucketEnd: null,
              rollupNcicCategory: "Dangerous Drugs",
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Dangerous Drugs offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });
      });

      describe("Combined offense categories (level 5)", () => {
        test("Non-violent, Non-sex, Non-drug", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory:
                "Non-violent, Non-sex, Non-drug offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: false,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription:
                "Nonviolent offenses, not sex- or drug-related",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Violent, Drug, Sex", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: "Violent, Sex, Drug offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: true,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Violent, drug-related sex offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Violent, Drug", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: "Violent, Drug offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Violent drug offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Violent, Sex", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: "Violent, Sex offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: true,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Violent sex offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Violent", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: "Violent offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: true,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription:
                "Violent offenses, not sex- or drug-related",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Drug, Sex", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: "Drug, Sex offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: true,
              isViolentOffense: false,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Drug-related nonviolent sex offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Drug", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: "Drug offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: false,
              isViolentOffense: false,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Nonviolent drug offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Sex", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: "Sex offense",
              rollupViolentOffense: null,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
              isSexOffense: true,
              isViolentOffense: false,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Nonviolent sex offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });
      });

      describe("Violent uniform (level 6)", () => {
        test("Violent", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: true,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Violent offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });

        test("Nonviolent", async () => {
          await testPrismaClient.insight.create({
            data: {
              stateCode: "US_ID",
              gender: fakeInsight.gender,
              offense: {
                connect: {
                  stateCode: StateCode.US_ID,
                  name: fakeInsight.offense,
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
              rollupCombinedOffenseCategory: null,
              rollupViolentOffense: false,
              rollupRecidivismSeries: undefined,
              dispositionData: fakeInsightPrismaInput.dispositionData,
              rollupRecidivismNumRecords: 1,
              dispositionNumRecords: 1,
            },
          });

          // Look for an insight that matches the offense
          const returnedInsight = await testTRPCClient.insight.getInsight.query(
            {
              offenseName: fakeInsight.offense,
              lsirScore: 15,
              gender: fakeInsight.gender,
            },
          );

          expect(returnedInsight).toEqual(
            expect.objectContaining({
              offense: fakeInsight.offense,
              gender: fakeInsight.gender,
              assessmentScoreBucketStart: 10,
              assessmentScoreBucketEnd: 20,
              rollupOffenseDescription: "Nonviolent offenses",
              rollupRecidivismNumRecords: 1,
              rollupRecidivismSeries: expect.any(Object),
              dispositionNumRecords: 1,
              dispositionData: expect.any(Array),
            }),
          );
        });
      });

      test("Statewide (level 7)", async () => {
        await testPrismaClient.insight.create({
          data: {
            stateCode: "US_ID",
            gender: fakeInsight.gender,
            offense: {
              connect: {
                stateCode: StateCode.US_ID,
                name: fakeInsight.offense,
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
            rollupCombinedOffenseCategory: null,
            rollupViolentOffense: null,
            rollupRecidivismSeries: undefined,
            dispositionData: fakeInsightPrismaInput.dispositionData,
            rollupRecidivismNumRecords: 1,
            dispositionNumRecords: 1,
          },
        });

        // Look for an insight that matches the offense
        const returnedInsight = await testTRPCClient.insight.getInsight.query({
          offenseName: fakeInsight.offense,
          lsirScore: 15,
          gender: fakeInsight.gender,
        });

        expect(returnedInsight).toEqual(
          expect.objectContaining({
            offense: fakeInsight.offense,
            gender: fakeInsight.gender,
            assessmentScoreBucketStart: 10,
            assessmentScoreBucketEnd: 20,
            rollupOffenseDescription: "All offenses in Idaho",
            rollupRecidivismNumRecords: 1,
            rollupRecidivismSeries: expect.any(Object),
            dispositionNumRecords: 1,
            dispositionData: expect.any(Array),
          }),
        );
      });
    });
  });
});
