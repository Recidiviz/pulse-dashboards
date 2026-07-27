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
  compileCaseloadScopePredicate,
  compilePersonScopePredicate,
  toCaseloadTypesenseFilter,
  toCrossSystemCaseloadTypesenseFilter,
  toCrossSystemPersonTypesenseFilter,
  toPersonTypesenseFilter,
} from "../compileToTypesense";
import type { CaseloadScope, PersonScope } from "../types";

describe("compileCaseloadScopePredicate", () => {
  it("unrestricted base → null", () => {
    expect(
      compileCaseloadScopePredicate({ base: { kind: "unrestricted" } }),
    ).toBeNull();
  });

  it("byEmail base", () => {
    expect(
      compileCaseloadScopePredicate({
        base: { kind: "byEmail", email: "u@example.com" },
      }),
    ).toBe("email:=`u@example.com`");
  });

  it("byDistricts single value", () => {
    expect(
      compileCaseloadScopePredicate({
        base: { kind: "byDistricts", districts: ["Region 1"] },
      }),
    ).toBe("district:=[`Region 1`]");
  });

  it("byDistricts multiple values (US_MI district 10 expansion)", () => {
    expect(
      compileCaseloadScopePredicate({
        base: {
          kind: "byDistricts",
          districts: ["10 - WEST", "10 - CENTRAL"],
        },
      }),
    ).toBe("district:=[`10 - WEST`, `10 - CENTRAL`]");
  });

  it("base + supervisor expansion → ORed", () => {
    const result = compileCaseloadScopePredicate({
      base: { kind: "byDistricts", districts: ["Region 1"] },
      expandToSupervisedStaff: { userId: "user-7" },
    });
    expect(result).toBe(
      "(district:=[`Region 1`]) || supervisorExternalId:=`user-7` || supervisorExternalIds:=[`user-7`]",
    );
  });

  it("byEmail + supervisor expansion → ORed", () => {
    const result = compileCaseloadScopePredicate({
      base: { kind: "byEmail", email: "u@example.com" },
      expandToSupervisedStaff: { userId: "user-7" },
    });
    expect(result).toBe(
      "(email:=`u@example.com`) || supervisorExternalId:=`user-7` || supervisorExternalIds:=[`user-7`]",
    );
  });

  // Note: resolveCaseloadScope won't produce `unrestricted` base + expansion
  // (it skips the expansion in that case), but compileCaseloadScopePredicate is a
  // public function that any caller could invoke with that combination, so we
  // verify the defensive branch.
  it("unrestricted base + supervisor expansion → null (defensive; resolver doesn't produce this)", () => {
    expect(
      compileCaseloadScopePredicate({
        base: { kind: "unrestricted" },
        expandToSupervisedStaff: { userId: "user-7" },
      }),
    ).toBeNull();
  });

  it("none base alone → impossible-match sentinel", () => {
    expect(compileCaseloadScopePredicate({ base: { kind: "none" } })).toBe(
      "id:=`__no_match__`",
    );
  });

  it("none base + supervisor expansion → just the supervisor clause (no email/district fallback)", () => {
    const result = compileCaseloadScopePredicate({
      base: { kind: "none" },
      expandToSupervisedStaff: { userId: "user-7" },
    });
    expect(result).toBe(
      "supervisorExternalId:=`user-7` || supervisorExternalIds:=[`user-7`]",
    );
  });
});

describe("toCaseloadTypesenseFilter (single system)", () => {
  const unrestrictedScope: CaseloadScope = { base: { kind: "unrestricted" } };
  const districtScope: CaseloadScope = {
    base: { kind: "byDistricts", districts: ["Region 1"] },
  };

  it("unrestricted scope → stateCode only", () => {
    expect(
      toCaseloadTypesenseFilter(unrestrictedScope, { stateCode: "US_TN" }),
    ).toBe("stateCode:=`US_TN`");
  });

  it("district scope → stateCode AND district clause", () => {
    expect(
      toCaseloadTypesenseFilter(districtScope, { stateCode: "US_TN" }),
    ).toBe("stateCode:=`US_TN` && (district:=[`Region 1`])");
  });

  it("with optional system discriminator (for Phase 2 unified opportunities)", () => {
    expect(
      toCaseloadTypesenseFilter(districtScope, {
        stateCode: "US_TN",
        system: "SUPERVISION",
      }),
    ).toBe(
      "stateCode:=`US_TN` && system:=`SUPERVISION` && (district:=[`Region 1`])",
    );
  });

  it("with supervisor expansion", () => {
    const scope: CaseloadScope = {
      base: { kind: "byDistricts", districts: ["Region 1"] },
      expandToSupervisedStaff: { userId: "user-7" },
    };
    expect(toCaseloadTypesenseFilter(scope, { stateCode: "US_TN" })).toBe(
      "stateCode:=`US_TN` && ((district:=[`Region 1`]) || supervisorExternalId:=`user-7` || supervisorExternalIds:=[`user-7`])",
    );
  });
});

describe("toCrossSystemCaseloadTypesenseFilter", () => {
  const districtScope: CaseloadScope = {
    base: { kind: "byDistricts", districts: ["Region 1"] },
  };
  const unrestrictedScope: CaseloadScope = { base: { kind: "unrestricted" } };

  it("supervision only → single-system clause", () => {
    expect(
      toCrossSystemCaseloadTypesenseFilter(
        { supervision: districtScope },
        "US_TN",
      ),
    ).toBe(
      "stateCode:=`US_TN` && (system:=`SUPERVISION` && (district:=[`Region 1`]))",
    );
  });

  it("incarceration only, unrestricted → system filter only", () => {
    expect(
      toCrossSystemCaseloadTypesenseFilter(
        { incarceration: unrestrictedScope },
        "US_MI",
      ),
    ).toBe("stateCode:=`US_MI` && system:=`INCARCERATION`");
  });

  it("both systems with different scopes", () => {
    expect(
      toCrossSystemCaseloadTypesenseFilter(
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
    expect(toCrossSystemCaseloadTypesenseFilter({}, "US_TN")).toBe(
      "stateCode:=`US_TN`",
    );
  });
});

describe("compilePersonScopePredicate", () => {
  it("unrestricted grant → null", () => {
    expect(
      compilePersonScopePredicate({ grants: [{ kind: "unrestricted" }] }),
    ).toBeNull();
  });

  it("single byField grant", () => {
    expect(
      compilePersonScopePredicate({
        grants: [{ kind: "byField", field: "district", ids: ["Region 1"] }],
      }),
    ).toBe("district:=[`Region 1`]");
  });

  it("byField grant with multiple ids", () => {
    expect(
      compilePersonScopePredicate({
        grants: [
          {
            kind: "byField",
            field: "officerId",
            ids: ["staff-1", "staff-2"],
          },
        ],
      }),
    ).toBe("officerId:=[`staff-1`, `staff-2`]");
  });

  it("multiple byField grants → ORed", () => {
    expect(
      compilePersonScopePredicate({
        grants: [
          { kind: "byField", field: "district", ids: ["Region 1"] },
          { kind: "byField", field: "officerId", ids: ["staff-1"] },
        ],
      }),
    ).toBe("district:=[`Region 1`] || officerId:=[`staff-1`]");
  });

  it("empty-id grant is skipped", () => {
    expect(
      compilePersonScopePredicate({
        grants: [
          { kind: "byField", field: "district", ids: ["Region 1"] },
          { kind: "byField", field: "officerId", ids: [] },
        ],
      }),
    ).toBe("district:=[`Region 1`]");
  });

  it("no grants → impossible-match sentinel", () => {
    expect(compilePersonScopePredicate({ grants: [] })).toBe(
      "id:=`__no_match__`",
    );
  });

  it("every grant empty → impossible-match sentinel", () => {
    expect(
      compilePersonScopePredicate({
        grants: [{ kind: "byField", field: "officerId", ids: [] }],
      }),
    ).toBe("id:=`__no_match__`");
  });

  it("any unrestricted grant short-circuits even alongside other grants", () => {
    expect(
      compilePersonScopePredicate({
        grants: [
          { kind: "byField", field: "district", ids: ["Region 1"] },
          { kind: "unrestricted" },
        ],
      }),
    ).toBeNull();
  });
});

describe("toPersonTypesenseFilter", () => {
  const unrestrictedScope: PersonScope = { grants: [{ kind: "unrestricted" }] };
  const districtScope: PersonScope = {
    grants: [{ kind: "byField", field: "district", ids: ["Region 1"] }],
  };

  it("unrestricted scope → stateCode only", () => {
    expect(
      toPersonTypesenseFilter(unrestrictedScope, { stateCode: "US_TN" }),
    ).toBe("stateCode:=`US_TN`");
  });

  it("district grant → stateCode AND district clause", () => {
    expect(toPersonTypesenseFilter(districtScope, { stateCode: "US_TN" })).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`])",
    );
  });

  it("district + officerId grants → ORed under stateCode", () => {
    const scope: PersonScope = {
      grants: [
        { kind: "byField", field: "district", ids: ["Region 1"] },
        { kind: "byField", field: "officerId", ids: ["staff-1"] },
      ],
    };
    expect(toPersonTypesenseFilter(scope, { stateCode: "US_TN" })).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`] || officerId:=[`staff-1`])",
    );
  });

  it("no grants → stateCode AND impossible-match sentinel", () => {
    expect(
      toPersonTypesenseFilter({ grants: [] }, { stateCode: "US_TN" }),
    ).toBe("stateCode:=`US_TN` && (id:=`__no_match__`)");
  });
});

describe("toCrossSystemPersonTypesenseFilter", () => {
  const districtScope: PersonScope = {
    grants: [{ kind: "byField", field: "district", ids: ["Region 1"] }],
  };
  const unrestrictedScope: PersonScope = { grants: [{ kind: "unrestricted" }] };

  it("supervision only → single-system clause", () => {
    expect(
      toCrossSystemPersonTypesenseFilter(
        { supervision: districtScope },
        "US_TN",
      ),
    ).toBe(
      "stateCode:=`US_TN` && (system:=`SUPERVISION` && (district:=[`Region 1`]))",
    );
  });

  it("incarceration only, unrestricted → system filter only", () => {
    expect(
      toCrossSystemPersonTypesenseFilter(
        { incarceration: unrestrictedScope },
        "US_MI",
      ),
    ).toBe("stateCode:=`US_MI` && system:=`INCARCERATION`");
  });

  it("both systems with different scopes", () => {
    expect(
      toCrossSystemPersonTypesenseFilter(
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
    expect(toCrossSystemPersonTypesenseFilter({}, "US_TN")).toBe(
      "stateCode:=`US_TN`",
    );
  });
});
