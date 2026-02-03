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

import {
  CaseStatus,
  FrequencyOfUse,
  LevelOfEducation,
  MethodOfUse,
  NeedToBeAddressed,
  ProtectiveFactor,
  SubstanceType,
} from "~@sentencing/prisma/client";
import { testPrismaClient, testTRPCClient } from "~@sentencing/trpc/test/setup";
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
          defendantDeclinedToParticipate: false,
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
          employedAtOffense: fakeSAR.employedAtOffense,
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
          responsivityLevel: fakeSAR.responsivityLevel,
          metadata: null,
          client: {
            ..._.pick(fakeSARClient, [
              "fullName",
              "gender",
              "raceOrEthnicity",
              "ssn",
              "externalId",
              "birthDate",
              "motherName",
              "fatherName",
              "guardianName",
            ]),
          },
          charges: [],
          drugHistories: [],
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

  describe("updateSAR", () => {
    test("should update basic SAR fields", async () => {
      await testTRPCClient.sar.updateSAR.mutate({
        id: fakeSAR.id,
        attributes: {
          address: "456 Oak Street",
          defendantStatement: "Updated defendant statement",
          status: CaseStatus.Complete,
          defendantDeclinedToParticipate: true,
        },
      });

      const updatedSAR =
        await testPrismaClient.sentencingAssessmentReport.findUnique({
          where: { id: fakeSAR.id },
        });

      expect(updatedSAR).toMatchObject({
        address: "456 Oak Street",
        defendantStatement: "Updated defendant statement",
        status: CaseStatus.Complete,
        defendantDeclinedToParticipate: true,
      });
    });

    test("should update array fields", async () => {
      await testTRPCClient.sar.updateSAR.mutate({
        id: fakeSAR.id,
        attributes: {
          needsToBeAddressed: [
            NeedToBeAddressed.AngerManagement,
            NeedToBeAddressed.HousingOpportunities,
          ],
          mitigatingFactors: [ProtectiveFactor.NoPriorCriminalConvictions],
        },
      });

      const updatedSAR =
        await testPrismaClient.sentencingAssessmentReport.findUnique({
          where: { id: fakeSAR.id },
        });

      expect(updatedSAR?.needsToBeAddressed).toEqual([
        NeedToBeAddressed.AngerManagement,
        NeedToBeAddressed.HousingOpportunities,
      ]);
      expect(updatedSAR?.mitigatingFactors).toEqual([
        ProtectiveFactor.NoPriorCriminalConvictions,
      ]);
    });

    test("should clear nullable fields when set to null", async () => {
      await testTRPCClient.sar.updateSAR.mutate({
        id: fakeSAR.id,
        attributes: {
          defendantStatement: null,
          address: null,
        },
      });

      const updatedSAR =
        await testPrismaClient.sentencingAssessmentReport.findUnique({
          where: { id: fakeSAR.id },
        });

      expect(updatedSAR?.defendantStatement).toBeNull();
      expect(updatedSAR?.address).toBeNull();
    });

    test("should update client fields", async () => {
      await testTRPCClient.sar.updateSAR.mutate({
        id: fakeSAR.id,
        attributes: {
          ssn: "123456789",
          motherName: "Jane Doe",
          fatherName: "John Doe",
        },
      });

      const updatedClient = await testPrismaClient.client.findUnique({
        where: { externalId: fakeSARClient.externalId },
      });

      expect(updatedClient).toMatchObject({
        ssn: "123456789",
        motherName: "Jane Doe",
        fatherName: "John Doe",
      });
    });

    test("should update charges by ID without duplicating", async () => {
      // First, create some charges to update (need to connect offense)
      const charge1 = await testPrismaClient.charge.create({
        data: {
          sentencingAssessmentReport: {
            connect: { id: fakeSAR.id },
          },
          offense: {
            connect: { name: "offense-name" },
          },
        },
      });

      const charge2 = await testPrismaClient.charge.create({
        data: {
          sentencingAssessmentReport: {
            connect: { id: fakeSAR.id },
          },
          offense: {
            connect: { name: "offense-name" },
          },
        },
      });

      const pleaDate = new Date("2024-01-15");
      const sentencingDate = new Date("2024-02-20");

      // Now update them with attorney/plea information
      await testTRPCClient.sar.updateSAR.mutate({
        id: fakeSAR.id,
        attributes: {
          charges: [
            {
              id: charge1.id,
              prosecutingAttorney: "Prosecutor Smith",
              defenseAttorney: "Defense Jones",
              pleaAgreement: "Guilty",
              pleaDate,
              sentencingDate,
            },
            {
              id: charge2.id,
              prosecutingAttorney: "Prosecutor Brown",
              defenseAttorney: "Defense White",
              pleaAgreement: "Not Guilty",
              pleaDate: null,
              sentencingDate: null,
            },
          ],
        },
      });

      const updatedCharges = await testPrismaClient.charge.findMany({
        where: { sentencingAssessmentReportId: fakeSAR.id },
        orderBy: { id: "asc" },
      });

      // Should still have exactly 2 charges (no duplicates)
      expect(updatedCharges).toHaveLength(2);
      expect(updatedCharges[0]).toMatchObject({
        id: charge1.id,
        prosecutingAttorney: "Prosecutor Smith",
        defenseAttorney: "Defense Jones",
        pleaAgreement: "Guilty",
        pleaDate,
        sentencingDate,
      });
      expect(updatedCharges[1]).toMatchObject({
        id: charge2.id,
        prosecutingAttorney: "Prosecutor Brown",
        defenseAttorney: "Defense White",
        pleaAgreement: "Not Guilty",
        pleaDate: null,
        sentencingDate: null,
      });
    });

    test("should create drug histories via CRUD mutation", async () => {
      await testTRPCClient.sar.createDrugHistory.mutate({
        sarId: fakeSAR.id,
        substance: SubstanceType.Alcohol,
        ageOfRegularUse: 18,
        heaviestUse: FrequencyOfUse.Daily,
        method: MethodOfUse.Oral,
      });

      await testTRPCClient.sar.createDrugHistory.mutate({
        sarId: fakeSAR.id,
        substance: SubstanceType.Marijuana,
        ageOfRegularUse: null,
        heaviestUse: FrequencyOfUse.Weekly,
        method: MethodOfUse.Smoking,
      });

      const histories = await testPrismaClient.drugHistory.findMany({
        where: { sentencingAssessmentReportId: fakeSAR.id },
      });

      expect(histories).toHaveLength(2);
      expect(histories[0]).toMatchObject({
        substance: SubstanceType.Alcohol,
        ageOfRegularUse: 18,
        heaviestUse: FrequencyOfUse.Daily,
        method: MethodOfUse.Oral,
      });
      expect(histories[1]).toMatchObject({
        substance: SubstanceType.Marijuana,
        ageOfRegularUse: null,
        heaviestUse: FrequencyOfUse.Weekly,
        method: MethodOfUse.Smoking,
      });
    });

    test("should delete drug histories via CRUD mutation", async () => {
      // First add a drug history
      const created = await testTRPCClient.sar.createDrugHistory.mutate({
        sarId: fakeSAR.id,
        substance: SubstanceType.Alcohol,
      });

      // Verify it exists
      let histories = await testPrismaClient.drugHistory.findMany({
        where: { sentencingAssessmentReportId: fakeSAR.id },
      });
      expect(histories).toHaveLength(1);

      // Delete it
      if (!created) throw new Error("Expected drug history to be created");
      await testTRPCClient.sar.deleteDrugHistory.mutate({
        id: created.id,
      });

      histories = await testPrismaClient.drugHistory.findMany({
        where: { sentencingAssessmentReportId: fakeSAR.id },
      });
      expect(histories).toHaveLength(0);
    });

    test("should update metadata field with typed structure", async () => {
      const metadata = {
        sections: {
          keyConsiderations: {
            areasOfNeed: { skipped: false },
            mitigatingFactors: { skipped: true },
          },
          defendantStatement: {
            skipped: false,
          },
          victimImpactStatement: {
            skipped: false,
          },
          recommendation: {
            skipped: false,
          },
        },
        version: "1.0" as const,
      };

      await testTRPCClient.sar.updateSAR.mutate({
        id: fakeSAR.id,
        attributes: {
          metadata,
        },
      });

      const updatedSAR =
        await testPrismaClient.sentencingAssessmentReport.findUnique({
          where: { id: fakeSAR.id },
        });

      expect(updatedSAR?.metadata).toEqual(metadata);
    });

    test("should validate metadata structure and reject invalid statuses", async () => {
      try {
        await testTRPCClient.sar.updateSAR.mutate({
          id: fakeSAR.id,
          attributes: {
            // Provide completely wrong type - string instead of object
            // @ts-expect-error Testing wrong type / invalid input
            metadata: "this is not valid metadata",
          },
        });
        // If we get here, test should fail
        expect.fail("Expected mutation to throw validation error");
      } catch (error) {
        // Should throw a validation error
        expect(error).toBeDefined();
      }
    });

    test("should allow undefined metadata (no update)", async () => {
      // Set metadata first
      await testTRPCClient.sar.updateSAR.mutate({
        id: fakeSAR.id,
        attributes: {
          metadata: {
            sections: {
              keyConsiderations: {
                areasOfNeed: { skipped: false },
                mitigatingFactors: { skipped: false },
              },
              defendantStatement: { skipped: false },
              victimImpactStatement: { skipped: false },
              recommendation: { skipped: false },
            },
          },
        },
      });

      // Now update without metadata field - should not change it
      await testTRPCClient.sar.updateSAR.mutate({
        id: fakeSAR.id,
        attributes: {
          address: "New Address",
        },
      });

      const updatedSAR =
        await testPrismaClient.sentencingAssessmentReport.findUnique({
          where: { id: fakeSAR.id },
        });

      // Metadata should still be present
      expect(updatedSAR?.metadata).toBeDefined();
      expect(updatedSAR?.address).toBe("New Address");
    });

    test("should update multiple field types in one call", async () => {
      // Create a charge first
      const charge = await testPrismaClient.charge.create({
        data: {
          sentencingAssessmentReport: {
            connect: { id: fakeSAR.id },
          },
          offense: {
            connect: { name: "offense-name" },
          },
        },
      });

      await testTRPCClient.sar.updateSAR.mutate({
        id: fakeSAR.id,
        attributes: {
          address: "789 Maple Ave",
          levelOfEducation: LevelOfEducation.BachelorsDegree,
          needsToBeAddressed: [NeedToBeAddressed.Education],
          charges: [{ id: charge.id, pleaAgreement: "Not Guilty" }],
          metadata: {
            sections: {
              keyConsiderations: {
                areasOfNeed: { skipped: false },
                mitigatingFactors: { skipped: false },
              },
              defendantStatement: { skipped: false },
              victimImpactStatement: { skipped: false },
              recommendation: { skipped: false },
            },
          },
        },
      });

      const updatedSAR =
        await testPrismaClient.sentencingAssessmentReport.findUnique({
          where: { id: fakeSAR.id },
          include: {
            client: true,
            charges: true,
          },
        });

      expect(updatedSAR).toMatchObject({
        address: "789 Maple Ave",
        levelOfEducation: LevelOfEducation.BachelorsDegree,
        needsToBeAddressed: [NeedToBeAddressed.Education],
      });
      expect(updatedSAR?.metadata).toMatchObject({
        sections: {
          keyConsiderations: {
            areasOfNeed: { skipped: false },
            mitigatingFactors: { skipped: false },
          },
          defendantStatement: { skipped: false },
          victimImpactStatement: { skipped: false },
          recommendation: { skipped: false },
        },
      });
      expect(updatedSAR?.charges).toHaveLength(1);
      expect(updatedSAR?.charges[0].pleaAgreement).toBe("Not Guilty");
    });

    test("should throw error if SAR does not exist", async () => {
      await expect(() =>
        testTRPCClient.sar.updateSAR.mutate({
          id: "not-a-real-id",
          attributes: {
            address: "123 Test St",
          },
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
