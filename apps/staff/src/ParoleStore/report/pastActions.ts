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

import { PastActionsInput } from "~datatypes";

import {
  ResolvedRow,
  ResolvedSection,
  resolveSection,
  SectionConfig,
} from "./resolveSection";

// Past Actions has no section-level fields.
type NoFields = Record<never, never>;

export type PastActionFields = {
  // A month, YYYY-MM.
  date: string;
  notes: string;
};

type PastActionRow = ResolvedRow<PastActionFields>;

// Oldest first, with undated rows last. resolveSection keeps rows this ranks
// equal, such as two undated rows, in the order the PHI added them.
function byDate(a: PastActionRow, b: PastActionRow): number {
  const aDate = a.fields.date.value;
  const bDate = b.fields.date.value;
  if (aDate === bDate) return 0;
  if (aDate === null) return 1;
  if (bDate === null) return -1;
  return aDate < bDate ? -1 : 1;
}

// Atlas has no source for Past Actions, so every row is one the PHI added.
const pastActionsConfig: SectionConfig<
  undefined,
  never,
  NoFields,
  PastActionFields
> = {
  fields: {},
  rows: { fields: { date: {}, notes: {} }, compare: byDate },
};

/**
 * Returns the Past Actions rows the report shows, dated rows oldest first and
 * then undated rows in the order the PHI added them.
 *
 * For example, if the PHI added these rows in this order (ids abridged):
 *
 *   id         date     notes
 *   phi_..832  2019-06  Granted parole by the Board
 *   phi_..901
 *   phi_..955  2015-03  Sentenced, entered custody
 *   phi_..990           Escaped from a work release center
 *
 * the section resolves to these rows:
 *
 *   id         date     notes
 *   phi_..955  2015-03  Sentenced, entered custody
 *   phi_..832  2019-06  Granted parole by the Board
 *   phi_..901  null     null
 *   phi_..990  null     Escaped from a work release center
 *
 * @param input - The report's Past Actions input, or undefined if the PHI has
 *   added no rows.
 */
export function resolvePastActions(
  input: PastActionsInput | undefined,
): ResolvedSection<NoFields, PastActionFields> {
  return resolveSection(pastActionsConfig, undefined, input);
}
