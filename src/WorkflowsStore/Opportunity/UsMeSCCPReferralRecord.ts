/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { cloneDeep } from "lodash";

import { TransformFunction } from "../subscriptions";
import { fieldToDate } from "../utils";
import { WithCaseNotes } from "./types";
import { transformCaseNotes } from "./utils";

export type UsMeSCCPCriteria = {
  usMeMinimumOrCommunityCustody: { custodyLevel: string };
  usMeServedXPortionOfSentence: {
    eligibleDate: Date;
    xPortionServed: "1/2" | "2/3";
  };
  usMeXMonthsRemainingOnSentence: { eligibleDate: Date };
  usMeNoDetainersWarrantsOrOther: null;
  usMeNoClassAOrBViolationFor90Days: null | { eligibleDate: Date };
};

export type UsMeSCCPReferralRecord = {
  stateCode: string;
  externalId: string;
  eligibleCriteria: Partial<UsMeSCCPCriteria>;
  ineligibleCriteria: Partial<UsMeSCCPCriteria>;
} & WithCaseNotes;

export type UsMeSCCPDraftData = {
  residentName: string;
  mdocNo: string;
  facilityHousingUnit: string;
  caseManager: string;
};

const transformCriteria = (
  criteria: Partial<Record<keyof UsMeSCCPCriteria, Record<string, string>>>
): Partial<UsMeSCCPCriteria> => {
  const transformedCriteria = cloneDeep(criteria) as Partial<UsMeSCCPCriteria>;

  if (transformedCriteria.usMeServedXPortionOfSentence) {
    transformedCriteria.usMeServedXPortionOfSentence.eligibleDate = fieldToDate(
      // @ts-expect-error: We know this field exists since the one we checked above is a clone of it
      criteria.usMeServedXPortionOfSentence.eligibleDate
    );
  }

  if (transformedCriteria.usMeXMonthsRemainingOnSentence) {
    transformedCriteria.usMeXMonthsRemainingOnSentence.eligibleDate = fieldToDate(
      // @ts-expect-error: We know this field exists since the one we checked above is a clone of it
      criteria.usMeXMonthsRemainingOnSentence.eligibleDate
    );
  }

  if (transformedCriteria.usMeNoClassAOrBViolationFor90Days) {
    transformedCriteria.usMeNoClassAOrBViolationFor90Days.eligibleDate = fieldToDate(
      // @ts-expect-error: We know this field exists since the one we checked above is a clone of it
      criteria.usMeNoClassAOrBViolationFor90Days.eligibleDate
    );
  }

  return transformedCriteria;
};

export const transformReferral: TransformFunction<UsMeSCCPReferralRecord> = (
  record
) => {
  if (!record) return;

  const transformedRecord = cloneDeep(record) as UsMeSCCPReferralRecord;

  transformedRecord.eligibleCriteria = transformCriteria(
    record.eligibleCriteria
  );
  transformedRecord.ineligibleCriteria = transformCriteria(
    record.ineligibleCriteria
  );

  transformedRecord.caseNotes = transformCaseNotes(record.caseNotes);

  return transformedRecord;
};
