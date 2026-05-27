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

import {
  compileUserScopePredicate,
  toCrossSystemTypesenseFilter,
  toTypesenseFilter,
} from "./compileToTypesense";
import type { StaffScope } from "./types";

describe("compileUserScopePredicate", () => {
  it("unrestricted base → null", () => {
    expect(
      compileUserScopePredicate({ base: { kind: "unrestricted" } }),
    ).toBeNull();
  });

  it("byEmail base", () => {
    expect(
      compileUserScopePredicate({
        base: { kind: "byEmail", email: "u@example.com" },
      }),
    ).toBe("email:=`u@example.com`");
  });

  it("byDistricts single value", () => {
    expect(
      compileUserScopePredicate({
        base: { kind: "byDistricts", districts: ["Region 1"] },
      }),
    ).toBe("district:=[`Region 1`]");
  });

  it("byDistricts multiple values (US_MI district 10 expansion)", () => {
    expect(
      compileUserScopePredicate({
        base: {
          kind: "byDistricts",
          districts: ["10 - WEST", "10 - CENTRAL"],
        },
      }),
    ).toBe("district:=[`10 - WEST`, `10 - CENTRAL`]");
  });

  it("base + supervisor expansion → ORed", () => {
    const result = compileUserScopePredicate({
      base: { kind: "byDistricts", districts: ["Region 1"] },
      expandToSupervisedStaff: { userId: "user-7" },
    });
    expect(result).toBe(
      "(district:=[`Region 1`]) || supervisorExternalId:=`user-7` || supervisorExternalIds:=[`user-7`]",
    );
  });

  it("byEmail + supervisor expansion → ORed", () => {
    const result = compileUserScopePredicate({
      base: { kind: "byEmail", email: "u@example.com" },
      expandToSupervisedStaff: { userId: "user-7" },
    });
    expect(result).toBe(
      "(email:=`u@example.com`) || supervisorExternalId:=`user-7` || supervisorExternalIds:=[`user-7`]",
    );
  });

  // Note: `unrestricted` base + `expandToSupervisedStaff` is not a combination
  // resolveStaffScope can produce — the resolver skips the expansion when the
  // base is unrestricted (mirrors production's "supervisor-OR only fires when
  // staffFilter is defined" rule). Compiler behavior for that combination is
  // therefore not tested.

  it("none base alone → impossible-match sentinel", () => {
    expect(compileUserScopePredicate({ base: { kind: "none" } })).toBe(
      "id:=`__no_match__`",
    );
  });

  it("none base + supervisor expansion → just the supervisor clause (no email/district fallback)", () => {
    const result = compileUserScopePredicate({
      base: { kind: "none" },
      expandToSupervisedStaff: { userId: "user-7" },
    });
    expect(result).toBe(
      "supervisorExternalId:=`user-7` || supervisorExternalIds:=[`user-7`]",
    );
  });
});

describe("toTypesenseFilter (single system)", () => {
  const unrestrictedScope: StaffScope = { base: { kind: "unrestricted" } };
  const districtScope: StaffScope = {
    base: { kind: "byDistricts", districts: ["Region 1"] },
  };

  it("unrestricted scope → stateCode only", () => {
    expect(toTypesenseFilter(unrestrictedScope, { stateCode: "US_TN" })).toBe(
      "stateCode:=`US_TN`",
    );
  });

  it("district scope → stateCode AND district clause", () => {
    expect(toTypesenseFilter(districtScope, { stateCode: "US_TN" })).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`])",
    );
  });

  it("with optional system discriminator (for Phase 2 unified opportunities)", () => {
    expect(
      toTypesenseFilter(districtScope, {
        stateCode: "US_TN",
        system: "SUPERVISION",
      }),
    ).toBe(
      "stateCode:=`US_TN` && system:=`SUPERVISION` && (district:=[`Region 1`])",
    );
  });

  it("with supervisor expansion", () => {
    const scope: StaffScope = {
      base: { kind: "byDistricts", districts: ["Region 1"] },
      expandToSupervisedStaff: { userId: "user-7" },
    };
    expect(toTypesenseFilter(scope, { stateCode: "US_TN" })).toBe(
      "stateCode:=`US_TN` && ((district:=[`Region 1`]) || supervisorExternalId:=`user-7` || supervisorExternalIds:=[`user-7`])",
    );
  });
});

describe("toCrossSystemTypesenseFilter", () => {
  const districtScope: StaffScope = {
    base: { kind: "byDistricts", districts: ["Region 1"] },
  };
  const unrestrictedScope: StaffScope = { base: { kind: "unrestricted" } };

  it("supervision only → single-system clause", () => {
    expect(
      toCrossSystemTypesenseFilter({ supervision: districtScope }, "US_TN"),
    ).toBe(
      "stateCode:=`US_TN` && (system:=`SUPERVISION` && (district:=[`Region 1`]))",
    );
  });

  it("incarceration only, unrestricted → system filter only", () => {
    expect(
      toCrossSystemTypesenseFilter(
        { incarceration: unrestrictedScope },
        "US_MI",
      ),
    ).toBe("stateCode:=`US_MI` && system:=`INCARCERATION`");
  });

  it("both systems with different scopes", () => {
    expect(
      toCrossSystemTypesenseFilter(
        {
          supervision: districtScope,
          incarceration: unrestrictedScope,
        },
        "US_MI",
      ),
    ).toBe(
      "stateCode:=`US_MI` && ((system:=`SUPERVISION` && (district:=[`Region 1`])) || system:=`INCARCERATION`)",
    );
  });

  it("neither system → stateCode only (defense-in-depth fallback)", () => {
    expect(toCrossSystemTypesenseFilter({}, "US_TN")).toBe(
      "stateCode:=`US_TN`",
    );
  });
});
