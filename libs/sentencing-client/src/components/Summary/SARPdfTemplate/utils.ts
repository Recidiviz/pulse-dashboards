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

export const NA = "—";

export const valueOrDash = (x: unknown): string =>
  x === null || x === undefined || x === "" ? NA : String(x);

// Tri-state boolean → human label. Null/undefined renders as em-dash.
export const yesNoOrDash = (b: boolean | null | undefined): string => {
  if (b == null) return NA;
  return b ? "Yes" : "No";
};
