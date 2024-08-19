import { Gender } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~sentencing-server/common/constants";
import { prismaClient } from "~sentencing-server/prisma";
import { testAndGetSentryReport } from "~sentencing-server/test/common/utils";
import { testTRPCClient } from "~sentencing-server/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeDispositions,
  fakeInsight,
  fakeInsightId,
  fakeInsightPrismaInput,
  fakeOffense,
  fakeOpportunity,
  fakeRecidivismSeries,
} from "~sentencing-server/test/setup/seed";

describe("case router", () => {
  describe("getCase", () => {
    test("should return case if case exists", async () => {
      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(
        expect.objectContaining({
          ...fakeCase,
          Client: _.pick(fakeClient, [
            "fullName",
            "gender",
            "county",
            "birthDate",
          ]),
          // Should return an insight object
          insight: expect.objectContaining({
            ...fakeInsight,
            rollupRecidivismSeries: expect.arrayContaining(
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
          }),
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

    test("should return undefined insight if lsir score is missing", async () => {
      // Set lsir score to null
      await prismaClient.case.update({
        where: { id: fakeCase.id },
        data: { lsirScore: null },
      });

      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(
        expect.objectContaining({ insight: undefined }),
      );
    });

    test("should return undefined insight if there is no offense for case", async () => {
      // Set offense to null
      await prismaClient.case.update({
        where: { id: fakeCase.id },
        data: { offenseId: null },
      });

      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(
        expect.objectContaining({ insight: undefined }),
      );
    });

    test("should capture exception if there is no insight matching case", async () => {
      // Delete all insights so nothing matches
      await prismaClient.insight.deleteMany({});

      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(
        expect.objectContaining({ insight: undefined }),
      );

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toContain(
        "No corresponding insight found for provided case with id",
      );
    });

    test("should get insights with end buckets of -1", async () => {
      // Update the insight to have an end bucket of -1
      await prismaClient.insight.update({
        where: { id: fakeInsightId },
        data: {
          assessmentScoreBucketEnd: -1,
        },
      });

      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(
        expect.objectContaining({
          insight: expect.objectContaining({
            gender: Gender.FEMALE,
            assessmentScoreBucketStart: 0,
            assessmentScoreBucketEnd: -1,
            offense: fakeOffense.name,
          }),
        }),
      );
    });

    test("should not show insights with start buckets of -1", async () => {
      // Update the insight to have a start bucket of -1
      await prismaClient.insight.update({
        where: { id: fakeInsightId },
        data: {
          assessmentScoreBucketStart: -1,
        },
      });

      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(
        expect.objectContaining({ insight: undefined }),
      );

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toContain(
        "No corresponding insight found for provided case with id",
      );
    });

    test("should capture exception if there are multiple insights for a single case", async () => {
      // Create a new insight that the fake case still applies to (this one just has a very large assessment bucket range)
      await prismaClient.insight.create({
        data: {
          ...fakeInsightPrismaInput,
          assessmentScoreBucketStart: 0,
          assessmentScoreBucketEnd: 100,
        },
      });

      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(
        expect.objectContaining({ insight: expect.objectContaining({}) }),
      );

      const sentryReport = await testAndGetSentryReport();
      expect(sentryReport.error?.message).toContain(
        "Multiple insights found for case with id",
      );
    });

    test("should set opportunity provider name to null if it is unknown", async () => {
      // Set an opportunity provider name to unknown
      await prismaClient.opportunity.update({
        where: {
          opportunityName_providerName: {
            opportunityName:
              fakeCase.recommendedOpportunities[0].opportunityName,
            providerName: fakeCase.recommendedOpportunities[0].providerName,
          },
        },
        data: {
          providerName: OPPORTUNITY_UNKNOWN_PROVIDER_NAME,
        },
      });

      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(
        expect.objectContaining({
          recommendedOpportunities: expect.arrayContaining([
            expect.objectContaining({
              opportunityName:
                fakeCase.recommendedOpportunities[0].opportunityName,
              providerName: null,
            }),
          ]),
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
          recommendationSummary: "Recommendation Summary",
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
          recommendationSummary: "Recommendation Summary",
        }),
      );
    });

    test("should update recommendedOpportunities", async () => {
      // Create an opportunity with the default provider name
      await prismaClient.opportunity.create({
        data: {
          ...fakeOpportunity,
          providerName: OPPORTUNITY_UNKNOWN_PROVIDER_NAME,
        },
      });

      // Update the opportunities to be the one with out a provider name
      await testTRPCClient.case.updateCase.mutate({
        id: fakeCase.id,
        attributes: {
          recommendedOpportunities: [
            {
              opportunityName: "opportunity-name",
              providerName: null,
            },
          ],
        },
      });

      const updatedCase = await prismaClient.case.findUniqueOrThrow({
        where: { id: fakeCase.id },
        select: { recommendedOpportunities: true },
      });

      expect(updatedCase.recommendedOpportunities.length).toBe(1);
      expect(updatedCase).toEqual(
        expect.objectContaining({
          recommendedOpportunities: [
            expect.objectContaining({
              opportunityName: "opportunity-name",
              // provider name should be the default string in the database
              providerName: "unknown",
            }),
          ],
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
});
