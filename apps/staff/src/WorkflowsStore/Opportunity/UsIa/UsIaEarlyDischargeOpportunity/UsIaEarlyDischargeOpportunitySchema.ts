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

import { z } from "zod";

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

const dnaStatus = z.enum([
  "Definitely Required",
  "Maybe Required",
  "Not Required",
]);

export const usIaEarlyDischargeSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z
      .object({
        usIaSupervisionLevelIs0NotAvailable12Or3: z
          .object({
            supervisionLevelRawText: z.string().nullable(),
          })
          .nullable(),
        noSupervisionViolationReportWithin6MonthsUsingResponseDate: z
          .object({
            latestViolationReportDates: z.array(dateStringSchema).nullable(),
            violationExpirationDate: dateStringSchema.nullable(),
          })
          .nullable(),
        usIaNoOpenSupervisionModifiers: z
          .object({
            openSupervisionModifiers: z.array(z.string()).nullable(),
          })
          .nullable(),
        supervisionCaseTypeIsNotSexOffense: z
          .object({
            rawSexOffenseCaseTypes: z.array(z.string()).nullable(),
          })
          .nullable(),
        usIaSupervisionFeesPaid: z
          .object({
            initialBalance: z.number().nullable(),
            currentBalance: z.number().nullable(),
          })
          .nullable(),
        usIaNotServingIneligibleOffenseForEarlyDischarge: z
          .object({
            ineligibleOffenses: z.array(z.string()).nullable(),
          })
          .nullable(),
        notSupervisionPastFullTermCompletionDateOrUpcoming30Days: z
          .object({
            eligibleDate: dateStringSchema.nullable(),
          })
          .nullable(),
        notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: z
          .object({
            lifeSentence: z.boolean().nullable(),
            ineligibleOffenses: z.array(z.string()).nullable(),
          })
          .nullable(),
        supervisionTypeIsNotInvestigation: z
          .object({
            rawSupervisionTypes: z.array(z.string()).nullable(),
          })
          .nullable(),
        usIaServingSupervisionCaseAtLeast90Days: z
          .object({
            supervisionCaseStartDate: dateStringSchema,
          })
          .nullable(),
        usIaNotExcludedFromEarlyDischargeByParoleCondition: z
          .object({
            conditions: z.array(z.string()).nullable(),
          })
          .nullable(),
        supervisionLevelIsNotResidentialProgram: z
          .object({
            supervisionLevelRawText: z.string().nullable(),
          })
          .nullable(),
      })
      .passthrough(),
    ineligibleCriteria: z.object({}).passthrough(),
    formInformation: z
      .object({
        USCitizenshipStatus: z.string().nullish(),
        charges: z
          .array(
            z.object({
              causeNumber: z.string(),
              crimeCdOffenseType: z.string(),
              jurisdiction: z.string(),
              classificationTypeRawText: z.string(),
              counts: z.number(),
              description: z.string(),
              statute: z.string(),
              tdd: z.string(),
              sdd: z.string(),
              chargeExternalId: z.string(),
            }),
          )
          .default([]),
        penalties: z
          .array(
            z.object({
              penaltyValue: z.string(),
              sentencePenaltyModifier: z.string(),
              sentencePenaltyType: z.string(),
              sentenceDate: z.string(),
              chargeExternalId: z.string(),
            }),
          )
          .default([]),
        staffAttributes: z
          .array(
            z.object({
              staffTitle: z.string().nullable().default(""),
              workUnit: z.string(),
              officerExternalId: z.string(),
            }),
          )
          .default([]),
      })
      .passthrough(),
    metadata: z
      .object({
        victimFlag: z.boolean().optional(),
        violationsPast6MonthsFlag: z.boolean().optional(),
        victimContactInfo: z
          .array(
            z.object({
              VictimFirstNm: z.string().nullish(),
              VictimMiddleNm: z.string().nullish(),
              VictimLastNm: z.string().nullish(),
              VictimSuffix: z.string().nullish(),
              HomePhone: z.string().nullish(),
              WorkPhone: z.string().nullish(),
              CellPhone: z.string().nullish(),
              OtherPhone: z.string().nullish(),
              Fax: z.string().nullish(),
              EmailAddress: z.string().nullish(),
              Address1: z.string().nullish(),
              Address2: z.string().nullish(),
              City: z.string().nullish(),
              State: z.string().nullish(),
              ZipCode: z.string().nullish(),
              Country: z.string().nullish(),
            }),
          )
          .nullish(),
        dnaSubmittedFlag: z.boolean().optional(),
        dnaRequirementStatus: dnaStatus.optional(),
        mostRecentDnaSubmittedDate: dateStringSchema.nullish(),
        openInterventionsFlag: z.boolean().optional(),
      })
      .passthrough(),
  })
  .passthrough();

type PenaltyChargeExternalIdKey = `penaltyChargeExternalId${number}`;
type SentencePenaltyTypeKey = `sentencePenaltyType${number}`;
type PenaltyValueKey = `penaltyValue${number}`;
type SentencePenaltyModifierKey = `sentencePenaltyModifier${number}`;
type SentenceDateKey = `sentenceDate${number}`;
export type PenaltyRecords = Record<
  | PenaltyChargeExternalIdKey
  | SentencePenaltyTypeKey
  | PenaltyValueKey
  | SentencePenaltyModifierKey
  | SentenceDateKey,
  string
>;

type ChargeExternalIdKey = `chargeExternalId${number}`;
type CauseNumberKey = `causeNumber${number}`;
type JurisdictionKey = `jurisdiction${number}`;
type CountsKey = `counts${number}`;
type DescriptionKey = `description${number}`;
type StatuteKey = `statute${number}`;
type ClassificationTypeRawTextKey = `classificationTypeRawText${number}`;
type CrimeCdOffenseTypeKey = `crimeCdOffenseType${number}`;
type TddKey = `tdd${number}`;
type SddKey = `sdd${number}`;
export type ChargeRecords = Record<
  | ChargeExternalIdKey
  | CauseNumberKey
  | JurisdictionKey
  | CountsKey
  | DescriptionKey
  | StatuteKey
  | ClassificationTypeRawTextKey
  | CrimeCdOffenseTypeKey
  | TddKey
  | SddKey,
  string
>;

export type UsIaEarlyDischargeDraftData = {
  usCitizenshipStatus: string;
  todaysDate: string;
  iconNumber: string;
  clientFullName: string;
  supervisionType: string;
  supervisionStartDate: string;
  supervisionEndDate: string;

  numberOfCharges: number;
  numberOfPenalties: number;

  officerFullName: string;
  staffTitle: string;
  workUnit: string;

  dischargeDate: string;
  supervisorFullName: string;
  supervisorTitle: string;
  officerSignatureCbcForm: string;
  officerSignatureIdCbcForm: string;
  supervisorSignatureCbcForm: string;
  supervisorSignatureIdCbcForm: string;
  officerSignatureParoleDischargeForm: string;
  officerSignatureIdParoleDischargeForm: string;
  supervisorSignatureParoleDischargeForm: string;
  officerSignatureDate: string;
  supervisorSignatureDate: string;
  progressAndRecommendations: string;

  hasCompletedProbation: boolean;
  probationCompletionStatus: string;
  probationCompletionDate: string;
  remainsFinanciallyLiable: boolean;
  grantedDeferredJudgement: boolean;
  hasOtherProbationDischargeOrder: boolean;
  otherProbationDischargeOrderDetails: string;
} & PenaltyRecords &
  ChargeRecords;

export function packDraftData(draftData: UsIaEarlyDischargeDraftData) {
  const {
    usCitizenshipStatus,
    todaysDate,
    iconNumber,
    clientFullName,
    supervisionType,
    supervisionStartDate,
    supervisionEndDate,
    officerFullName,
    staffTitle,
    workUnit,
    dischargeDate,
    supervisorSignatureDate,
    officerSignatureDate,
    hasCompletedProbation,
    probationCompletionStatus,
    probationCompletionDate,
    remainsFinanciallyLiable,
    grantedDeferredJudgement,
    hasOtherProbationDischargeOrder,
    otherProbationDischargeOrderDetails,
    progressAndRecommendations,
    supervisorTitle,
    supervisorFullName,
    officerSignatureCbcForm,
    officerSignatureParoleDischargeForm,
    supervisorSignatureCbcForm,
    supervisorSignatureParoleDischargeForm,
  } = draftData;

  const penalties = [];
  for (let i = 0; i < draftData.numberOfPenalties; i++) {
    penalties.push({
      penaltyValue: draftData[`penaltyValue${i}`],
      penaltyType: draftData[`sentencePenaltyType${i}`],
      penaltyModifier: draftData[`sentencePenaltyModifier${i}`],
      sentenceDate: draftData[`sentenceDate${i}`],
      chargeExternalId: draftData[`penaltyChargeExternalId${i}`],
    });
  }

  const charges = [];
  for (let i = 0; i < draftData.numberOfCharges; i++) {
    const chargePenalties = penalties.filter((p) => {
      return p.chargeExternalId === draftData[`chargeExternalId${i}`];
    });

    charges.push({
      causeNumber: draftData[`causeNumber${i}`],
      jurisdiction: draftData[`jurisdiction${i}`],
      counts: String(draftData[`counts${i}`]),
      description: draftData[`description${i}`],
      statute: draftData[`statute${i}`],
      classification: draftData[`classificationTypeRawText${i}`],
      tdd: draftData[`tdd${i}`],
      sdd: draftData[`sdd${i}`],
      chargePenalties,
    });
  }

  return {
    usCitizenshipStatus,
    todaysDate,
    iconNumber,
    clientFullName,
    supervisionType,
    supervisionStartDate,
    supervisionEndDate,
    officerFullName,
    staffTitle,
    workUnit,
    dischargeDate,
    supervisorSignatureDate,
    officerSignatureDate,
    officerSignatureCbcForm,
    officerSignatureParoleDischargeForm,
    supervisorSignatureCbcForm,
    supervisorSignatureParoleDischargeForm,
    supervisorTitle,
    supervisorFullName,
    progressAndRecommendations,
    hasCompletedProbation,
    probationCompletionStatus,
    probationCompletionDate,
    remainsFinanciallyLiable,
    grantedDeferredJudgement,
    hasOtherProbationDischargeOrder,
    otherProbationDischargeOrderDetails,
    charges,
    penalties,
  };
}

export type UsIaEarlyDischargeReferralRecordRaw = z.input<
  typeof usIaEarlyDischargeSchema
>;

export type UsIaEarlyDischargeReferralRecord = z.infer<
  typeof usIaEarlyDischargeSchema
>;
