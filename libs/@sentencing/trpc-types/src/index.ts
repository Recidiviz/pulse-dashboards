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

// intended use of TRPC to share from server to client
// eslint-disable-next-line @nx/enforce-module-boundaries
export type { AppRouter } from "~@sentencing/trpc";

const CLASSIFICATION_TYPE_ORDER: Record<string, number> = {
  FELONY: 0,
  MISDEMEANOR: 1,
  INFRACTION: 2,
};

// Severity ordering for charge classification subtype: A > B > C > D > E > U > null
const CLASSIFICATION_SUBTYPE_ORDER: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  U: 5,
};

export type MostSevereCharge = {
  offenseName: string;
  // e.g. "Felony A", "Misdemeanor", null if unclassified
  offenseClass: string | null;
};

// Returns the severity rank of a charge as a tuple for comparison.
// Lower values are more severe. Returns [Infinity, Infinity] for unclassified charges.
export function getChargeSeverityRank(charge: {
  classificationType: string | null | undefined;
  classificationSubtype: string | null | undefined;
}): [number, number] {
  const type =
    charge.classificationType != null
      ? CLASSIFICATION_TYPE_ORDER[charge.classificationType] ?? Infinity
      : Infinity;
  const subtype =
    charge.classificationSubtype != null
      ? CLASSIFICATION_SUBTYPE_ORDER[charge.classificationSubtype] ?? Infinity
      : Infinity;
  return [type, subtype];
}

// Compares two severity ranks: returns negative if a is more severe, positive if b is more severe, 0 if equal.
export function compareSeverityRanks(
  a: [number, number],
  b: [number, number],
): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return 0;
}

// e.g. ("FELONY", "A") → "Felony A", ("MISDEMEANOR", null) → "Misdemeanor"
function formatOffenseClass(
  type: string | null | undefined,
  subtype: string | null | undefined,
): string | null {
  if (!type) return null;
  const formattedType = type.charAt(0) + type.slice(1).toLowerCase();
  return subtype ? `${formattedType} ${subtype}` : formattedType;
}

// Returns the most severe charge(s) from a list. If there is a clear winner,
// returns a single-element array. If multiple charges share the top severity
// rank (a tie), returns all of them. Returns [] if the input is empty.
export function getMostSevereCharges(
  charges: {
    offense: string;
    classificationType: string | null | undefined;
    classificationSubtype: string | null | undefined;
  }[],
): MostSevereCharge[] {
  if (charges.length === 0) return [];

  const ranks = charges.map(getChargeSeverityRank);
  let topRank = ranks[0];
  for (let i = 1; i < ranks.length; i++) {
    if (compareSeverityRanks(ranks[i], topRank) < 0) topRank = ranks[i];
  }

  return charges
    .filter((_, i) => compareSeverityRanks(ranks[i], topRank) === 0)
    .map((c) => ({
      offenseName: c.offense,
      offenseClass: formatOffenseClass(
        c.classificationType,
        c.classificationSubtype,
      ),
    }));
}
