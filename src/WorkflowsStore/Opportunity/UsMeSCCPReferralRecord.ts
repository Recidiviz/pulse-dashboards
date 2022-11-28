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

export type UsMeSCCPReferralRecord = {
  stateCode: string;
  externalId: string;
  criteria: {
    usMeMinimumOrCommunityCustody: { custodyLevel: string };
    usMeServedXPortionOfSentence: { eligibleDate: Date };
    usMeXMonthsRemainingOnSentence: { eligibleDate: Date };
  };
} & WithCaseNotes;

export const transformReferral: TransformFunction<UsMeSCCPReferralRecord> = (
  record
) => {
  if (!record) return;

  const transformedRecord = cloneDeep(record) as UsMeSCCPReferralRecord;

  transformedRecord.criteria.usMeServedXPortionOfSentence.eligibleDate = fieldToDate(
    record.criteria.usMeServedXPortionOfSentence.eligibleDate
  );

  transformedRecord.criteria.usMeXMonthsRemainingOnSentence.eligibleDate = fieldToDate(
    record.criteria.usMeXMonthsRemainingOnSentence.eligibleDate
  );

  transformedRecord.caseNotes = transformCaseNotes(record.caseNotes);

  return transformedRecord;
};
