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
  resolveCrossSystemPersonScopes,
  resolvePersonScope,
} from "../resolvePersonScope";
import type {
  ResolvePersonScopeInput,
  ResolveScopeFeatureVariants,
  ResolveScopeUser,
  SingleWorkflowsSystem,
} from "../types";

function makeInput(
  overrides: {
    stateCode?: string;
    system?: SingleWorkflowsSystem;
    user?: Partial<ResolveScopeUser>;
    fvs?: ResolveScopeFeatureVariants;
    isSupervisor?: boolean;
    staffExternalId?: string;
    supervisedStaffExternalIds?: string[];
  } = {},
): ResolvePersonScopeInput {
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
    staffExternalId: overrides.staffExternalId,
    supervisedStaffExternalIds: overrides.supervisedStaffExternalIds,
  };
}

describe("resolvePersonScope: base scope translation", () => {
  it("unrestricted base → unrestricted grant, short-circuits", () => {
    const scope = resolvePersonScope(
      makeInput({ stateCode: "US_XX" /* default states are unrestricted */ }),
    );
    expect(scope).toEqual({ grants: [{ kind: "unrestricted" }] });
  });

  it("byDistricts base → district grant with the same ids (no enumeration)", () => {
    const scope = resolvePersonScope(
      makeInput({
        stateCode: "US_TN",
        user: { district: "Region 1" },
      }),
    );
    expect(scope).toEqual({
      grants: [{ kind: "byField", field: "district", ids: ["Region 1"] }],
    });
  });

  it("byDistricts base with multiple ids (e.g. US_MI district 10 expansion)", () => {
    const scope = resolvePersonScope(
      makeInput({ stateCode: "US_MI", user: { district: "10" } }),
    );
    expect(scope).toEqual({
      grants: [
        {
          kind: "byField",
          field: "district",
          ids: [
            "10 - WEST",
            "10 - CENTRAL",
            "10 - NORTHEAST",
            "10 - NORTHWEST",
          ],
        },
      ],
    });
  });

  it("byEmail base + staffExternalId → officerId grant via identity swap", () => {
    const scope = resolvePersonScope(
      makeInput({
        stateCode: "US_TN",
        user: { email: "officer@example.com" },
        staffExternalId: "staff-42",
      }),
    );
    expect(scope).toEqual({
      grants: [{ kind: "byField", field: "officerId", ids: ["staff-42"] }],
    });
  });

  it("byEmail base with no staffExternalId provided → officerId grant with empty ids", () => {
    const scope = resolvePersonScope(
      makeInput({
        stateCode: "US_TN",
        user: { email: "officer@example.com" },
      }),
    );
    expect(scope).toEqual({
      grants: [{ kind: "byField", field: "officerId", ids: [] }],
    });
  });

  it("none base (no caseload, no district) → no own grant", () => {
    const scope = resolvePersonScope(
      makeInput({
        stateCode: "US_TN",
        user: { hasCaseload: false },
      }),
    );
    expect(scope).toEqual({ grants: [] });
  });
});

describe("resolvePersonScope: supervisor expansion translation", () => {
  it("district base + supervisor expansion → two grants (district AND officerId)", () => {
    const scope = resolvePersonScope(
      makeInput({
        stateCode: "US_TN",
        user: { id: "user-7", district: "Region 1" },
        fvs: { workflowsSupervisorSearch: true },
        isSupervisor: true,
        supervisedStaffExternalIds: ["staff-1", "staff-2"],
      }),
    );
    expect(scope).toEqual({
      grants: [
        { kind: "byField", field: "district", ids: ["Region 1"] },
        { kind: "byField", field: "officerId", ids: ["staff-1", "staff-2"] },
      ],
    });
  });

  it("no-caseload supervisor (none base) + expansion → expansion is the only grant", () => {
    const scope = resolvePersonScope(
      makeInput({
        stateCode: "US_TN",
        user: { id: "user-7", hasCaseload: false },
        fvs: { workflowsSupervisorSearch: true },
        isSupervisor: true,
        supervisedStaffExternalIds: ["staff-1"],
      }),
    );
    expect(scope).toEqual({
      grants: [{ kind: "byField", field: "officerId", ids: ["staff-1"] }],
    });
  });

  it("expansion active but supervisedStaffExternalIds omitted → officerId grant with empty ids", () => {
    const scope = resolvePersonScope(
      makeInput({
        stateCode: "US_TN",
        user: { id: "user-7", district: "Region 1" },
        fvs: { workflowsSupervisorSearch: true },
        isSupervisor: true,
      }),
    );
    expect(scope).toEqual({
      grants: [
        { kind: "byField", field: "district", ids: ["Region 1"] },
        { kind: "byField", field: "officerId", ids: [] },
      ],
    });
  });

  it("unrestricted base short-circuits even when isSupervisor is true (expansion never fires)", () => {
    const scope = resolvePersonScope(
      makeInput({
        stateCode: "US_TN",
        system: "INCARCERATION",
        user: { id: "user-7", district: "Facility 1" },
        fvs: { workflowsSupervisorSearch: true },
        isSupervisor: true,
        supervisedStaffExternalIds: ["staff-1"],
      }),
    );
    expect(scope).toEqual({ grants: [{ kind: "unrestricted" }] });
  });

  it("bypass FV → unrestricted regardless of state baseline or supervisor status", () => {
    const scope = resolvePersonScope(
      makeInput({
        stateCode: "US_TN",
        user: { district: "Region 1" },
        fvs: { supervisionUnrestrictedSearch: true },
      }),
    );
    expect(scope).toEqual({ grants: [{ kind: "unrestricted" }] });
  });
});

describe("resolveCrossSystemPersonScopes (system=ALL leadership case)", () => {
  it("returns asymmetric scopes for US_MI (SUPR district-scoped, INC unrestricted)", () => {
    const scopes = resolveCrossSystemPersonScopes({
      stateCode: "US_MI",
      user: {
        id: "user-7",
        email: "lead@example.com",
        district: "Region 3",
      },
      activeFeatureVariants: {},
      isSupervisor: false,
    });
    expect(scopes.supervision).toEqual({
      grants: [{ kind: "byField", field: "district", ids: ["Region 3"] }],
    });
    expect(scopes.incarceration).toEqual({
      grants: [{ kind: "unrestricted" }],
    });
  });

  it("supervisor expansion attaches only to the system with a non-unrestricted base", () => {
    const scopes = resolveCrossSystemPersonScopes({
      stateCode: "US_MI",
      user: { id: "user-7", email: "u@example.com", district: "Region 3" },
      activeFeatureVariants: { workflowsSupervisorSearch: true },
      isSupervisor: true,
      supervisedStaffExternalIds: ["staff-1"],
    });
    expect(scopes.supervision).toEqual({
      grants: [
        { kind: "byField", field: "district", ids: ["Region 3"] },
        { kind: "byField", field: "officerId", ids: ["staff-1"] },
      ],
    });
    // INCARCERATION baseline is unrestricted → expansion is skipped, matching
    // resolveCrossSystemCaseloadScopes' per-system behavior.
    expect(scopes.incarceration).toEqual({
      grants: [{ kind: "unrestricted" }],
    });
  });
});
