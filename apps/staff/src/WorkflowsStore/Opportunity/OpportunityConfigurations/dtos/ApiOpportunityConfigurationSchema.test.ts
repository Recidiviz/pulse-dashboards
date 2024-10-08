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

import { z } from "zod";

import { apiOpportunityConfigurationSchema } from "./ApiOpportunityConfigurationSchema";

describe("eligible criteria copy", () => {
  it("preserves order when input is an object", () => {
    const { eligibleCriteriaCopy } = apiOpportunityConfigurationSchema.shape;
    const input = {
      a: { text: "a text" },
      z: { text: "z text", tooltip: "z tooltip" },
      b: { text: "b text" },
    } satisfies z.input<typeof eligibleCriteriaCopy>;
    const output = eligibleCriteriaCopy.parse(input);
    expect(Object.entries(output)).toEqual([
      ["a", { text: "a text" }],
      ["z", { text: "z text", tooltip: "z tooltip" }],
      ["b", { text: "b text" }],
    ]);
  });

  it("preserves order when input is an array", () => {
    const { eligibleCriteriaCopy } = apiOpportunityConfigurationSchema.shape;
    const input = [
      { key: "a", text: "a text" },
      { key: "z", text: "z text", tooltip: "z tooltip" },
      { key: "b", text: "b text" },
    ] satisfies z.input<typeof eligibleCriteriaCopy>;
    const output = eligibleCriteriaCopy.parse(input);
    expect(Object.entries(output)).toEqual([
      ["a", { text: "a text" }],
      ["z", { text: "z text", tooltip: "z tooltip" }],
      ["b", { text: "b text" }],
    ]);
  });
});

describe("denial reasons", () => {
  it("preserves order when input is an object", () => {
    const { denialReasons } = apiOpportunityConfigurationSchema.shape;
    const input = {
      a: "a text",
      z: "z text",
      b: "b text",
    } satisfies z.input<typeof denialReasons>;
    const output = denialReasons.parse(input);
    expect(Object.entries(output)).toEqual([
      ["a", "a text"],
      ["z", "z text"],
      ["b", "b text"],
    ]);
  });

  it("preserves order when input is an array", () => {
    const { denialReasons } = apiOpportunityConfigurationSchema.shape;
    const input = [
      { key: "a", text: "a text" },
      { key: "z", text: "z text" },
      { key: "b", text: "b text" },
    ] satisfies z.input<typeof denialReasons>;
    const output = denialReasons.parse(input);
    expect(Object.entries(output)).toEqual([
      ["a", "a text"],
      ["z", "z text"],
      ["b", "b text"],
    ]);
  });
});

describe("tab groups", () => {
  it("preserves order when input is an object", () => {
    const { tabGroups } = apiOpportunityConfigurationSchema.shape;
    const input = {
      a: ["aardvark", "antelope"],
      z: ["zebra"],
      b: ["bees", "more bees"],
    } satisfies z.input<typeof tabGroups>;
    const output = tabGroups.parse(input);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Object.entries(output!)).toEqual([
      ["a", ["aardvark", "antelope"]],
      ["z", ["zebra"]],
      ["b", ["bees", "more bees"]],
    ]);
  });

  it("preserves order when input is an array", () => {
    const { tabGroups } = apiOpportunityConfigurationSchema.shape;
    const input = [
      { key: "a", tabs: ["aardvark", "antelope"] },
      { key: "z", tabs: ["zebra"] },
      { key: "b", tabs: ["bees", "more bees"] },
    ] satisfies z.input<typeof tabGroups>;
    const output = tabGroups.parse(input);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Object.entries(output!)).toEqual([
      ["a", ["aardvark", "antelope"]],
      ["z", ["zebra"]],
      ["b", ["bees", "more bees"]],
    ]);
  });
});
