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

// Pins the JSON that atmos feeds to backfill-fn as COLLECTIONS_JSON.
//
// Asserted by RUNNING the script rather than importing its internals, because
// the `!exec` tag in the stack files consumes stdout. A constant that looks
// right but never reaches the emitted document would pass an import-based test.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { composeDocIdFromFields } from "../docIds";

const SCRIPT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../export-collections.ts",
);

type Config = {
  name: string;
  docIdOverrides?: { lowercaseFields?: string[] };
  referenceFields?: Array<{ into: string; lowercaseFields?: string[] }>;
  mergeSources?: Array<{
    sourceCollection: string;
    lookupKey?: { fields: string[]; lowercaseFields?: string[] };
  }>;
};

const collections: Config[] = JSON.parse(
  execFileSync("npx", ["tsx", SCRIPT], { encoding: "utf8" }),
);
const opportunities = collections.find((c) => c.name === "opportunities");

describe("how an opportunity names its person", () => {
  test("every person key lowercases `externalId`", () => {
    // The ETL lowercases the whole Firestore document id, so a PA client with
    // `externalId: "001HG"` is filed under `us_pa_001hg`. A key that preserved
    // the case matched nothing, and the state lost every opportunity: the scope
    // merge copied no `locationId`, and `clientDocId` dangled, so the join the
    // homepage runs returned an empty set.
    const keys = [
      ...(opportunities?.referenceFields ?? []).map((r) => ({
        what: r.into,
        lowercaseFields: r.lowercaseFields,
      })),
      ...(opportunities?.mergeSources ?? [])
        .filter((m) => m.lookupKey)
        .map((m) => ({
          what: `${m.sourceCollection} lookupKey`,
          lowercaseFields: m.lookupKey?.lowercaseFields,
        })),
    ];

    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect([key.what, key.lowercaseFields]).toEqual([
        key.what,
        expect.arrayContaining(["stateCode", "externalId"]),
      ]);
    }
  });

  test("an alphanumeric external id composes the id Firestore files it under", () => {
    // The assertion the config exists to satisfy, stated absolutely rather
    // than against another derivation of the same rule.
    const ref = opportunities?.referenceFields?.[0];
    expect(
      composeDocIdFromFields(
        { stateCode: "US_PA", externalId: "001HG" },
        ["stateCode", "externalId"],
        ref?.lowercaseFields,
      ),
    ).toBe("us_pa_001hg");
  });

  test("the opportunity's own id is left alone", () => {
    // Adding `externalId` here would rewrite every opportunity document id and
    // make the next prune sweep the old ones. This id refers to nothing else,
    // so it needs no agreement with Firestore.
    expect(opportunities?.docIdOverrides?.lowercaseFields).toEqual([
      "stateCode",
    ]);
  });
});
