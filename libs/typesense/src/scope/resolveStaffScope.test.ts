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
  resolveCrossSystemStaffScopes,
  resolveStaffScope,
} from "./resolveStaffScope";
import type {
  ResolveScopeFeatureVariants,
  ResolveScopeInput,
  ResolveScopeUser,
  SingleWorkflowsSystem,
} from "./types";

function makeInput(
  overrides: {
    stateCode?: string;
    system?: SingleWorkflowsSystem;
    user?: Partial<ResolveScopeUser>;
    fvs?: ResolveScopeFeatureVariants;
    isSupervisor?: boolean;
  } = {},
): ResolveScopeInput {
  return {
    stateCode: overrides.stateCode ?? "US_XX",
    system: overrides.system ?? "SUPERVISION",
    user: {
      id: "user-1",
      email: "user@example.com",
      district: undefined,
      overrideDistrictIds: undefined,
      roleSubtype: null,
      ...overrides.user,
    },
    activeFeatureVariants: overrides.fvs ?? {},
    isSupervisor: overrides.isSupervisor ?? false,
  };
}

describe("resolveStaffScope precedence", () => {
  it("bypass FV → unrestricted regardless of state baseline", () => {
    const scope = resolveStaffScope(
      makeInput({
        stateCode: "US_TN",
        user: { district: "Region 1" },
        fvs: { supervisionUnrestrictedSearch: true },
      }),
    );
    expect(scope).toEqual({ base: { kind: "unrestricted" } });
  });

  it("supervisor FV + isSupervisor → adds supervisor expansion to base", () => {
    const scope = resolveStaffScope(
      makeInput({
        stateCode: "US_TN",
        user: { id: "user-7", district: "Region 1" },
        fvs: { workflowsSupervisorSearch: true },
        isSupervisor: true,
      }),
    );
    expect(scope).toEqual({
      base: { kind: "byDistricts", districts: ["Region 1"] },
      expandToSupervisedStaff: { userId: "user-7" },
    });
  });

  it("supervisor FV but isSupervisor=false → no expansion", () => {
    const scope = resolveStaffScope(
      makeInput({
        stateCode: "US_TN",
        user: { id: "user-7", district: "Region 1" },
        fvs: { workflowsSupervisorSearch: true },
        isSupervisor: false,
      }),
    );
    expect(scope).toEqual({
      base: { kind: "byDistricts", districts: ["Region 1"] },
    });
  });

  it("both FVs set (misconfig) → bypass wins, supervisor expansion dropped", () => {
    const scope = resolveStaffScope(
      makeInput({
        stateCode: "US_TN",
        user: { district: "Region 1" },
        fvs: {
          supervisionUnrestrictedSearch: true,
          workflowsSupervisorSearch: true,
        },
        isSupervisor: true,
      }),
    );
    expect(scope.base).toEqual({ kind: "unrestricted" });
    // expandToSupervisedStaff is not attached when base is unrestricted —
    // mirrors production's "supervisor-OR only fires inside `if (staffFilter)`"
    // behavior in StaffSubscription.ts.
    expect(scope.expandToSupervisedStaff).toBeUndefined();
  });
});

describe("no caseload (hasCaseload=false)", () => {
  it("district-scoped state with no district falls back to `none` instead of byEmail", () => {
    const scope = resolveStaffScope(
      makeInput({
        stateCode: "US_TN",
        user: { hasCaseload: false },
      }),
    );
    expect(scope.base).toEqual({ kind: "none" });
  });

  it("district-scoped state with explicit district still uses byDistricts", () => {
    const scope = resolveStaffScope(
      makeInput({
        stateCode: "US_TN",
        user: { district: "Region 1", hasCaseload: false },
      }),
    );
    expect(scope.base).toEqual({
      kind: "byDistricts",
      districts: ["Region 1"],
    });
  });

  it("no-caseload supervisor with supervisor FV → none + supervisor expansion", () => {
    const scope = resolveStaffScope(
      makeInput({
        stateCode: "US_TN",
        user: { id: "user-7", hasCaseload: false },
        fvs: { workflowsSupervisorSearch: true },
        isSupervisor: true,
      }),
    );
    expect(scope).toEqual({
      base: { kind: "none" },
      expandToSupervisedStaff: { userId: "user-7" },
    });
  });

  it("US_CA SUPERVISION_OFFICER with no caseload → `none` instead of byEmail", () => {
    const scope = resolveStaffScope(
      makeInput({
        stateCode: "US_CA",
        user: {
          roleSubtype: "SUPERVISION_OFFICER",
          hasCaseload: false,
        },
      }),
    );
    expect(scope.base).toEqual({ kind: "none" });
  });

  it("hasCaseload=true (or undefined) preserves the existing email fallback", () => {
    const scope = resolveStaffScope(
      makeInput({
        stateCode: "US_TN",
        user: { hasCaseload: true },
      }),
    );
    expect(scope.base).toEqual({
      kind: "byEmail",
      email: "user@example.com",
    });
  });
});

describe("state baselines", () => {
  describe("default (unrestricted) states", () => {
    it.each([
      "US_AR",
      "US_AZ",
      "US_IA",
      "US_ME",
      "US_MO",
      "US_ND",
      "US_NE",
      "US_OR",
      "US_PA",
      "US_TX",
      "US_UT",
    ])("%s → unrestricted", (stateCode) => {
      const scope = resolveStaffScope(
        makeInput({ stateCode, user: { district: "10" } }),
      );
      expect(scope.base).toEqual({ kind: "unrestricted" });
    });
  });

  describe("US_TN", () => {
    it("district-scoped via user.district (SUPERVISION)", () => {
      const scope = resolveStaffScope(
        makeInput({ stateCode: "US_TN", user: { district: "Region 1" } }),
      );
      expect(scope.base).toEqual({
        kind: "byDistricts",
        districts: ["Region 1"],
      });
    });

    it("district-scoped via overrideDistrictIds (SUPERVISION)", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_TN",
          user: {
            district: "Region 1",
            overrideDistrictIds: ["Region 2", "Region 3"],
          },
        }),
      );
      expect(scope.base).toEqual({
        kind: "byDistricts",
        districts: ["Region 2", "Region 3"],
      });
    });

    it("email fallback when no district and no override (SUPERVISION)", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_TN",
          user: { email: "officer@example.com" },
        }),
      );
      expect(scope.base).toEqual({
        kind: "byEmail",
        email: "officer@example.com",
      });
    });

    it("INCARCERATION is unrestricted", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_TN",
          system: "INCARCERATION",
          user: { district: "Facility 1" },
        }),
      );
      expect(scope.base).toEqual({ kind: "unrestricted" });
    });
  });

  describe("US_ID", () => {
    it("SUPERVISION is district-scoped", () => {
      const scope = resolveStaffScope(
        makeInput({ stateCode: "US_ID", user: { district: "D1" } }),
      );
      expect(scope.base).toEqual({ kind: "byDistricts", districts: ["D1"] });
    });

    it("INCARCERATION is unrestricted", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_ID",
          system: "INCARCERATION",
          user: { district: "D1" },
        }),
      );
      expect(scope.base).toEqual({ kind: "unrestricted" });
    });
  });

  describe("US_MI", () => {
    it("SUPERVISION district 10 expands to all 10-* districts", () => {
      const scope = resolveStaffScope(
        makeInput({ stateCode: "US_MI", user: { district: "10" } }),
      );
      expect(scope.base).toEqual({
        kind: "byDistricts",
        districts: [
          "10 - WEST",
          "10 - CENTRAL",
          "10 - NORTHEAST",
          "10 - NORTHWEST",
        ],
      });
    });

    it("SUPERVISION non-10 district uses standard district scope", () => {
      const scope = resolveStaffScope(
        makeInput({ stateCode: "US_MI", user: { district: "Region 3" } }),
      );
      expect(scope.base).toEqual({
        kind: "byDistricts",
        districts: ["Region 3"],
      });
    });

    it("SUPERVISION overrideDistrictIds skips district 10 expansion", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_MI",
          user: { district: "10", overrideDistrictIds: ["Region X"] },
        }),
      );
      expect(scope.base).toEqual({
        kind: "byDistricts",
        districts: ["Region X"],
      });
    });

    it("INCARCERATION is unrestricted (no district 10 expansion)", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_MI",
          system: "INCARCERATION",
          user: { district: "10" },
        }),
      );
      expect(scope.base).toEqual({ kind: "unrestricted" });
    });
  });

  describe("US_CA", () => {
    it("SUPERVISION_OFFICER_SUPERVISOR → unrestricted", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_CA",
          user: {
            roleSubtype: "SUPERVISION_OFFICER_SUPERVISOR",
            district: "D1",
          },
        }),
      );
      expect(scope.base).toEqual({ kind: "unrestricted" });
    });

    it("SUPERVISION_OFFICER → byEmail (own caseload)", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_CA",
          user: {
            email: "agent@example.com",
            roleSubtype: "SUPERVISION_OFFICER",
            district: "D1",
          },
        }),
      );
      expect(scope.base).toEqual({
        kind: "byEmail",
        email: "agent@example.com",
      });
    });

    it("officer with no district + no override → byEmail (intentional fallback)", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_CA",
          user: { email: "agent@example.com", roleSubtype: null },
        }),
      );
      expect(scope.base).toEqual({
        kind: "byEmail",
        email: "agent@example.com",
      });
    });

    it("non-officer non-supervisor with district → byDistricts", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_CA",
          user: { roleSubtype: null, district: "Unit 5" },
        }),
      );
      expect(scope.base).toEqual({
        kind: "byDistricts",
        districts: ["Unit 5"],
      });
    });

    it("INCARCERATION is unrestricted regardless of role", () => {
      const scope = resolveStaffScope(
        makeInput({
          stateCode: "US_CA",
          system: "INCARCERATION",
          user: { roleSubtype: "SUPERVISION_OFFICER" },
        }),
      );
      expect(scope.base).toEqual({ kind: "unrestricted" });
    });
  });
});

describe("resolveCrossSystemStaffScopes (system=ALL leadership case)", () => {
  it("returns asymmetric scopes for US_MI (SUPR district-scoped, INC unrestricted)", () => {
    const scopes = resolveCrossSystemStaffScopes({
      stateCode: "US_MI",
      user: {
        id: "user-7",
        email: "lead@example.com",
        district: "Region 3",
      },
      activeFeatureVariants: {},
      isSupervisor: false,
    });
    expect(scopes.supervision.base).toEqual({
      kind: "byDistricts",
      districts: ["Region 3"],
    });
    expect(scopes.incarceration.base).toEqual({ kind: "unrestricted" });
  });

  // the tenant/us_tn config is wrong - incarceration shouldn't be district scoped
  it("US_TN: SUPERVISION is district-scoped, INCARCERATION is unrestricted", () => {
    const scopes = resolveCrossSystemStaffScopes({
      stateCode: "US_TN",
      user: {
        id: "user-7",
        email: "lead@example.com",
        district: "Region 1",
      },
      activeFeatureVariants: {},
      isSupervisor: false,
    });
    expect(scopes.supervision.base).toEqual({
      kind: "byDistricts",
      districts: ["Region 1"],
    });
    expect(scopes.incarceration.base).toEqual({ kind: "unrestricted" });
  });

  it("supervisor expansion attaches only to systems with a non-unrestricted base", () => {
    const scopes = resolveCrossSystemStaffScopes({
      stateCode: "US_MI",
      user: { id: "user-7", email: "u@example.com", district: "Region 3" },
      activeFeatureVariants: { workflowsSupervisorSearch: true },
      isSupervisor: true,
    });
    // SUPERVISION baseline is district-scoped → expansion attaches.
    expect(scopes.supervision.expandToSupervisedStaff).toEqual({
      userId: "user-7",
    });
    // INCARCERATION baseline is unrestricted → expansion is skipped
    // (matches production's per-system StaffSubscription behavior).
    expect(scopes.incarceration.base).toEqual({ kind: "unrestricted" });
    expect(scopes.incarceration.expandToSupervisedStaff).toBeUndefined();
  });
});
