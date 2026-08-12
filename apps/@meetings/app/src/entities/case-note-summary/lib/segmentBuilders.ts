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

import { isValid, parseISO } from "date-fns";

import { CaseNoteSummarySegment, CniCitation } from "../model/types";

/** Reports data we couldn't template, so gaps show up in logs instead of silently. */
export type CniWarn = (message: string) => void;

export function usableField(field: PrismaJson.CNIField | undefined) {
  return field?.fieldValue.trim() ? field : undefined;
}

function toCitation(field: PrismaJson.CNIField): CniCitation | undefined {
  const quotes = Array.isArray(field.quotes)
    ? field.quotes.filter(
        (quote): quote is string =>
          typeof quote === "string" && quote.trim().length > 0,
      )
    : [];

  // Without quotes there is nothing to put in the tooltip, so the phrase renders as
  // plain text rather than as an underline that opens an empty popover.
  if (quotes.length === 0) return undefined;

  const parsed =
    typeof field.lastVerifiedDate === "string"
      ? parseISO(field.lastVerifiedDate)
      : undefined;

  return {
    quotes,
    lastVerifiedDate: parsed && isValid(parsed) ? parsed : undefined,
  };
}

export function toSegment(
  content: string,
  field?: PrismaJson.CNIField,
): CaseNoteSummarySegment {
  if (field) {
    const citation = toCitation(field);
    return citation ? { content, citation } : { content };
  }

  return { content };
}

/**
 * Builds a segment from a free-text field, e.g. `employerName` -> " at Acme Corp".
 */
export function citedValue(
  field: PrismaJson.CNIField | undefined,
  template: (value: string) => string,
): CaseNoteSummarySegment | undefined {
  const usable = usableField(field);
  if (!usable) return undefined;
  return toSegment(template(usable.fieldValue.trim()), usable);
}

/**
 * Builds a segment from an enum-valued field by looking its raw snake_case
 * `fieldValue` up in a fragment map, e.g. `employmentType: "employee_pt"` -> " part-time".
 */
export function citedFragment(
  field: PrismaJson.CNIField | undefined,
  fragments: Record<string, string>,
  context: { fieldKey: string; warn: CniWarn },
  template: (fragment: string) => string = (fragment) => ` ${fragment}`,
): CaseNoteSummarySegment | undefined {
  const usable = usableField(field);
  if (!usable) return undefined;

  if (!Object.hasOwn(fragments, usable.fieldValue)) {
    // The rest of the sentence still renders; we just lose this phrase.
    context.warn(
      `no template fragment for ${context.fieldKey}="${usable.fieldValue}"`,
    );
    return undefined;
  }

  return toSegment(template(fragments[usable.fieldValue]), usable);
}

/** Drops the leading space a fragment carries so it can start a phrase. */
export function trimLeadingSpace(
  segments: CaseNoteSummarySegment[],
): CaseNoteSummarySegment[] {
  const [first, ...rest] = segments;
  if (!first) return segments;
  return [{ ...first, content: first.content.trimStart() }, ...rest];
}

/**
 * Joins phrases with Oxford-comma glue, used for clients with multiple employers.
 */
export function joinSegmentGroups(
  groups: (CaseNoteSummarySegment[] | undefined)[],
): CaseNoteSummarySegment[] {
  const phrases = groups.filter(
    (group): group is CaseNoteSummarySegment[] => !!group?.length,
  );

  // "a and b" for two phrases, "a, b, and c" for three or more.
  const lastSeparator = phrases.length === 2 ? " and " : ", and ";

  return phrases.flatMap((phrase, index) => {
    if (index === 0) return phrase;
    const isLast = index === phrases.length - 1;
    return [toSegment(isLast ? lastSeparator : ", "), ...phrase];
  });
}
