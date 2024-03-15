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
import { get, snakeCase } from "lodash";
import simplur from "simplur";

import { formatWorkflowsDate, toTitleCase } from "../../../utils";
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

function dateify(d: Date | string) {
  return d instanceof Date ? d : parseISO(d);
}

const formatterHelperFunctions: Record<string, (...raw: any) => any> = {
  lowerCase: (s) => s.toLowerCase(),
  upperCase: (s) => s.toUpperCase(),
  titleCase: toTitleCase,
  date: (date) => formatWorkflowsDate(dateify(date)),
  daysPast: (date) => differenceInDays(new Date(), dateify(date)).toString(),
  daysUntil: (date) => differenceInDays(dateify(date), new Date()).toString(),
  eq: (a, b) => a === b,
};

type Reason = Record<string, any>;

export type UntypedCriteriaFormatters = Record<
  string,
  (criteria: Reason, record: any) => string
>;

type HydrationContext = {
  criteria: Reason;
  formatters: UntypedCriteriaFormatters;
  record: any;
};

type BlockState = { isLive: boolean; seenElse: boolean };

const UNKNOWN = Symbol("UNKNOWN");

function lookupExpr(
  expr: string,
  { criteria, formatters, record }: HydrationContext,
) {
  const literalMatch = expr.match(/^"(.*)"$/);
  if (literalMatch) return literalMatch[1];

  if (expr in formatters) return formatters[expr](criteria, record);

  const value = get({ ...criteria, record }, expr, UNKNOWN);

  if (value === UNKNOWN) {
    throw new Error(`Couldn't find ${expr}`);
  }
  return value;
}

function hydrateTag(params: string[], context: HydrationContext) {
  let variables: string[], helper: string | undefined;
  if (params.length === 1) {
    variables = params;
  } else if (params.length > 1) {
    [helper, ...variables] = params;
  } else {
    throw new Error("empty tag");
  }

  variables = variables.map((v) => lookupExpr(v, context));

  if (helper) {
    return formatterHelperFunctions[helper](...variables);
  }
  return variables[0];
}

function handleBlockTag(
  params: string[],
  isLive: boolean,
  blockStack: BlockState[],
  context: HydrationContext,
) {
  const tag = params[0];
  if (tag === "#if") {
    blockStack.push({ isLive, seenElse: false });
    if (isLive) isLive = !!hydrateTag(params.slice(1), context);
  } else if (tag === "else") {
    const topBlock = blockStack.length && blockStack[blockStack.length - 1];
    if (topBlock && !topBlock.seenElse) {
      blockStack[blockStack.length - 1].seenElse = true;
      if (topBlock.isLive) isLive = !isLive;
    } else {
      throw new Error("unexpected else");
    }
  } else if (tag === "/if") {
    const topBlock = blockStack.pop();
    if (topBlock) {
      if (topBlock.isLive) isLive = true;
    } else {
      throw new Error("unexpected /if");
    }
  }
  return { blockStack, isLive };
}

/** Only exported for testing purposes */
export function hydrateStr(raw: string, context: HydrationContext) {
  let pos = 0;
  const outSegments = [];
  let isLive = true; // false when we're in the inoperative arm of an if block
  let blockStack: BlockState[] = [];
  for (const match of raw.matchAll(/\{\{\s*(.*?)\s*\}\}/g)) {
    if (match.index === undefined) continue; // Will never happen: see https://github.com/microsoft/TypeScript/issues/36788
    const params = match[1].split(/\s+/);
    if (isLive) outSegments.push(raw.slice(pos, match.index));
    pos = match.index + match[0].length;
    if (["#if", "else", "/if"].includes(params[0])) {
      ({ isLive, blockStack } = handleBlockTag(
        params,
        isLive,
        blockStack,
        context,
      ));
    } else if (isLive) {
      try {
        outSegments.push(hydrateTag(params, context));
      } catch (e) {
        captureException(e);
        outSegments.push("UNKNOWN");
      }
    }
  }
  if (blockStack.length) throw new Error("Unclosed #if block");
  outSegments.push(raw.slice(pos));
  return outSegments.join("");
}

export function hydrateUntypedCriteria(
  recordCriteria: Record<string, Reason | null>,
  criteriaCopy: Record<string, OpportunityRequirement>,
  formatters: UntypedCriteriaFormatters = {},
  record: any = {},
): OpportunityRequirement[] {
  function hydrateReq(raw: OpportunityRequirement, criteria: Reason) {
    const context: HydrationContext = {
      criteria,
      formatters,
      record,
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
