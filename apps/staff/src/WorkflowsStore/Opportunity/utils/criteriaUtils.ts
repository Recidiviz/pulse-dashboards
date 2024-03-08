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

import { differenceInDays, differenceInMonths } from "date-fns";
import { snakeCase } from "lodash";
import simplur from "simplur";

import { AllPossibleKeys } from "../../../utils/typeUtils";
import { OpportunityRequirement } from "../types";

export const monthsOrDaysRemainingFromToday = (eligibleDate: Date): string => {
  const months = differenceInMonths(eligibleDate, new Date());
  if (months === 0) {
    return simplur`${differenceInDays(eligibleDate, new Date())} more day[|s]`;
  }
  return simplur`${months} more month[|s]`;
};

type CriteriaGroupKey = "eligibleCriteria" | "ineligibleCriteria";
type WithCriteria = Record<
  CriteriaGroupKey,
  Record<string, object | null | undefined>
>;

export type CopyTuple<K extends string> = [K, OpportunityRequirement];
// Copy is defined as an array rather than a record so it can have a well-defined order

export type CriteriaCopy<R extends WithCriteria> = {
  [K in CriteriaGroupKey]: Array<CopyTuple<AllPossibleKeys<R[K]>>>;
};
// Formatters are defined in a separate dict so the function type can depend on the criterion

export type CriteriaFormatters<R extends WithCriteria> = {
  [K in CriteriaGroupKey]?: {
    [C in keyof R[K]]?: Record<
      string,
      (criterion: Required<R[K]>[C], record: R) => string
    >;
  };
};

export function hydrateCriteria<
  R extends WithCriteria,
  C extends CriteriaGroupKey,
>(
  record: R | undefined,
  criteriaGroupKey: C,
  criteriaCopy: CriteriaCopy<R>,
  criteriaFormatters: CriteriaFormatters<R> = {},
): OpportunityRequirement[] {
  if (!record) return [];

  return criteriaCopy[criteriaGroupKey]
    .filter(([criterionKey]) => criterionKey in record[criteriaGroupKey])
    .map(([criterionKey, copy]) => {
      const out: OpportunityRequirement = { ...copy };
      const criterion = record[criteriaGroupKey][criterionKey];

      const formatters = [
        ...Object.entries(
          criteriaFormatters[criteriaGroupKey]?.[criterionKey] ?? {},
        ),
        // Auto-generate fallback formatters
        ...Object.entries(criterion ?? {}).map(
          ([k, v]): [string, () => string] => [
            snakeCase(k).toUpperCase(),
            () => String(v),
          ],
        ),
      ];
      formatters.forEach(([name, fmt]) => {
        const placeholder = `$${name}`;
        const formatted = fmt(criterion, record);
        out.text = out.text.replaceAll(placeholder, formatted);
        if (out.tooltip) {
          out.tooltip = out.tooltip.replaceAll(placeholder, formatted);
        }
      });
      // TODO: Should we catch unreplaced placeholders? Might be false positives
      // since the syntax is so minimal
      return out;
    });
}

export function hydrateUntypedCriteria(
  recordCriteria: Record<string, object | null>,
  criteriaCopy: Record<string, OpportunityRequirement>,
): OpportunityRequirement[] {
  return Object.entries(criteriaCopy).flatMap(([criteria, copy]) =>
    criteria in recordCriteria ? [copy] : [],
  );
}
