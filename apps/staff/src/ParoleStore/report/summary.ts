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

import { ParoleReportFourthAmendmentWaiver, SummaryInput } from "~datatypes";

import {
  ResolvedSection,
  resolveSection,
  SectionConfig,
} from "./resolveSection";

// The Summary has no rows.
type NoRowFields = Record<never, never>;

export type SummaryFields = {
  summary: string;
  fourthAmendmentWaiver: ParoleReportFourthAmendmentWaiver;
};

export type ResolvedSummary = ResolvedSection<SummaryFields, NoRowFields>;

// Atlas has nothing for the Summary, so neither field reads from it.
const summaryConfig: SectionConfig<
  undefined,
  never,
  SummaryFields,
  NoRowFields
> = {
  fields: { summary: {}, fourthAmendmentWaiver: {} },
};

/**
 * Returns the Summary the report shows: the PHI's summary text and their 4th
 * Amendment Waiver answer, each null until the PHI enters it.
 *
 * For example, if the PHI wrote a summary and hasn't picked a waiver answer
 * (editors and times abridged):
 *
 *   input:    summary "Cooperative throughout the interview..."
 *   resolves: summary               "Cooperative throughout..."  source PHI
 *             fourthAmendmentWaiver null                         source ATLAS
 *
 * @param input - The report's Summary input, or undefined if the PHI has
 *   entered nothing in the section.
 */
export function resolveSummary(
  input: SummaryInput | undefined,
): ResolvedSummary {
  return resolveSection(summaryConfig, undefined, input);
}
