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
import { fieldToDate } from "../utils";
import {
  LSUEarnedDischargeCommonCriteria,
  transformLSUEarnedDischargeCommonCriteria,
} from "./LSUReferralRecord";
import { WithCaseNotes } from "./types";
import { transformCaseNotes } from "./utils";

export type EarnedDischargeReferralRecord = {
  stateCode: string;
  externalId: string;
  formInformation: {
    clientName: string;
  };
  criteria: LSUEarnedDischargeCommonCriteria & {
    pastEarnedDischargeEligibleDate: {
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

export type EarnedDischargeDraftData = {
  clientName: string;
};

export const transformReferral: TransformFunction<EarnedDischargeReferralRecord> = (
  record
) => {
  if (!record) return;

  const transformedRecord = cloneDeep(record) as EarnedDischargeReferralRecord;
  const { criteria } = record;

  const transformedCommonCriteria = transformLSUEarnedDischargeCommonCriteria(
    criteria
  );

  transformedRecord.criteria = {
    ...transformedRecord.criteria,
    ...transformedCommonCriteria,
  };

  transformedRecord.criteria.usIdLsirLevelLowModerateForXDays = {
    riskLevel: criteria.usIdLsirLevelLowModerateForXDays.riskLevel,
    eligibleDate: fieldToDate(
      criteria.usIdLsirLevelLowModerateForXDays.eligibleDate
    ),
  };

  transformedRecord.criteria.pastEarnedDischargeEligibleDate = {
    eligibleDate: fieldToDate(
      criteria.usIdParoleDualSupervisionPastEarlyDischargeDate?.eligibleDate ??
        criteria.onProbationAtLeastOneYear?.eligibleDate
    ),
    sentenceType:
      criteria.usIdParoleDualSupervisionPastEarlyDischargeDate?.sentenceType ??
      criteria.onProbationAtLeastOneYear?.sentenceType,
  };

  delete (
    // @ts-expect-error
    transformedRecord.criteria.usIdParoleDualSupervisionPastEarlyDischargeDate
  );
  // @ts-expect-error
  delete transformedRecord.criteria.onProbationAtLeastOneYear;

  // delete vestigial criterion left over from TES we don't use in the front end
  // @ts-expect-error
  delete transformedRecord.criteria.supervisionNotPastFullTermCompletionDate;

  transformedRecord.eligibleStartDate = fieldToDate(record.eligibleStartDate);

  transformedRecord.caseNotes = transformCaseNotes(record.caseNotes);

  return transformedRecord;
};
