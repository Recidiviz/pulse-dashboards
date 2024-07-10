import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { testTRPCClient } from "~sentencing-server/test/setup";
import { fakeCase } from "~sentencing-server/test/setup/seed";

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
          primaryCharge: "Misdemeanor",
          secondaryCharges: ["Felony"],
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
        },
      });

      const updatedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(updatedCase).toEqual(
        expect.objectContaining({
          primaryCharge: "Misdemeanor",
          secondaryCharges: ["Felony"],
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
  });
});
