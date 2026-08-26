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

import { describe, expect, it } from "vitest";

import { PersonFilterCompiler } from "../PersonFilterCompiler";
import type { PersonScope, PerSystemScopes } from "../types";

const personFilters = (scopes: PerSystemScopes<PersonScope>) =>
  new PersonFilterCompiler("US_XX").compile(scopes);
const NEVER_MATCH = "id:=`__no_match__`";

describe("PersonFilterCompiler", () => {
  const unrestrictedPerson: PersonScope = {
    grants: [{ kind: "unrestricted" }],
  };
  const districtGrant: PersonScope = {
    grants: [{ kind: "byField", field: "district", ids: ["DISTRICT 1"] }],
  };
  const officerGrant: PersonScope = {
    grants: [{ kind: "byField", field: "officerId", ids: ["STAFF1"] }],
  };

  it("selects collections from the systems supplied", () => {
    expect(
      Object.keys(
        personFilters({
          supervision: unrestrictedPerson,
          incarceration: officerGrant,
        }),
      ).sort(),
    ).toEqual(["clients", "residents"]);
  });

  it("clients accept both district and officerId grants", () => {
    expect(
      personFilters({
        supervision: {
          grants: [...districtGrant.grants, ...officerGrant.grants],
        },
      }).clients,
    ).toBe(
      "stateCode:=`US_XX` && (district:=[`DISTRICT 1`] || officerId:=[`STAFF1`])",
    );
  });

  it("unrestricted → state clause only", () => {
    expect(personFilters({ supervision: unrestrictedPerson }).clients).toBe(
      "stateCode:=`US_XX`",
    );
  });

  it("an empty grant list → never-match", () => {
    expect(personFilters({ supervision: { grants: [] } }).clients).toBe(
      `stateCode:=\`US_XX\` && (${NEVER_MATCH})`,
    );
  });

  it("a grant with no ids → never-match", () => {
    expect(
      personFilters({
        supervision: {
          grants: [{ kind: "byField", field: "officerId", ids: [] }],
        },
      }).clients,
    ).toBe(`stateCode:=\`US_XX\` && (${NEVER_MATCH})`);
  });

  it("residents accept officerId grants", () => {
    expect(personFilters({ incarceration: officerGrant }).residents).toBe(
      "stateCode:=`US_XX` && (officerId:=[`STAFF1`])",
    );
  });

  // Residents carry no `district`. No state's INCARCERATION baseline is
  // district-scoped today, so this is a guard against a future one silently
  // widening rather than narrowing.
  it("residents drop a district grant and fail closed", () => {
    expect(personFilters({ incarceration: districtGrant }).residents).toBe(
      `stateCode:=\`US_XX\` && (${NEVER_MATCH})`,
    );
  });

  it("residents keep the officerId grant when a district grant is dropped", () => {
    expect(
      personFilters({
        incarceration: {
          grants: [...districtGrant.grants, ...officerGrant.grants],
        },
      }).residents,
    ).toBe("stateCode:=`US_XX` && (officerId:=[`STAFF1`])");
  });
});
