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

import { differenceInYears, format } from "date-fns";

import { UsMoClientMetadata } from "~datatypes";

/** Subset of `ClientRecord.currentPhysicalResidenceAddressStructured` used to
 * render the Housing section. Mirrors the schema's partial shape (all fields
 * optional). */
export type StructuredAddress = {
  addressLine1?: string;
  addressLine2?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
};

/**
 * Returns the client's age in whole years today. Uses `differenceInYears`,
 * which already handles the birthday-not-yet-reached and leap-year cases
 * correctly. The `Date` is produced upstream by `dateStringSchemaWithoutTimeShift`
 * in `usMoClientMetadataSchema`, which interprets the ISO date in the local
 * timezone — matching what an officer would expect to see for "today" in
 * their region.
 */
export function calculateAge(birthdate: Date): number {
  return differenceInYears(new Date(), birthdate);
}

/**
 * Format a date of birth alongside the client's current age.
 *
 * e.g. "03/14/1988 (38 years old)"
 */
export function formatDob(birthdate: Date): string {
  return `${format(birthdate, "MM/dd/yyyy")} (${calculateAge(birthdate)} years old)`;
}

/**
 * One-line format per Figma 7364-3879:
 *   "{description} (Class {sub}[ {type}]) - RSMo {statute}"
 * `classificationType` is conditionally included when present.
 *
 * e.g. "Possession of Controlled Substance (Class D Felony) - RSMo 579.015"
 * e.g. "Unlawful Possession of a Firearm (Class C) - RSMo 571.070"
 */
export function formatSentence(
  sentence: UsMoClientMetadata["latestCycleSentences"][number],
): string {
  const klass = sentence.classificationType
    ? `Class ${sentence.classificationSubtype} ${sentence.classificationType}`
    : `Class ${sentence.classificationSubtype}`;
  return `${sentence.description} (${klass}) - RSMo ${sentence.statute}`;
}

/**
 * Build the Housing > Address lines per Figma node 7432-2685:
 *   Line 1: addressLine1
 *   Line 2: addressLine2 (if present)
 *   Line 3: "{city}, {state} {zip}" — components omitted if missing
 * Returns an empty array if no parts are present.
 *
 * e.g. ["100 Main St.", "Apt 4B", "St. Louis, MO 63104"]
 */
export function buildAddressLines(address?: StructuredAddress): string[] {
  if (!address) return [];

  const lines: string[] = [];
  if (address.addressLine1) lines.push(address.addressLine1);
  if (address.addressLine2) lines.push(address.addressLine2);

  const cityStateZip = [
    address.addressCity,
    [address.addressState, address.addressZip].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  if (cityStateZip) lines.push(cityStateZip);

  return lines;
}
