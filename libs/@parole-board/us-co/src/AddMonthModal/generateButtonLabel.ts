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

/**
 * Returns the Add a month dialog's primary button text for the selected
 * months' names: "Generate month" for none, "Generate October" for one and
 * "Generate 3 months" for more, as the design words it.
 */
export function generateButtonLabel(selectedLabels: string[]): string {
  if (selectedLabels.length === 0) return "Generate month";
  if (selectedLabels.length === 1) return `Generate ${selectedLabels[0]}`;
  return `Generate ${selectedLabels.length} months`;
}
