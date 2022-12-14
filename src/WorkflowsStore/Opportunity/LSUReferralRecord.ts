// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import {
  fieldToDate,
  optionalFieldToDate,
  optionalFieldToDateArray,
} from "../utils";
import { WithCaseNotes } from "./types";
import { transformCaseNotes } from "./utils";

export type LSUEarnedDischargeCommonCriteria = {
  negativeUaWithin90Days: {
    latestUaDates: Date[];
    latestUaResults: boolean[];
  };
  noFelonyWithin24Months: { latestFelonyConvictions: Date[] };
  noViolentMisdemeanorWithin12Months: {
    latestViolentConvictions: Date[];
  };
  usIdIncomeVerifiedWithin3Months: {
    incomeVerifiedDate?: Date;
  };
};

export type LSUReferralRecord = {
  stateCode: string;
  externalId: string;
  formInformation: {
    chargeDescriptions?: string[];
    currentAddress?: string;
    currentPhoneNumber?: string;
    assessmentDate?: string;
    assessmentScore?: number;
    emailAddress?: string;
    employerName?: string;
    employerAddress?: string;
    employmentStartDate?: string;
    employmentDateVerified?: string;
    latestNegativeDrugScreenDate?: string;
    ncicReviewDate?: string;
    ncicNoteTitle?: string;
    ncicNoteBody?: string;
    txDischargeDate?: string;
    txNoteTitle?: string;
    txNoteBody?: string;
  };
  criteria: LSUEarnedDischargeCommonCriteria & {
    usIdNoActiveNco: {
      activeNco: boolean;
    };
    usIdLsirLevelLowFor90Days: {
      eligibleDate: Date;
      riskLevel: "LOW";
    };
    onSupervisionAtLeastOneYear: { eligibleDate: Date };
  };

  eligibleStartDate: Date;
} & WithCaseNotes;

export type LSUDraftData = {
  clientName: string;
  chargeDescriptions: string;
  contactInformation: string;
  employmentInformation: string;
  assessmentInformation: string;
  substanceTest: string;
  courtFinesAndRestitution: string;
  costOfSupervision: string;
  iletsReviewDate: string;
  courtOrderDate: string;
  treatmentCompletionDate: string;
  specialConditionsCompletedDates: string;
  pendingSpecialConditions: string;
  ncicCheck: string;
  currentClientGoals: string;
  clientSummary: string;
};

export const transformLSUEarnedDischargeCommonCriteria: TransformFunction<LSUEarnedDischargeCommonCriteria> = (
  criteria
) => {
  if (!criteria) {
    throw new Error("No criteria found");
  }

  const transformedCriteria: LSUEarnedDischargeCommonCriteria = {
    negativeUaWithin90Days: {
      latestUaDates:
        optionalFieldToDateArray(
          criteria.negativeUaWithin90Days?.latestUaDates
        ) ?? [],
      latestUaResults: criteria.negativeUaWithin90Days?.latestUaResults ?? [],
    },

    noFelonyWithin24Months: {
      latestFelonyConvictions:
        optionalFieldToDateArray(
          criteria.noFelonyWithin24Months?.latestFelonyConvictions
        ) ?? [],
    },

    noViolentMisdemeanorWithin12Months: {
      latestViolentConvictions:
        optionalFieldToDateArray(
          criteria.noViolentMisdemeanorWithin12Months?.latestViolentConvictions
        ) ?? [],
    },

    usIdIncomeVerifiedWithin3Months: {
      incomeVerifiedDate: optionalFieldToDate(
        criteria.usIdIncomeVerifiedWithin3Months.incomeVerifiedDate
      ),
    },
  };

  return transformedCriteria;
};

export const transformReferral: TransformFunction<LSUReferralRecord> = (
  record
) => {
  if (!record) {
    throw new Error("No record found");
  }

  const transformedRecord = cloneDeep(record) as LSUReferralRecord;
  const { criteria } = record;

  const transformedCommonCriteria = transformLSUEarnedDischargeCommonCriteria(
    criteria
  );

  transformedRecord.criteria = {
    ...transformedRecord.criteria,
    ...transformedCommonCriteria,
  };

  transformedRecord.criteria.usIdLsirLevelLowFor90Days = {
    riskLevel:
      criteria.usIdLsirLevelLowFor90Days?.riskLevel ??
      criteria.usIdLsirLevelLowModerateForXDays?.riskLevel,
    eligibleDate: criteria.usIdLsirLevelLowFor90Days
      ? fieldToDate(criteria.usIdLsirLevelLowFor90Days.eligibleDate)
      : fieldToDate(criteria.usIdLsirLevelLowModerateForXDays.eligibleDate),
  };

  transformedRecord.criteria.usIdNoActiveNco = {
    activeNco: criteria.usIdNoActiveNco?.activeNco ?? false,
  };
  transformedRecord.criteria.onSupervisionAtLeastOneYear = {
    eligibleDate: fieldToDate(
      criteria.onSupervisionAtLeastOneYear.eligibleDate
    ),
  };

  // delete vestigial criterion left over from TES we don't use in the front end
  // @ts-expect-error
  delete transformedRecord.criteria.supervisionNotPastFullTermCompletionDate;
  // @ts-expect-error
  delete transformedRecord.criteria.usIdLsirLevelLowModerateForXDays;

  transformedRecord.eligibleStartDate = fieldToDate(record.eligibleStartDate);

  transformedRecord.caseNotes = transformCaseNotes(record.caseNotes);

  return transformedRecord;
};
