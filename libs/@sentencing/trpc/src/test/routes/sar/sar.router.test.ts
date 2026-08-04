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
  InvestigationType,
  LevelOfEducation,
  MethodOfUse,
  NeedToBeAddressed,
  ProtectiveFactor,
  StateCode,
  SubstanceType,
} from "~@sentencing/prisma/client";
import { appRouter } from "~@sentencing/trpc/router";
import { testPrismaClient } from "~@sentencing/trpc/test/setup";
import {
  fakeSAR,
  fakeSARClient,
  fakeSARStaff,
  fakeStaff,
  fakeSupervisor,
} from "~@sentencing/trpc/test/setup/seed";

describe("SAR router", () => {
  // Builds a tRPC caller directly (bypassing HTTP/createContext) with a given
  // staffPseudonymizedId, so tests can exercise both the staff-scoped access
  // paths and the undefined (internal user) case per endpoint. Defaults
  // hasSARRouteAccess to true.
  function makeCallerForStaff(
    staffPseudonymizedId: string | undefined,
    hasSARRouteAccess = true,
  ) {
    return appRouter.createCaller({
      req: {} as never,
      res: {} as never,
      isAuthorized: true,
      prisma: testPrismaClient,
      staffPseudonymizedId,
      hasSARRouteAccess,
    });
  }

  describe("getSAR", () => {
    test("should return SAR if SAR exists", async () => {
      const returnedSAR = await makeCallerForStaff(
        fakeStaff.pseudonymizedId,
      ).sar.getSAR({
        id: fakeSAR.id,
      });

      expect(returnedSAR).toEqual(
        expect.objectContaining({
          id: fakeSAR.id,
          externalId: fakeSAR.externalId,
          status: fakeSAR.status,
          requestingJudgeName: fakeSAR.requestingJudgeName,
          dateRequested: fakeSAR.dateRequested,
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
          noORASDomainReason: null,
          ORASDomainsAvailable: true,
          involvesSexCrime: false,
          static9RRCompleted: false,
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
          priorTreatmentHistorySummary: fakeSAR.priorTreatmentHistorySummary,
          peerAssociatesSummary: fakeSAR.peerAssociatesSummary,
          criminalAttitudesSummary: fakeSAR.criminalAttitudesSummary,
          sexualHistorySummary: null,
          responsivityAndBarriersSummary:
            fakeSAR.responsivityAndBarriersSummary,
          communityStrategyRecommendation:
            fakeSAR.communityStrategyRecommendation,
          institutionalStrategyRecommendation:
            fakeSAR.institutionalStrategyRecommendation,
          responsivityLevel: fakeSAR.responsivityLevel,
          metadata: null,
          mostSevereOffenseName: null,
          client: {
            ..._.pick(fakeSARClient, [
              "fullName",
              "gender",
              "raceOrEthnicity",
              "externalId",
              "birthDate",
              "motherName",
              "fatherName",
              "guardianName",
            ]),
            DOCTreatmentHistories:
              fakeSARClient.DOCTreatmentHistories.create.map(
                ({ programCategory, programName, completedOn }) => ({
                  id: expect.any(String),
                  programCategory,
                  programName,
                  completedOn,
                }),
              ),
          },
          charges: [],
          drugHistories: [],
          priorTreatmentHistories: [],
          employmentHistories: [],
        }),
      );
    });

    test("should throw error if SAR does not exist", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      await expect(() =>
        caller.sar.getSAR({
          id: "not-a-real-id",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Sentencing Assessment Report with that id was not found",
        }),
      );
    });

    test("an internal user (no staffPseudonymizedId) can read any SAR by id, unrestricted", async () => {
      const caller = makeCallerForStaff(undefined);
      const sar = await caller.sar.getSAR({ id: fakeSAR.id });

      expect(sar.id).toEqual(fakeSAR.id);
    });

    test("an unrelated PO cannot read a SAR they aren't assigned to or supervising", async () => {
      const caller = makeCallerForStaff(fakeSARStaff.pseudonymizedId);

      await expect(() =>
        caller.sar.getSAR({ id: fakeSAR.id }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Sentencing Assessment Report with that id was not found",
        }),
      );
    });

    test("an unrelated PO can read a SAR once it's archived in OPII", async () => {
      await testPrismaClient.sentencingAssessmentReport.update({
        where: { id: fakeSAR.id },
        data: { completionDate: new Date("2020-01-01") },
      });

      const caller = makeCallerForStaff(fakeSARStaff.pseudonymizedId);
      const sar = await caller.sar.getSAR({ id: fakeSAR.id });

      expect(sar.id).toEqual(fakeSAR.id);
    });
  });

  describe("getSARsForStaff", () => {
    test("resolves via the caller's own staffPseudonymizedId, ignoring the requested id", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      const sars = await caller.sar.getSARsForStaff({
        staffPseudonymizedId: fakeSARStaff.pseudonymizedId, // ignored -- context id wins
      });

      expect(sars.map((s) => s.id)).toEqual([fakeSAR.id]);
    });

    test("falls back to the requested staffPseudonymizedId when the caller has none (impersonation)", async () => {
      const caller = makeCallerForStaff(undefined);
      const sars = await caller.sar.getSARsForStaff({
        staffPseudonymizedId: fakeStaff.pseudonymizedId,
      });

      expect(sars.map((s) => s.id)).toEqual([fakeSAR.id]);
    });

    test("throws FORBIDDEN when neither the caller nor the request resolves a staff identity", async () => {
      const caller = makeCallerForStaff(undefined);
      await expect(() =>
        caller.sar.getSARsForStaff({ staffPseudonymizedId: "" }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "A staffPseudonymizedId is required to look up SARs for staff",
        }),
      );
    });
  });

  describe("updateSAR", () => {
    test("should update basic SAR fields", async () => {
      await makeCallerForStaff(fakeStaff.pseudonymizedId).sar.updateSAR({
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
      await makeCallerForStaff(fakeStaff.pseudonymizedId).sar.updateSAR({
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
      await makeCallerForStaff(fakeStaff.pseudonymizedId).sar.updateSAR({
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
      await makeCallerForStaff(fakeStaff.pseudonymizedId).sar.updateSAR({
        id: fakeSAR.id,
        attributes: {
          motherName: "Jane Doe",
          fatherName: "John Doe",
        },
      });

      const updatedClient = await testPrismaClient.client.findUnique({
        where: { externalId: fakeSARClient.externalId },
      });

      expect(updatedClient).toMatchObject({
        motherName: "Jane Doe",
        fatherName: "John Doe",
      });
    });

    test("should update charges by ID without duplicating", async () => {
      // First, create some charges to update (need to connect offense)
      const charge1 = await testPrismaClient.charge.create({
        data: {
          chargeExternalId: "charge-ext-1",
          sentencingAssessmentReport: {
            connect: { id: fakeSAR.id },
          },
          offense: "offense-name",
        },
      });

      const charge2 = await testPrismaClient.charge.create({
        data: {
          chargeExternalId: "charge-ext-2",
          sentencingAssessmentReport: {
            connect: { id: fakeSAR.id },
          },
          offense: "offense-name",
        },
      });

      const pleaDate = new Date("2024-01-15");
      const sentencingDate = new Date("2024-02-20");

      // Now update them with attorney/plea information
      await makeCallerForStaff(fakeStaff.pseudonymizedId).sar.updateSAR({
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
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      await caller.sar.createDrugHistory({
        sarId: fakeSAR.id,
        substance: SubstanceType.Alcohol,
        ageOfRegularUse: 18,
        admitsToCurrentUse: true,
        heaviestUse: FrequencyOfUse.Daily,
        method: MethodOfUse.Oral,
      });

      await caller.sar.createDrugHistory({
        sarId: fakeSAR.id,
        substance: SubstanceType.Marijuana,
        ageOfRegularUse: null,
        admitsToCurrentUse: false,
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
        admitsToCurrentUse: true,
        heaviestUse: FrequencyOfUse.Daily,
        method: MethodOfUse.Oral,
      });
      expect(histories[1]).toMatchObject({
        substance: SubstanceType.Marijuana,
        ageOfRegularUse: null,
        admitsToCurrentUse: false,
        heaviestUse: FrequencyOfUse.Weekly,
        method: MethodOfUse.Smoking,
      });
    });

    test("should delete drug histories via CRUD mutation", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      // First add a drug history
      const created = await caller.sar.createDrugHistory({
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
      await caller.sar.deleteDrugHistory({
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

      await makeCallerForStaff(fakeStaff.pseudonymizedId).sar.updateSAR({
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
        await makeCallerForStaff(fakeStaff.pseudonymizedId).sar.updateSAR({
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
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      // Set metadata first
      await caller.sar.updateSAR({
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
      await caller.sar.updateSAR({
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
          chargeExternalId: "charge-ext-3",
          sentencingAssessmentReport: {
            connect: { id: fakeSAR.id },
          },
          offense: "offense-name",
        },
      });

      await makeCallerForStaff(fakeStaff.pseudonymizedId).sar.updateSAR({
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
      // A nonexistent id never matches the accessibility check's `where`, so
      // this is FORBIDDEN (no accessible SAR under that id) rather than
      // NOT_FOUND -- the same as any real caller hitting a bad id.
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      await expect(() =>
        caller.sar.updateSAR({
          id: "not-a-real-id",
          attributes: {
            address: "123 Test St",
          },
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have access to this Sentencing Assessment Report",
        }),
      );
    });

    test("an internal user (no staffPseudonymizedId) can update any SAR, unrestricted", async () => {
      const caller = makeCallerForStaff(undefined);
      await caller.sar.updateSAR({
        id: fakeSAR.id,
        attributes: { address: "123 Test St" },
      });

      const updatedSAR =
        await testPrismaClient.sentencingAssessmentReport.findUnique({
          where: { id: fakeSAR.id },
        });
      expect(updatedSAR?.address).toBe("123 Test St");
    });
  });

  describe("employment history CRUD", () => {
    test("should create an employment history record linked to the SAR", async () => {
      const startDate = new Date("2020-03-01");
      const endDate = new Date("2023-06-30");

      await makeCallerForStaff(
        fakeStaff.pseudonymizedId,
      ).sar.createEmploymentHistory({
        sarId: fakeSAR.id,
        employerName: "Acme Corp",
        startDate,
        endDate,
        verifiedByReportAuthor: true,
      });

      const histories = await testPrismaClient.employmentHistory.findMany({
        where: { sentencingAssessmentReportId: fakeSAR.id },
      });

      expect(histories).toHaveLength(1);
      expect(histories[0]).toMatchObject({
        employerName: "Acme Corp",
        startDate,
        endDate,
        verifiedByReportAuthor: true,
        importedFromDOC: false,
      });
    });

    test("should update an employment history record", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      const created = await caller.sar.createEmploymentHistory({
        sarId: fakeSAR.id,
        employerName: "Old Employer",
      });

      if (!created)
        throw new Error("Expected employment history to be created");

      await caller.sar.updateEmploymentHistory({
        id: created.id,
        employerName: "New Employer",
        verifiedByReportAuthor: false,
      });

      const updated = await testPrismaClient.employmentHistory.findUnique({
        where: { id: created.id },
      });

      expect(updated).toMatchObject({
        employerName: "New Employer",
        verifiedByReportAuthor: false,
      });
    });

    test("should delete an employment history record", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      const created = await caller.sar.createEmploymentHistory({
        sarId: fakeSAR.id,
        employerName: "Temp Employer",
      });

      if (!created)
        throw new Error("Expected employment history to be created");

      let histories = await testPrismaClient.employmentHistory.findMany({
        where: { sentencingAssessmentReportId: fakeSAR.id },
      });
      expect(histories).toHaveLength(1);

      await caller.sar.deleteEmploymentHistory({
        id: created.id,
      });

      histories = await testPrismaClient.employmentHistory.findMany({
        where: { sentencingAssessmentReportId: fakeSAR.id },
      });
      expect(histories).toHaveLength(0);
    });

    test("creating an employment history record marks the SAR as manually updated", async () => {
      await makeCallerForStaff(
        fakeStaff.pseudonymizedId,
      ).sar.createEmploymentHistory({
        sarId: fakeSAR.id,
        employerName: "Acme Corp",
      });

      const sar = await testPrismaClient.sentencingAssessmentReport.findUnique({
        where: { id: fakeSAR.id },
      });
      expect(sar?.hasManuallyUpdatedEmploymentHistory).toBe(true);
    });

    test("updating an employment history record marks the SAR as manually updated", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      const created = await caller.sar.createEmploymentHistory({
        sarId: fakeSAR.id,
        employerName: "Old Employer",
      });
      if (!created)
        throw new Error("Expected employment history to be created");

      await testPrismaClient.sentencingAssessmentReport.update({
        where: { id: fakeSAR.id },
        data: { hasManuallyUpdatedEmploymentHistory: false },
      });

      await caller.sar.updateEmploymentHistory({
        id: created.id,
        employerName: "New Employer",
      });

      const sar = await testPrismaClient.sentencingAssessmentReport.findUnique({
        where: { id: fakeSAR.id },
      });
      expect(sar?.hasManuallyUpdatedEmploymentHistory).toBe(true);
    });

    test("deleting an employment history record marks the SAR as manually updated", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      const created = await caller.sar.createEmploymentHistory({
        sarId: fakeSAR.id,
        employerName: "Temp Employer",
      });
      if (!created)
        throw new Error("Expected employment history to be created");

      await testPrismaClient.sentencingAssessmentReport.update({
        where: { id: fakeSAR.id },
        data: { hasManuallyUpdatedEmploymentHistory: false },
      });

      await caller.sar.deleteEmploymentHistory({
        id: created.id,
      });

      const sar = await testPrismaClient.sentencingAssessmentReport.findUnique({
        where: { id: fakeSAR.id },
      });
      expect(sar?.hasManuallyUpdatedEmploymentHistory).toBe(true);
    });

    test("should include all employment records (imported and manual) in getSAR response", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      // Create a manual record
      await caller.sar.createEmploymentHistory({
        sarId: fakeSAR.id,
        employerName: "Manual Entry",
      });

      // Create an imported record directly via Prisma (bypassing the CRUD endpoint)
      await testPrismaClient.employmentHistory.create({
        data: {
          sentencingAssessmentReportId: fakeSAR.id,
          employerName: "DOC Import",
          importedFromDOC: true,
        },
      });

      const sar = await caller.sar.getSAR({ id: fakeSAR.id });

      expect(sar.employmentHistories).toHaveLength(2);
      expect(sar.employmentHistories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            employerName: "Manual Entry",
            importedFromDOC: false,
          }),
          expect.objectContaining({
            employerName: "DOC Import",
            importedFromDOC: true,
          }),
        ]),
      );
    });
  });

  describe("getSARsByClient", () => {
    test("returns the assigned SAR for the given clientExternalId", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);

      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(1);
      expect(sars[0]).toEqual({
        id: fakeSAR.id,
        externalId: fakeSAR.externalId,
        status: fakeSAR.status,
        completionDate: null,
        updatedAt: expect.any(Date),
        staff: { pseudonymizedId: fakeStaff.pseudonymizedId },
        currentUserHasAccess: true,
        investigationType: InvestigationType.SAR,
      });
    });

    test("returns multiple rows when the client has several assigned SARs to the caller", async () => {
      await testPrismaClient.sentencingAssessmentReport.create({
        data: {
          externalId: "sar-ext-2",
          id: "sar-2",
          investigationType: InvestigationType.SAR,
          status: CaseStatus.Complete,
          client: { connect: { externalId: fakeSARClient.externalId } },
          staff: { connect: { externalId: fakeStaff.externalId } },
        },
      });

      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(2);
      expect(sars.map((s) => s.id).sort()).toEqual(
        [fakeSAR.id, "sar-2"].sort(),
      );
    });

    test("returns empty array when the client has no SARs", async () => {
      // Create a fresh client with no SARs.
      const lonelyClient = await testPrismaClient.client.create({
        data: {
          externalId: "lonely-client-ext",
          pseudonymizedId: "lonely-client-pid",
          fullName: "Lonely Client",
          stateCode: StateCode.US_ID,
          gender: "MALE",
          birthDate: new Date("1990-01-01"),
        },
      });

      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: lonelyClient.externalId,
      });

      expect(sars).toEqual([]);
    });

    test("includes SARs owned by a different staff member for the same client, but marks them inaccessible", async () => {
      // Add a second SAR for the same client owned by fakeSARStaff. The caller isn't
      // the PSI staff on this SAR (or their supervisor), so getSARsByClient still
      // returns the row -- this is what lets a supervision officer viewing a client's
      // profile in Tasks see every SAR regardless of PSI assignment -- but flags it
      // as inaccessible via `currentUserHasAccess` so the FE hides its builder link.
      await testPrismaClient.sentencingAssessmentReport.create({
        data: {
          externalId: "sar-ext-other-staff",
          id: "sar-other-staff",
          investigationType: InvestigationType.SAR,
          status: CaseStatus.InProgress,
          client: { connect: { externalId: fakeSARClient.externalId } },
          staff: { connect: { externalId: fakeSARStaff.externalId } },
        },
      });

      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(2);
      expect(sars.map((s) => s.id).sort()).toEqual(
        [fakeSAR.id, "sar-other-staff"].sort(),
      );
      expect(sars.find((s) => s.id === fakeSAR.id)?.currentUserHasAccess).toBe(
        true,
      );
      expect(
        sars.find((s) => s.id === "sar-other-staff")?.currentUserHasAccess,
      ).toBe(false);
    });

    test("an unrelated PO has no access to an in-progress SAR they aren't assigned to or supervising", async () => {
      const caller = makeCallerForStaff(fakeSARStaff.pseudonymizedId);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(1);
      expect(sars[0].currentUserHasAccess).toBe(false);
      // staff is still returned -- only the FE link is gated on currentUserHasAccess.
      expect(sars[0].staff).toEqual({
        pseudonymizedId: fakeStaff.pseudonymizedId,
      });
    });

    test("a district supervisor can access an in-progress SAR assigned to another PO in their district", async () => {
      const district = await testPrismaClient.district.findFirstOrThrow({
        where: { name: "District 1" },
      });

      // Give fakeStaff (the SAR's assignee) a district...
      await testPrismaClient.staff.update({
        where: { externalId: fakeStaff.externalId },
        data: { district: { connect: { id: district.id } } },
      });

      // ...and create a supervisor over that same district with at least one
      // direct report, so `buildSARStaffFilter`'s district-scoping branch applies.
      // District supervisors manage every PO in their district, not just direct
      // reports, so the supervisor need not directly manage fakeStaff.
      const districtSupervisorPseudoId = "district-supervisor-pid";
      await testPrismaClient.staff.create({
        data: {
          externalId: "district-supervisor-ext",
          pseudonymizedId: districtSupervisorPseudoId,
          fullName: "District Supervisor",
          stateCode: StateCode.US_ID,
          hasLoggedIn: true,
          district: { connect: { id: district.id } },
        },
      });
      await testPrismaClient.staff.update({
        where: { externalId: fakeSARStaff.externalId },
        data: { supervisorId: "district-supervisor-ext" },
      });

      const caller = makeCallerForStaff(districtSupervisorPseudoId);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(1);
      expect(sars[0].currentUserHasAccess).toBe(true);
    });

    test("an org-wide supervisor can access any in-progress SAR regardless of district", async () => {
      await testPrismaClient.staff.update({
        where: { externalId: fakeSupervisor.externalId },
        data: { supervisesAll: true },
      });

      const caller = makeCallerForStaff(fakeSupervisor.pseudonymizedId);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(1);
      expect(sars[0].currentUserHasAccess).toBe(true);
    });

    test("a SAR archived in OPII is accessible to any PO regardless of assignment", async () => {
      await testPrismaClient.sentencingAssessmentReport.update({
        where: { id: fakeSAR.id },
        data: { completionDate: new Date("2020-01-01") },
      });

      const caller = makeCallerForStaff(fakeSARStaff.pseudonymizedId);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(1);
      expect(sars[0].currentUserHasAccess).toBe(true);
    });

    test("the assignee has no access to an in-progress SAR without SAR product access, even though they're the assignee", async () => {
      // fakeStaff is fakeSAR's assignee, but assignee-on-paper isn't the
      // same as being granted the tool (hasSARRouteAccess: false).
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId, false);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(1);
      expect(sars[0].currentUserHasAccess).toBe(false);
    });

    test("a SAR archived in OPII remains accessible to the assignee even without SAR product access", async () => {
      await testPrismaClient.sentencingAssessmentReport.update({
        where: { id: fakeSAR.id },
        data: { completionDate: new Date("2020-01-01") },
      });

      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId, false);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(1);
      expect(sars[0].currentUserHasAccess).toBe(true);
    });

    test("an internal user (no staffPseudonymizedId) sees every SAR for the client, but no link to an in-progress one they have no real relationship to", async () => {
      // Add a SAR owned by a different staff for the same client — an internal
      // user should still see both rows (no data hidden), but since they have no
      // real assignee/supervisor relationship to either, neither in-progress SAR
      // should be marked accessible. Unlike every other check in this file, this
      // field deliberately doesn't treat "no staffPseudonymizedId" as unrestricted
      // -- see the comment on getSARsByClient's currentUserHasAccess computation.
      await testPrismaClient.sentencingAssessmentReport.create({
        data: {
          externalId: "sar-ext-other-staff",
          id: "sar-other-staff",
          investigationType: InvestigationType.SAR,
          status: CaseStatus.InProgress,
          client: { connect: { externalId: fakeSARClient.externalId } },
          staff: { connect: { externalId: fakeSARStaff.externalId } },
        },
      });

      const internalCaller = makeCallerForStaff(undefined);
      const sars = await internalCaller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(2);
      expect(sars.map((s) => s.id).sort()).toEqual(
        [fakeSAR.id, "sar-other-staff"].sort(),
      );
      expect(sars.every((s) => !s.currentUserHasAccess)).toBe(true);
    });

    test("an internal user (no staffPseudonymizedId) gets a working link to an archived SAR regardless", async () => {
      await testPrismaClient.sentencingAssessmentReport.update({
        where: { id: fakeSAR.id },
        data: { completionDate: new Date("2020-01-01") },
      });

      const internalCaller = makeCallerForStaff(undefined);
      const sars = await internalCaller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(1);
      expect(sars[0].currentUserHasAccess).toBe(true);
    });

    test("output rows expose only the documented fields", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      const sars = await caller.sar.getSARsByClient({
        clientExternalId: fakeSARClient.externalId,
      });

      expect(sars).toHaveLength(1);
      const row = sars[0];
      expect(Object.keys(row).sort()).toEqual(
        [
          "completionDate",
          "currentUserHasAccess",
          "externalId",
          "id",
          "investigationType",
          "staff",
          "status",
          "updatedAt",
        ].sort(),
      );
      // Defense-in-depth: SAR fields that should never leak in this minimal view.
      expect(row as Record<string, unknown>).not.toHaveProperty(
        "officerSignature",
      );
      expect(row as Record<string, unknown>).not.toHaveProperty(
        "supervisorSignature",
      );
      expect(row as Record<string, unknown>).not.toHaveProperty(
        "defendantStatement",
      );
    });

    test("rejects missing clientExternalId at the Zod boundary", async () => {
      const caller = makeCallerForStaff(fakeStaff.pseudonymizedId);
      await expect(() =>
        caller.sar.getSARsByClient({
          // @ts-expect-error Testing wrong type / invalid input
          clientExternalId: undefined,
        }),
      ).rejects.toThrow();
    });
  });
});
