// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import {
  TRUSTEE_ANNEX_SUB_QUESTION,
  TRUSTEE_CRITERIA,
  TrusteeCriterionKey,
} from "../trusteeCriteria";
import { TrusteeFormSchema } from "../utils";

type TrusteeAnswers = Partial<TrusteeFormSchema>;

function answers(
  values: Partial<Record<TrusteeCriterionKey, boolean>>,
  rest: TrusteeAnswers = {},
): TrusteeAnswers {
  return Object.assign(
    {},
    ...TRUSTEE_CRITERIA.filter(({ key }) => values[key] !== undefined).map(
      ({ key }) => ({ [key]: String(values[key]) }),
    ),
    rest,
  );
}

const criterionKey = (n: number) => TRUSTEE_CRITERIA[n - 1].key;

function allAnsweredExcept(
  falseNumbers: number[] = [],
): Partial<Record<TrusteeCriterionKey, boolean>> {
  return Object.fromEntries(
    TRUSTEE_CRITERIA.map(({ key }, index) => [
      key,
      !falseNumbers.includes(index + 1),
    ]),
  );
}

/**
 * The design spec's sample residents, which between them reach every outcome the
 * form can produce. Form answers, not Firestore records.
 */
export const TRUSTEE_SAMPLE_CASES = {
  /** Phoenix Lee. Every criterion met, state facility. */
  allTrue: {
    name: "Phoenix Lee",
    formData: answers(allAnsweredExcept()),
  },

  /** Marion Cole. The sex offender criterion fails, and nothing after it is answered. */
  hardBarFailure: {
    name: "Marion Cole",
    formData: answers({
      [criterionKey(1)]: true,
      [criterionKey(2)]: true,
      [criterionKey(3)]: false,
    }),
  },

  /** Rowan Diaz. All hard bars met, violence risk high, private facility. */
  conditionalFailure: {
    name: "Rowan Diaz",
    formData: answers(allAnsweredExcept([15])),
  },

  /** Sasha Bell. Mid-assessment, nothing resolved yet. */
  partiallyComplete: {
    name: "Sasha Bell",
    formData: answers({
      [criterionKey(1)]: true,
      [criterionKey(2)]: true,
      [criterionKey(3)]: true,
      [criterionKey(4)]: true,
    }),
  },

  /** TN-1911's case: a sex offender not eligible for Trustee but eligible for Annex. */
  annexOnly: {
    name: "Annex-only",
    formData: answers(allAnsweredExcept([3]), {
      [TRUSTEE_ANNEX_SUB_QUESTION.key]: "true",
    }),
  },
} satisfies Record<string, { name: string; formData: TrusteeAnswers }>;
