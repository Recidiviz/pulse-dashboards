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

import { captureException } from "@sentry/react";
import { differenceInDays, differenceInMonths, parseISO } from "date-fns";
import Handlebars from "handlebars";
import { mapValues, snakeCase } from "lodash";
import simplur from "simplur";

import {
  formatDaysToYearsMonthsPast,
  formatWorkflowsDate,
  formatYearsMonthsFromNow,
  toTitleCase,
} from "../../../utils";
import { AllPossibleKeys } from "../../../utils/typeUtils";
import { JusticeInvolvedPerson } from "../../types";
import { Opportunity, OpportunityRequirement } from "../types";
import { usMiSegregationDisplayName } from "./usMi/usMiCriteriaUtils";

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

function dateify(d: Date | string) {
  return d instanceof Date ? d : parseISO(d);
}

const formatterHelperFunctions: Record<string, (...raw: any) => any> = {
  lowerCase: (s) => s.toLowerCase(),
  upperCase: (s) => s.toUpperCase(),
  titleCase: toTitleCase,
  date: (date) => formatWorkflowsDate(dateify(date)),
  daysPast: (date) => differenceInDays(new Date(), dateify(date)),
  daysUntil: (date) => differenceInDays(dateify(date), new Date()),
  monthsUntil: (date) => differenceInMonths(dateify(date), new Date()),
  yearsMonthsUntil: (date) => formatYearsMonthsFromNow(dateify(date)),
  daysToYearsMonthsPast: (days) => formatDaysToYearsMonthsPast(days),
  eq: (a, b) => a === b,

  // US_MI helpers
  usMiSegregationDisplayName,
};

type Reason = Record<string, any>;

export type UntypedCriteriaFormatters = Record<
  string,
  (criteria: Reason & { record: any }) => string
>;

type HydrationContext = {
  criteria: Reason;
  formatters: UntypedCriteriaFormatters;
  opportunity: Opportunity;
};

// Handlebars helpers take the context as `this`, but these
// days it's much easier to just write functions of arguments
function makeThisFirstArg(f: (...args: any) => any) {
  return function (this: any, ...args: any) {
    return f(this, ...args);
  };
}

export function hydrateStr(
  raw: string,
  { criteria, formatters, opportunity }: HydrationContext,
) {
  const template = Handlebars.compile(raw);

  function trapException(f: (...args: any) => any) {
    return function (this: any, ...args: any[]) {
      try {
        return f.apply(this, args);
      } catch (e) {
        captureException(`${e} in "${raw}"`);
        return "UNKNOWN";
      }
    };
  }
  const helpers = mapValues(
    {
      ...mapValues(formatters, makeThisFirstArg),
      ...formatterHelperFunctions,
      helperMissing: (ctx: any) => {
        throw new Error(`Couldn't find ${ctx?.name ?? "a tag"}`);
      },
    },
    trapException,
  );

  return template(
    { ...criteria, record: opportunity.record, opportunity },
    { helpers, allowProtoPropertiesByDefault: true },
  );
}

export function hydrateUntypedCriteria(
  recordCriteria: Record<string, Reason | null>,
  criteriaCopy: Record<string, OpportunityRequirement>,
  opportunity: Opportunity<JusticeInvolvedPerson>,
  formatters: UntypedCriteriaFormatters = {},
): OpportunityRequirement[] {
  function hydrateReq(raw: OpportunityRequirement, criteria: Reason) {
    const context: HydrationContext = {
      criteria,
      formatters,
      opportunity,
    };
    const out = {
      ...raw,
      text: hydrateStr(raw.text, context),
    };
    if (raw.tooltip) out.tooltip = hydrateStr(raw.tooltip, context);
    return out;
  }
  return Object.entries(criteriaCopy).flatMap(([criteria, copy]) =>
    criteria in recordCriteria
      ? [hydrateReq(copy, recordCriteria[criteria] ?? {})]
      : [],
  );
}
