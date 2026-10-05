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

// Every opportunity type is accounted for, by walking the PROTOTYPE CHAIN.
//
// The guard in tabTitleForBucket.test.ts scans source FILES, which misses two
// things this catches: a class declaring `override tabTitle(...)` (one does),
// and a type whose override is inherited from a family base the file scan
// never links back to a type. This audit starts from the type registry
// instead, so a new opportunity cannot be added without landing in one of
// three buckets.

import { readFileSync } from "fs";
import { describe, expect, test, vi } from "vitest";

import { OpportunityBase } from "../../Opportunity/OpportunityBase";
import { opportunityConstructors } from "../../Opportunity/opportunityConstructors";
import { BUCKET_KEY_INSUFFICIENT } from "../tabTitleForBucket";

vi.mock("@sentry/react", () => ({ captureException: vi.fn() }));

/** The class that actually owns `tabTitle`, anywhere up the chain. */
function tabTitleOwner(Klass: unknown): string | null {
  let proto = (Klass as { prototype?: object })?.prototype;
  while (proto && proto !== Object.prototype) {
    if (Object.prototype.hasOwnProperty.call(proto, "tabTitle")) {
      return (
        (proto as { constructor?: { name?: string } }).constructor?.name ?? "?"
      );
    }
    proto = Object.getPrototypeOf(proto);
  }
  return null;
}

/** The types the parity test compares against a real fixture. */
const PARITY_COVERED = new Set(
  (
    readFileSync(`${__dirname}/tabTitleForBucket.test.ts`, "utf8").match(
      /\[\s*"(\w+)",\s*\w+Fixtures,?\s*\]/g,
    ) ?? []
  ).map((entry) => entry.match(/"(\w+)"/)?.[1]),
);

/**
 * Overrides believed correct but NOT provable offline, because their records
 * reference people who do not exist — the US_AZ fixture gap. Both read only
 * eligibility, which the bucket key carries.
 */
const UNPROVABLE_NO_FIXTURES = [
  "usAzTransferToAdministrativeSupervision",
  "usAzTransferToAdministrativeSupervisionV2",
];

describe("tab count coverage", () => {
  const baseOwner = tabTitleOwner(OpportunityBase);

  const overriding = Object.entries(opportunityConstructors).filter(
    ([, Klass]) => tabTitleOwner(Klass) !== baseOwner,
  );

  test("every overriding type is verified, excluded, or documented", () => {
    // A new opportunity type whose class overrides `tabTitle` gets the BASE
    // tab for its whole untouched count otherwise — a wrong number rather than
    // a missing one, which nothing else would catch.
    const unaccounted = overriding
      .map(([type]) => type)
      .filter(
        (type) =>
          !PARITY_COVERED.has(type) &&
          !BUCKET_KEY_INSUFFICIENT.has(type) &&
          !UNPROVABLE_NO_FIXTURES.includes(type),
      );

    expect(unaccounted).toEqual([]);
  });

  test("a type with no override needs nothing — it uses the base", () => {
    // Stated so the count is visible: most types are in this group, and they
    // are correct because `tabTitleForBucket` runs the same base method.
    const baseOnly = Object.entries(opportunityConstructors).filter(
      ([, Klass]) => tabTitleOwner(Klass) === baseOwner,
    );

    expect(baseOnly.length).toBeGreaterThan(overriding.length);
  });

  test("nothing is excluded without also being an override", () => {
    // An exclusion on a base-only type would silently drop counts that the
    // base method could have produced perfectly well.
    const overridingTypes = new Set(overriding.map(([type]) => type));
    const excludedButNotOverriding = [...BUCKET_KEY_INSUFFICIENT].filter(
      (type) => !overridingTypes.has(type),
    );

    expect(excludedButNotOverriding).toEqual([]);
  });
});
