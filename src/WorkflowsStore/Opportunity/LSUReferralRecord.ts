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
  usIdLsirLevelLowModerateForXDays: {
    eligibleDate: Date;
    riskLevel: "LOW" | "MODERATE";
  };
};

export type LSUReferralRecord = {
  stateCode: string;
  externalId: string;
  formInformation: {
    clientName: string;
  };
  criteria: LSUEarnedDischargeCommonCriteria & {
    usIdNoActiveNco: {
      activeNco: boolean;
    };
  };
  eligibleStartDate: Date;
} & WithCaseNotes;

export type LSUDraftData = {
  clientName: string;
};

export const transformLSUEarnedDischargeCommonCriteria: TransformFunction<LSUEarnedDischargeCommonCriteria> = (
  criteria
) => {
  if (!criteria) return;

  const transformedCriteria: LSUEarnedDischargeCommonCriteria = {
    usIdLsirLevelLowModerateForXDays: {
      riskLevel: criteria.usIdLsirLevelLowModerateForXDays.riskLevel,
      eligibleDate: fieldToDate(
        criteria.usIdLsirLevelLowModerateForXDays.eligibleDate
      ),
    },

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
  if (!record) return;

  const transformedRecord = cloneDeep(record) as LSUReferralRecord;
  const { criteria } = record;

  const transformedCommonCriteria = transformLSUEarnedDischargeCommonCriteria(
    criteria
  );

  transformedRecord.criteria = {
    ...transformedRecord.criteria,
    ...transformedCommonCriteria,
  };

  transformedRecord.criteria.usIdNoActiveNco = {
    activeNco: criteria.usIdNoActiveNco?.activeNco ?? false,
  };

  // delete vestigial criterion left over from TES we don't use in the front end
  // @ts-expect-error
  delete transformedRecord.criteria.supervisionNotPastFullTermCompletionDate;

  transformedRecord.eligibleStartDate = fieldToDate(record.eligibleStartDate);

  transformedRecord.caseNotes = transformCaseNotes(record.caseNotes);

  return transformedRecord;
};
