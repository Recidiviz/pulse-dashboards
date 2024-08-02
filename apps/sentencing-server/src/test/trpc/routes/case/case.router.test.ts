import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { prismaClient } from "~sentencing-server/prisma";
import { testAndGetSentryReport } from "~sentencing-server/test/common/utils";
import { testTRPCClient } from "~sentencing-server/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeDispositions,
  fakeInsight,
  fakeInsightPrismaInput,
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

    test("should update recommendedOpportunities", async () => {
      await testTRPCClient.case.updateCase.mutate({
        id: fakeCase.id,
        attributes: {
          recommendedOpportunities: [
            {
              opportunityName: "opportunity-name",
              providerPhoneNumber: "800-212-3942",
            },
            {
              opportunityName: "opportunity-name-2",
              providerPhoneNumber: "800-212-1111",
            },
          ],
        },
      });

      let updatedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(updatedCase.recommendedOpportunities.length).toBe(2);
      expect(updatedCase).toEqual(
        expect.objectContaining({
          recommendedOpportunities: [
            {
              opportunityName: "opportunity-name",
              providerPhoneNumber: "800-212-3942",
            },
            {
              opportunityName: "opportunity-name-2",
              providerPhoneNumber: "800-212-1111",
            },
          ],
        }),
      );

      // Should also properly update when we send a smaller list
      await testTRPCClient.case.updateCase.mutate({
        id: fakeCase.id,
        attributes: {
          recommendedOpportunities: [
            {
              opportunityName: "opportunity-name-2",
              providerPhoneNumber: "800-212-1111",
            },
          ],
        },
      });

      updatedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(updatedCase.recommendedOpportunities.length).toBe(1);
      expect(updatedCase).toEqual(
        expect.objectContaining({
          recommendedOpportunities: [
            {
              opportunityName: "opportunity-name-2",
              providerPhoneNumber: "800-212-1111",
            },
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
