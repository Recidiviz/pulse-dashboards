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

import Fuse from "fuse.js";

import { UsMaTFunction } from "~@jii/translation";

import { loadUsMaTranslations, makeResource } from "../../__tests__/testUtils";
import { matchesTagLabel, SEARCH_OPTIONS, searchResources } from "../utils";

let t: UsMaTFunction;

beforeAll(async () => {
  t = await loadUsMaTranslations();
});

describe("searchResources", () => {
  const resources = [
    makeResource(1, {
      name: "Vanderburgh House",
      description: "Sober living for men in recovery",
    }),
    makeResource(2, {
      name: "Homeless not Hopeless Shelter",
      description: "Transitional housing with case management",
    }),
    makeResource(3, {
      name: "Cape Cod Residence",
      description: "Long term residential program with housing support",
    }),
  ];
  const fuseIndex = new Fuse(resources, SEARCH_OPTIONS);

  test("returns an empty array for a blank query", () => {
    expect(searchResources(resources, "   ", fuseIndex, t)).toEqual([]);
  });

  test("short queries match by substring, ranking name matches first", () => {
    // "ho" is in the first two names and only in Cape Cod Residence's
    // description ("...housing support").
    const results = searchResources(resources, "ho", fuseIndex, t);

    expect(results.map((r) => r.organizationId)).toEqual([1, 2, 3]);
  });

  test("matches by name, tolerating a typo", () => {
    const results = searchResources(resources, "Vandrburgh", fuseIndex, t);

    expect(results.map((r) => r.organizationId)).toEqual([1]);
  });

  test("matches by description when the name doesn't match", () => {
    const results = searchResources(resources, "recovery", fuseIndex, t);

    expect(results.map((r) => r.organizationId)).toEqual([1]);
  });

  test("lists tag-only matches after name matches, without duplicates", () => {
    const tagged = [
      makeResource(1, { name: "Female Recovery House", tags: ["Female"] }),
      makeResource(2, { name: "Vanderburgh House", tags: ["Female"] }),
      makeResource(3, { name: "Cape Cod Residence", tags: ["Male"] }),
    ];
    const results = searchResources(
      tagged,
      "female",
      new Fuse(tagged, SEARCH_OPTIONS),
      t,
    );

    expect(results.map((r) => r.organizationId)).toEqual([1, 2]);
  });
});

describe("matchesTagLabel", () => {
  test("matches only from the start of a word", () => {
    expect(matchesTagLabel(["Female"], "female")).toBe(true);
    expect(matchesTagLabel(["Female"], "male")).toBe(false);
    expect(matchesTagLabel(["Sex Offenders Accepted"], "sex off")).toBe(true);
  });

  test("ignores hyphens, so coed matches Co-ed", () => {
    expect(matchesTagLabel(["Co-ed"], "coed")).toBe(true);
    expect(matchesTagLabel(["Co-ed"], "---")).toBe(false);
  });
});
