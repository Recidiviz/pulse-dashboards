// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { cloneDeep } from "lodash";

import { TransformFunction } from "../subscriptions";
import { fieldToDate } from "../utils";
import {
  LSUEarnedDischargeEligibleCriteria,
  LSUEarnedDischargeIneligibleCriteria,
  transformLSUEarnedDischargeCriteria,
} from "./LSUReferralRecord";
import { WithCaseNotes } from "./types";
import { transformCaseNotes } from "./utils";

export type EarnedDischargeReferralRecord = {
  stateCode: string;
  externalId: string;
  formInformation: {
    ncicCheckDate?: Date;
    fullTermReleaseDates?: Date[];
    chargeDescriptions?: string[];
    judgeNames?: {
      givenNames: string;
      middleNames: string;
      nameSuffix: string;
      surname: string;
    }[];
    countyNames?: string[];
    sentenceMax?: number[];
    sentenceMin?: number[];
    caseNumbers?: string[];
    dateImposed?: Date[];
    initialRestitution?: number;
    lastRestitutionPaymentDate?: Date;
    currentRestitutionBalance?: number;
    initialFines?: number;
    lastFinesPaymentDate?: Date;
    currentFinesBalance?: number;
    firstAssessmentScore?: number;
    firstAssessmentDate?: Date;
    latestAssessmentScore?: number;
    latestAssessmentDate?: Date;
  };
  ineligibleCriteria: Partial<LSUEarnedDischargeIneligibleCriteria>;
  eligibleCriteria: LSUEarnedDischargeEligibleCriteria & {
    pastEarnedDischargeEligibleDate?: {
      eligibleDate: Date;
      sentenceType: "PROBATION" | "PAROLE" | "DUAL";
    };
    usIdLsirLevelLowModerateForXDays: {
      eligibleDate: Date;
      riskLevel: "LOW" | "MODERATE";
    };
  };
  eligibleStartDate: Date;
} & WithCaseNotes;

export type EarnedDischargeCrimeTableKeys =
  | "judgeNames"
  | "countyNames"
  | "dateImposed"
  | "caseNumbers"
  | "chargeDescriptions"
  | "sentenceMin"
  | "sentenceMax"
  | "fullTermReleaseDates";

export type EarnedDischargeDraftData = {
  clientName: string;
  supervisionType: string;
  idocNumber: string;
  ftrDate: string;
  probationOfficerFullName: string;
  conditionCompliance: string;
  meetsIdocRequirements: string;
  ncicCheck: string;
  ncicCheckDate: string;
  initialRestitution: string;
  lastRestitutionPaymentDate: string;
  currentRestitutionBalance: string;
  initialFines: string;
  lastFinesPaymentDate: string;
  currentFinesBalance: string;
  firstAssessmentScore: string;
  firstAssessmentDate: string;
  latestAssessmentScore: string;
  latestAssessmentDate: string;
  numCrimeEntries: number;
} & Record<`${EarnedDischargeCrimeTableKeys}${number}`, string>;

export const transformReferral: TransformFunction<
  EarnedDischargeReferralRecord
> = (record) => {
  if (!record) {
    throw new Error("Record not found");
  }

  const transformedRecord = cloneDeep(record) as EarnedDischargeReferralRecord;
  const { eligibleCriteria, ineligibleCriteria } = record;

  const transformedCommonCriteria = transformLSUEarnedDischargeCriteria(record);

  transformedRecord.eligibleCriteria = {
    ...transformedRecord.eligibleCriteria,
    ...transformedCommonCriteria?.eligibleCriteria,
  };

  transformedRecord.ineligibleCriteria = {
    ...transformedRecord.ineligibleCriteria,
    ...transformedCommonCriteria?.ineligibleCriteria,
  };

  transformedRecord.eligibleCriteria.usIdLsirLevelLowModerateForXDays = {
    riskLevel: eligibleCriteria.usIdLsirLevelLowModerateForXDays.riskLevel,
    eligibleDate: fieldToDate(
      eligibleCriteria.usIdLsirLevelLowModerateForXDays.eligibleDate
    ),
  };

  // Almost eligible and eligible criteria
  if (transformedRecord.eligibleCriteria?.pastEarnedDischargeEligibleDate) {
    transformedRecord.eligibleCriteria.pastEarnedDischargeEligibleDate = {
      eligibleDate: fieldToDate(
        eligibleCriteria.usIdParoleDualSupervisionPastEarlyDischargeDate
          ?.eligibleDate ??
          eligibleCriteria.onProbationAtLeastOneYear?.eligibleDate
      ),
      sentenceType:
        eligibleCriteria.usIdParoleDualSupervisionPastEarlyDischargeDate
          ?.sentenceType ??
        eligibleCriteria.onProbationAtLeastOneYear?.sentenceType,
    };
  }

  if (transformedRecord.ineligibleCriteria?.pastEarnedDischargeEligibleDate) {
    transformedRecord.ineligibleCriteria.pastEarnedDischargeEligibleDate = {
      eligibleDate: fieldToDate(
        ineligibleCriteria.usIdParoleDualSupervisionPastEarlyDischargeDate
          ?.eligibleDate ??
          ineligibleCriteria.onProbationAtLeastOneYear?.eligibleDate
      ),
      sentenceType:
        ineligibleCriteria.usIdParoleDualSupervisionPastEarlyDischargeDate
          ?.sentenceType ??
        ineligibleCriteria.onProbationAtLeastOneYear?.sentenceType,
    };
  }

  if (transformedRecord.ineligibleCriteria?.onProbationAtLeastOneYear) {
    transformedRecord.ineligibleCriteria.onProbationAtLeastOneYear = {
      eligibleDate:
        ineligibleCriteria.onProbationAtLeastOneYear?.eligibleDate &&
        fieldToDate(ineligibleCriteria.onProbationAtLeastOneYear?.eligibleDate),
    };
  }

  delete (
    // @ts-expect-error
    // prettier-ignore
    transformedRecord.eligibleCriteria.usIdParoleDualSupervisionPastEarlyDischargeDate
  );
  // @ts-expect-error
  delete transformedRecord.eligibleCriteria.onProbationAtLeastOneYear;

  // delete vestigial criterion left over from TES we don't use in the front end
  delete (
    // @ts-expect-error
    transformedRecord.eligibleCriteria.supervisionNotPastFullTermCompletionDate
  );

  transformedRecord.eligibleStartDate = fieldToDate(record.eligibleStartDate);

  transformedRecord.caseNotes = transformCaseNotes(record.caseNotes);

  const {
    ncicCheckDate,
    dateImposed,
    fullTermReleaseDates,
    lastRestitutionPaymentDate,
    lastFinesPaymentDate,
    firstAssessmentDate,
    latestAssessmentDate,
    judgeNames,
  } = record.formInformation;

  if (ncicCheckDate) {
    transformedRecord.formInformation.ncicCheckDate =
      fieldToDate(ncicCheckDate);
  }

  if (lastRestitutionPaymentDate) {
    transformedRecord.formInformation.lastRestitutionPaymentDate = fieldToDate(
      lastRestitutionPaymentDate
    );
  }

  if (lastFinesPaymentDate) {
    transformedRecord.formInformation.lastFinesPaymentDate =
      fieldToDate(lastFinesPaymentDate);
  }

  if (firstAssessmentDate) {
    transformedRecord.formInformation.firstAssessmentDate =
      fieldToDate(firstAssessmentDate);
  }

  if (latestAssessmentDate) {
    transformedRecord.formInformation.latestAssessmentDate =
      fieldToDate(latestAssessmentDate);
  }

  if (dateImposed) {
    transformedRecord.formInformation.dateImposed = dateImposed.map(
      (d: string) => fieldToDate(d)
    );
  }

  if (fullTermReleaseDates) {
    transformedRecord.formInformation.fullTermReleaseDates =
      fullTermReleaseDates.map((d: string) => fieldToDate(d));
  }

  if (judgeNames) {
    transformedRecord.formInformation.judgeNames = judgeNames.map(
      (blob: string) => {
        try {
          return JSON.parse(blob);
        } catch (e) {
          return {};
        }
      }
    );
  }

  return transformedRecord;
};
