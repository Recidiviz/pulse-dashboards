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

import { upperFirst } from "lodash-es";

import { ProgramFromSheet } from "./schema";
import type { ProcessedProgram } from "./types";

/** Means "offered everywhere" rather than naming a facility. */
const ALL_FACILITIES = "All facilities";

/** How a blank cell shows up in the eligibility requirements or prerequisites column. */
const BLANK_CELL = ["None", ""];

const isBlank = (value: string | undefined) =>
  value === undefined || BLANK_CELL.includes(value);

/**
 * Requirements are separated by semicolons. Some Arkansas rows also spell out
 * "and" before the last one, which is the only English word this parser still
 * depends on; that can go away once AR's sheet standardizes on ";".
 */
const REQUIREMENT_SEPARATOR = /\s*;\s*(?:and\s*)?/;

/**
 * Converts a validated sheet row into the shape we serve to clients, separating
 * the strings that were doing double duty as both display copy and as values the
 * client compares against English literals.
 */
export function processProgram(row: ProgramFromSheet): ProcessedProgram {
  const availableAtAllFacilities =
    row.facilitiesOffered.includes(ALL_FACILITIES);

  return {
    ...row,
    category: { key: row.category, label: row.category },
    facilitiesOffered: availableAtAllFacilities
      ? []
      : row.facilitiesOffered.map((facility) => ({
          key: facility,
          label: facility,
        })),
    availableAtAllFacilities,
    eligibilityRequirements: isBlank(row.eligibilityRequirements)
      ? []
      : row.eligibilityRequirements
          .split(REQUIREMENT_SEPARATOR)
          .filter(Boolean)
          .map(upperFirst),
    prerequisites: isBlank(row.prerequisites) ? undefined : row.prerequisites,
  };
}
