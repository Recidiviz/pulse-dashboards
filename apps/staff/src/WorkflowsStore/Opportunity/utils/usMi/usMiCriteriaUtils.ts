// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

export function usMiSegregationDisplayName(segregationType: string): string {
  switch (segregationType) {
    case "ADMINISTRATIVE_SOLITARY_CONFINEMENT":
      return "administrative segregation";
    case "MENTAL_HEALTH_SOLITARY_CONFINEMENT":
      return "protective custody";
    case "DISCIPLINARY_SOLITARY_CONFINEMENT":
      return "detention";
    case "TEMPORARY_SOLITARY_CONFINEMENT":
      return "temporary segregation";
    default:
      return "segregation (Unknown level)";
  }
}
