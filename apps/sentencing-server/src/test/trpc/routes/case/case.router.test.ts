import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { prismaClient } from "~sentencing-server/prisma";
import { testTRPCClient } from "~sentencing-server/test/setup";
import {
  fakeCase,
  fakeDispositions,
  fakeInsight,
  fakeOffense,
  fakeRecidivismSeries,
} from "~sentencing-server/test/setup/seed";

describe("case router", () => {
  describe("getCase", () => {
    test("should return case if case exists", async () => {
      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(
        _.omit({ ...fakeCase, recommendedOpportunities: [] }, "externalId"),
      );
    });

    test("should throw error if case does not exist", async () => {
      await expect(() =>
        testTRPCClient.case.getCase.query({
          id: "not-a-real-id",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Case with that id was not found",
        }),
      );
    });
  });

  describe("updateCase", () => {
    test("should update case", async () => {
      await testTRPCClient.case.updateCase.mutate({
        id: fakeCase.id,
        attributes: {
          offense: fakeOffense.name,
          previouslyIncarceratedOrUnderSupervision: true,
          hasPreviousFelonyConviction: true,
          hasPreviousViolentOffenseConviction: true,
          hasPreviousSexOffenseConviction: true,
          previousTreatmentCourt: "Previous Treatment Court",
          substanceUseDisorderDiagnosis: "Moderate",
          asamCareRecommendation: "MedicallyManagedResidential",
          mentalHealthDiagnoses: ["Schizophrenia", "Other"],
          hasDevelopmentalDisability: false,
          isVeteran: false,
          plea: "NotGuilty",
          hasOpenChildProtectiveServicesCase: false,
          needsToBeAddressed: ["FamilyServices", "JobTrainingOrOpportunities"],
          status: "InProgress",
          currentOnboardingTopic: "OffenseLsirScore",
        },
      });

      const updatedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(updatedCase).toEqual(
        expect.objectContaining({
          offense: fakeOffense.name,
          previouslyIncarceratedOrUnderSupervision: true,
          hasPreviousFelonyConviction: true,
          hasPreviousViolentOffenseConviction: true,
          hasPreviousSexOffenseConviction: true,
          previousTreatmentCourt: "Previous Treatment Court",
          substanceUseDisorderDiagnosis: "Moderate",
          asamCareRecommendation: "MedicallyManagedResidential",
          mentalHealthDiagnoses: ["Schizophrenia", "Other"],
          hasDevelopmentalDisability: false,
          isVeteran: false,
          plea: "NotGuilty",
          hasOpenChildProtectiveServicesCase: false,
          needsToBeAddressed: ["FamilyServices", "JobTrainingOrOpportunities"],
          status: "InProgress",
        }),
      );
    });

    test("should throw error if case does not exist", async () => {
      await expect(() =>
        testTRPCClient.case.updateCase.mutate({
          id: "not-a-real-id",
          attributes: {},
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Case with that id was not found",
        }),
      );
    });

    test("should throw error if lsir score is locked and lsirScore is provided", async () => {
      await prismaClient.case.update({
        where: { id: fakeCase.id },
        data: { isLsirScoreLocked: true },
      });

      await expect(() =>
        testTRPCClient.case.updateCase.mutate({
          id: fakeCase.id,
          attributes: {
            lsirScore: 10,
          },
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "LSIR score is locked and cannot be updated",
        }),
      );
    });
  });

  describe("getInsightForCase", () => {
    test("should return insight if case has necessary information", async () => {
      const returnedInsight = await testTRPCClient.case.getInsightForCase.query(
        {
          id: fakeCase.id,
        },
      );

      expect(returnedInsight).toEqual(
        expect.objectContaining({
          ..._.pick(fakeInsight, [
            "gender",
            "assessmentScoreBucketStart",
            "assessmentScoreBucketEnd",
            "recidivismRollupOffense",
            "recidivismNumRecords",
            "stateCode",
            "dispositionNumRecords",
          ]),
          recidivismSeries: expect.arrayContaining(
            fakeRecidivismSeries.map((series) =>
              expect.objectContaining({
                recommendationType: series.recommendationType,
                dataPoints: expect.arrayContaining(
                  series.dataPoints.map((dataPoint) =>
                    expect.objectContaining({
                      cohortMonths: dataPoint.cohortMonths,
                      eventRate: expect.closeTo(dataPoint.eventRate),
                      lowerCI: expect.closeTo(dataPoint.lowerCI),
                      upperCI: expect.closeTo(dataPoint.upperCI),
                    }),
                  ),
                ),
              }),
            ),
          ),
          dispositionData: expect.arrayContaining(
            fakeDispositions.map((disposition) =>
              expect.objectContaining({
                ...disposition,
                percentage: expect.closeTo(disposition.percentage),
              }),
            ),
          ),
          offense: fakeInsight.offense,
        }),
      );
    });

    test("should throw error if case does not exist", async () => {
      await expect(() =>
        testTRPCClient.case.getCase.query({
          id: "not-a-real-id",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Case with that id was not found",
        }),
      );
    });

    test("should throw error if there is no lsir score for case", async () => {
      // Set lsir score to null to trigger error
      await prismaClient.case.update({
        where: { id: fakeCase.id },
        data: { lsirScore: null },
      });

      await expect(() =>
        testTRPCClient.case.getInsightForCase.query({
          id: fakeCase.id,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "Case with that id is missing an lsir score. Cannot retrieve an insight without an lsir score.",
        }),
      );
    });

    test("should throw error if there is no offense for case", async () => {
      // Set offense to null to trigger error
      await prismaClient.case.update({
        where: { id: fakeCase.id },
        data: { offenseId: null },
      });

      await expect(() =>
        testTRPCClient.case.getInsightForCase.query({
          id: fakeCase.id,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "Case with that id is missing an offense. Cannot retrieve an insight without an offense.",
        }),
      );
    });

    test("should throw error if there is no insight matching case", async () => {
      await prismaClient.insight.deleteMany({});

      await expect(() =>
        testTRPCClient.case.getInsightForCase.query({
          id: fakeCase.id,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "No corresponding insight found for provided case.",
        }),
      );
    });
  });
});
