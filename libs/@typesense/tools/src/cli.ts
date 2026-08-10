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

// Coerces the value of an optional-value boolean flag, declared to commander as
// `--foo [bool]`.
//
// The optional-value form is needed because nx normalizes bare booleans to
// `--foo=true` when forwarding them through the `{args}` placeholder, and
// commander rejects a value on a plain boolean option. Commander resolves the
// bare `--foo` form itself (it doesn't call this parser when no value is
// supplied); this maps the value forms onto booleans:
//   --foo=true, --foo=1   -> true
//   --foo=false, --foo=0  -> false
export function parseBooleanFlag(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized !== "false" && normalized !== "0";
}
