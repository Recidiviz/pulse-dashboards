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
 * Facility names that are actually names. Used below to fall back to English if there
 * are no translated facility names.
 */
const namedFacilities = (row: ProgramFromSheet) =>
  row.facilitiesOffered.filter(Boolean);

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
export function processProgram(
  enRow: ProgramFromSheet,
  /** Defaults to `enRow`: with no translation, a row is its own translation. */
  locRow: ProgramFromSheet = enRow,
): ProcessedProgram {
  const availableAtAllFacilities =
    enRow.facilitiesOffered.includes(ALL_FACILITIES);

  const localizedFacilities = namedFacilities(locRow);
  const facilitiesOffered = localizedFacilities.length
    ? localizedFacilities
    : namedFacilities(enRow);

  // A blank cell arrives as "" rather than undefined, so `||` is deliberate
  // below; `??` would treat an empty translated cell as real copy.
  return {
    ...enRow,
    title: locRow.title || enRow.title,
    description: locRow.description || enRow.description,
    abbreviatedDescription:
      locRow.abbreviatedDescription || enRow.abbreviatedDescription,
    category: locRow.category || enRow.category,
    facilitiesOffered: availableAtAllFacilities ? [] : facilitiesOffered,
    availableAtAllFacilities,
    eligibilityRequirements: isBlank(enRow.eligibilityRequirements)
      ? []
      : (locRow.eligibilityRequirements || enRow.eligibilityRequirements)
          .split(REQUIREMENT_SEPARATOR)
          .filter(Boolean)
          .map(upperFirst),
    prerequisites: isBlank(enRow.prerequisites)
      ? undefined
      : enRow.prerequisites,
  };
}
