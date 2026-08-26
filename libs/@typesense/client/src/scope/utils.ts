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

// Clause-building helpers shared by the scope compilers.
//
// Typesense `filter_by` syntax:
//   field:=value                — exact match
//   field:=[v1, v2, v3]         — match any-of
//   clause1 && clause2          — AND
//   clause1 || clause2          — OR
//   ( ... )                     — grouping for precedence
//   `value with spaces`         — backtick-quoted string for values with special chars

export function quote(value: string): string {
  // Backtick-wrap to handle values with spaces, dashes, or other special chars.
  // Escape any backticks in the value itself.
  return `\`${value.replaceAll("`", "\\`")}\``;
}

export function quoteList(values: string[]): string {
  return `[${values.map(quote).join(", ")}]`;
}

// `id` is Typesense's built-in document id, so this is the one predicate that
// compiles against every collection without a schema change.
export const NEVER_MATCH_CLAUSE = "id:=`__no_match__`";

// Wraps a collection-level predicate in the state clause. The predicate is
// parenthesized so its ORs bind tighter than the outer AND.
export function withStateClause(
  stateCode: string,
  predicate: string | null,
): string {
  const stateClause = `stateCode:=${quote(stateCode)}`;
  return predicate === null ? stateClause : `${stateClause} && (${predicate})`;
}
