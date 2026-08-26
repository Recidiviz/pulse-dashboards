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

import { CaseloadFilterCompiler } from "../CaseloadFilterCompiler";
import type { CaseloadScope, PerSystemScopes } from "../types";

const caseloadFilters = (scopes: PerSystemScopes<CaseloadScope>) =>
  new CaseloadFilterCompiler("US_XX").compile(scopes);
const NEVER_MATCH = "id:=`__no_match__`";

const unrestricted: CaseloadScope = { base: { kind: "unrestricted" } };
const byEmail: CaseloadScope = {
  base: { kind: "byEmail", email: "u@example.com" },
};
const byDistricts: CaseloadScope = {
  base: { kind: "byDistricts", districts: ["DISTRICT 1", "10 - WEST"] },
};
const none: CaseloadScope = { base: { kind: "none" } };
const withExpansion = (scope: CaseloadScope): CaseloadScope => ({
  ...scope,
  expandToSupervisedStaff: { userId: "STAFF1" },
});

describe("CaseloadFilterCompiler — collection selection", () => {
  it("supervision-only scope yields supervisionStaff + locations", () => {
    const filters = caseloadFilters({ supervision: unrestricted });
    expect(Object.keys(filters).sort()).toEqual([
      "locations",
      "supervisionStaff",
    ]);
  });

  it("incarceration-only scope yields incarcerationStaff + locations", () => {
    const filters = caseloadFilters({ incarceration: unrestricted });
    expect(Object.keys(filters).sort()).toEqual([
      "incarcerationStaff",
      "locations",
    ]);
  });

  it("both systems yield all three collections", () => {
    const filters = caseloadFilters({
      supervision: unrestricted,
      incarceration: unrestricted,
    });
    expect(Object.keys(filters).sort()).toEqual([
      "incarcerationStaff",
      "locations",
      "supervisionStaff",
    ]);
  });

  it("no scopes yield no filters", () => {
    expect(caseloadFilters({})).toEqual({});
  });
});

describe("CaseloadFilterCompiler — supervisionStaff", () => {
  const supervisionStaffFilter = (scope: CaseloadScope) =>
    caseloadFilters({ supervision: scope }).supervisionStaff;

  it("unrestricted → state clause only", () => {
    expect(supervisionStaffFilter(unrestricted)).toBe("stateCode:=`US_XX`");
  });

  it("byEmail → email clause", () => {
    expect(supervisionStaffFilter(byEmail)).toBe(
      "stateCode:=`US_XX` && (email:=`u@example.com`)",
    );
  });

  it("byDistricts → district clause, backtick-quoted", () => {
    expect(supervisionStaffFilter(byDistricts)).toBe(
      "stateCode:=`US_XX` && (district:=[`DISTRICT 1`, `10 - WEST`])",
    );
  });

  it("none → never-match", () => {
    expect(supervisionStaffFilter(none)).toBe(
      `stateCode:=\`US_XX\` && (${NEVER_MATCH})`,
    );
  });

  it("supervisor expansion ORs both singular and plural supervisor fields", () => {
    expect(supervisionStaffFilter(withExpansion(byDistricts))).toBe(
      "stateCode:=`US_XX` && (district:=[`DISTRICT 1`, `10 - WEST`] || supervisorExternalId:=`STAFF1` || supervisorExternalIds:=[`STAFF1`])",
    );
  });

  it("none + expansion → the expansion is the whole predicate", () => {
    expect(supervisionStaffFilter(withExpansion(none))).toBe(
      "stateCode:=`US_XX` && (supervisorExternalId:=`STAFF1` || supervisorExternalIds:=[`STAFF1`])",
    );
  });

  it("unrestricted + expansion → expansion dropped as redundant", () => {
    expect(supervisionStaffFilter(withExpansion(unrestricted))).toBe(
      "stateCode:=`US_XX`",
    );
  });

  it("escapes backticks in values", () => {
    expect(
      supervisionStaffFilter({
        base: { kind: "byEmail", email: "we`ird@example.com" },
      }),
    ).toBe("stateCode:=`US_XX` && (email:=`we\\`ird@example.com`)");
  });
});

describe("CaseloadFilterCompiler — incarcerationStaff", () => {
  const incarcerationStaffFilter = (scope: CaseloadScope) =>
    caseloadFilters({ incarceration: scope }).incarcerationStaff;

  it("unrestricted → state clause only", () => {
    expect(incarcerationStaffFilter(unrestricted)).toBe("stateCode:=`US_XX`");
  });

  it("byEmail → email clause, since incarceration staff carry emails", () => {
    expect(incarcerationStaffFilter(byEmail)).toBe(
      "stateCode:=`US_XX` && (email:=`u@example.com`)",
    );
  });

  // Supervisor relationships are supervision-side only — staff-server alerts on
  // an incarcerationStaff supervisor match as an invariant violation. The
  // expansion is dropped rather than compiled against data that must not exist.
  it("drops the supervisor expansion", () => {
    expect(incarcerationStaffFilter(withExpansion(byDistricts))).toBe(
      "stateCode:=`US_XX` && (district:=[`DISTRICT 1`, `10 - WEST`])",
    );
  });

  it("none + expansion → never-match, because nothing is left to match on", () => {
    expect(incarcerationStaffFilter(withExpansion(none))).toBe(
      `stateCode:=\`US_XX\` && (${NEVER_MATCH})`,
    );
  });
});

describe("CaseloadFilterCompiler — locations", () => {
  const locationsFilter = (scopes: {
    supervision?: CaseloadScope;
    incarceration?: CaseloadScope;
  }) => caseloadFilters(scopes).locations;

  it("matches districts on locationId, not on a district attribute", () => {
    expect(locationsFilter({ supervision: byDistricts })).toBe(
      "stateCode:=`US_XX` && (system:=`SUPERVISION` && (locationId:=[`DISTRICT 1`, `10 - WEST`]))",
    );
  });

  it("unrestricted → system discriminator only", () => {
    expect(locationsFilter({ supervision: unrestricted })).toBe(
      "stateCode:=`US_XX` && system:=`SUPERVISION`",
    );
  });

  // A byEmail scope is by definition the no-district case, so there is no
  // district to project onto a location. Fail closed rather than widen.
  it("byEmail → never-match, since a location has no email to match", () => {
    expect(locationsFilter({ supervision: byEmail })).toBe(
      `stateCode:=\`US_XX\` && (system:=\`SUPERVISION\` && (${NEVER_MATCH}))`,
    );
  });

  it("drops the supervisor expansion but keeps the district base", () => {
    expect(locationsFilter({ supervision: withExpansion(byDistricts) })).toBe(
      "stateCode:=`US_XX` && (system:=`SUPERVISION` && (locationId:=[`DISTRICT 1`, `10 - WEST`]))",
    );
  });

  it("applies each system's own rules under one key", () => {
    expect(
      locationsFilter({
        supervision: byDistricts,
        incarceration: unrestricted,
      }),
    ).toBe(
      "stateCode:=`US_XX` && ((system:=`SUPERVISION` && (locationId:=[`DISTRICT 1`, `10 - WEST`])) || system:=`INCARCERATION`)",
    );
  });

  it("keeps the system discriminator even for a single system", () => {
    // The per-search `idType` filter also separates districts from facilities,
    // but that lives in a client-supplied descriptor, so the key must not rely
    // on it to bound scope.
    expect(locationsFilter({ incarceration: unrestricted })).toBe(
      "stateCode:=`US_XX` && system:=`INCARCERATION`",
    );
  });
});
