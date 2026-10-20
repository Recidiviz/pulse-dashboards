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

// Pins the JSON atmos feeds to backfill-fn as COLLECTIONS_JSON.
//
// Asserted by RUNNING the script, because the `!exec` tag in the stack files
// consumes its stdout. A constant that looks right but never reaches the
// emitted document would pass an import-based test.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const SCRIPT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../export-collections.ts",
);

type Config = {
  name: string;
  fields: string[];
  mergeSources?: Array<{ sourceCollection: string }>;
};

const collections: Config[] = JSON.parse(
  execFileSync("npx", ["tsx", SCRIPT], { encoding: "utf8" }),
);
const byName = (name: string) => collections.find((c) => c.name === name);

describe("opportunity scope comes from the record", () => {
  test("the scope fields are declared, so the projection keeps them", () => {
    // The projection drops anything undeclared. Without these two the ETL
    // could emit them and nothing would reach the index.
    expect(byName("opportunities")?.fields).toEqual(
      expect.arrayContaining(["officerId", "locationId"]),
    );
  });

  test("no person merge remains on opportunities", () => {
    // A row carries its own scope, so the backfill depends on nothing else
    // having run. A merge here would reintroduce that dependency.
    expect(byName("opportunities")?.mergeSources).toBeUndefined();
  });

  test("the officer-written merge on the person collections stays", () => {
    // `preferredName` comes from `clientUpdatesV2`, which the ETL will never
    // have: it is written by officers, in real time.
    for (const name of ["clients", "residents"]) {
      expect(
        byName(name)?.mergeSources?.map((m) => m.sourceCollection),
      ).toEqual(["clientUpdatesV2"]);
    }
  });

  test("the person reference lowercases `externalId`", () => {
    // A case-sensitive reference dangles, and a dangling join returns an
    // empty page rather than an error. See `export-collections.ts` for why.
    const refs = (
      byName("opportunities") as unknown as {
        referenceFields: Array<{ into: string; lowercaseFields: string[] }>;
      }
    ).referenceFields;

    expect(refs.map((r) => r.into).sort()).toEqual([
      "clientDocId",
      "residentDocId",
    ]);
    for (const ref of refs) {
      expect([ref.into, ref.lowercaseFields.slice().sort()]).toEqual([
        ref.into,
        ["externalId", "stateCode"],
      ]);
    }
  });
});
