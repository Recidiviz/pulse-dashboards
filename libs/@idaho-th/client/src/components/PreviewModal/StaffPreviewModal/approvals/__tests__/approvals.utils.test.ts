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

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  HomePlanInvestigationResult,
  ParoleCommissionDecision,
  ReleaseDecision,
} from "~@idaho-th/shared";

import { APPROVALS_ACTION, type ApprovalsAction } from "../../../constants";
import { resolveApprovalsAction, useDecisionDraft } from "../approvals.utils";

// The gate is the shared deriveApprovalsOutcome the server also runs; these
// tables pin how each outcome maps to the confirmation the CM sees.
describe("resolveApprovalsAction — Termer/PV", () => {
  const termer = (
    paroleCommissionDecision: ParoleCommissionDecision | null,
    homePlanInvestigation: HomePlanInvestigationResult | null,
    hasHomePlan = true,
  ) =>
    resolveApprovalsAction(
      {
        paroleCommissionDecision,
        releaseDecision: null,
        homePlanInvestigation,
      },
      { isRider: false, hasHomePlan },
    );

  it.each<
    [
      ParoleCommissionDecision | null,
      HomePlanInvestigationResult | null,
      ApprovalsAction | null,
    ]
  >([
    // A denial closes the case whichever order the two were recorded in.
    ["PAROLE_DENIED", null, APPROVALS_ACTION.CLOSE_CASE],
    ["PAROLE_DENIED", "APPROVED", APPROVALS_ACTION.CLOSE_CASE],
    [null, "REJECTED", APPROVALS_ACTION.CLOSE_CASE],
    ["PAROLE_GRANTED", "REJECTED", APPROVALS_ACTION.CLOSE_CASE],
    ["NOT_APPLICABLE", "REJECTED", APPROVALS_ACTION.CLOSE_CASE],

    // Advances only once both are cleared.
    ["PAROLE_GRANTED", "APPROVED", APPROVALS_ACTION.ADVANCE_TO_RELEASE],
    ["PAROLE_GRANTED", "NOT_APPLICABLE", APPROVALS_ACTION.ADVANCE_TO_RELEASE],
    ["NOT_APPLICABLE", "APPROVED", APPROVALS_ACTION.ADVANCE_TO_RELEASE],
    ["NOT_APPLICABLE", "NOT_APPLICABLE", APPROVALS_ACTION.ADVANCE_TO_RELEASE],

    // A fully served sentence still needs an investigation result.
    ["NOT_APPLICABLE", null, null],
    ["PAROLE_GRANTED", null, null],
    [null, "APPROVED", null],
    [null, null, null],
  ])("%s + %s resolves to %s", (pcd, investigation, expected) => {
    expect(termer(pcd, investigation)).toBe(expected);
  });

  it("closes on a parole denial before any home plan exists", () => {
    expect(termer("PAROLE_DENIED", null, false)).toBe(
      APPROVALS_ACTION.CLOSE_CASE,
    );
  });

  it("waits on a cleared decision until a home plan exists", () => {
    expect(termer("PAROLE_GRANTED", null, false)).toBeNull();
  });
});

describe("resolveApprovalsAction — Rider", () => {
  const rider = (
    releaseDecision: ReleaseDecision | null,
    homePlanInvestigation: HomePlanInvestigationResult | null,
  ) =>
    resolveApprovalsAction(
      {
        paroleCommissionDecision: null,
        releaseDecision,
        homePlanInvestigation,
      },
      { isRider: true, hasHomePlan: true },
    );

  it.each<
    [
      ReleaseDecision | null,
      HomePlanInvestigationResult | null,
      ApprovalsAction | null,
    ]
  >([
    ["PROBATION_DENIED", null, APPROVALS_ACTION.CLOSE_CASE],
    ["PROBATION_DENIED", "APPROVED", APPROVALS_ACTION.CLOSE_CASE],
    [null, "REJECTED", APPROVALS_ACTION.CLOSE_CASE],
    ["PROBATION_GRANTED", "REJECTED", APPROVALS_ACTION.CLOSE_CASE],
    ["PROBATION_GRANTED", "APPROVED", APPROVALS_ACTION.ADVANCE_TO_RELEASE],
    ["PROBATION_GRANTED", null, null],
    [null, "APPROVED", null],
    [null, null, null],
  ])("%s + %s resolves to %s", (release, investigation, expected) => {
    expect(rider(release, investigation)).toBe(expected);
  });

  it("ignores a Parole Commission Decision", () => {
    expect(
      resolveApprovalsAction(
        {
          paroleCommissionDecision: "PAROLE_DENIED",
          releaseDecision: null,
          homePlanInvestigation: "APPROVED",
        },
        { isRider: true, hasHomePlan: true },
      ),
    ).toBeNull();
  });
});

describe("useDecisionDraft", () => {
  it("seeds the draft from the persisted value and starts clean", () => {
    const { result } = renderHook(() => useDecisionDraft("APPROVED"));

    expect(result.current.draft).toBe("APPROVED");
    expect(result.current.isDirty).toBe(false);
  });

  it("becomes dirty once the selection differs from what is stored", () => {
    const { result } = renderHook(() => useDecisionDraft<string>(null));

    act(() => result.current.setDraft("REJECTED"));

    expect(result.current.draft).toBe("REJECTED");
    expect(result.current.isDirty).toBe(true);
  });

  it("becomes clean again when the selection is set back to the stored value", () => {
    const { result } = renderHook(() => useDecisionDraft<string>("APPROVED"));

    act(() => result.current.setDraft("REJECTED"));
    act(() => result.current.setDraft("APPROVED"));

    expect(result.current.isDirty).toBe(false);
  });

  it("re-seeds from a successful save, greying out that group's Save button", () => {
    const { result, rerender } = renderHook(
      ({ persisted }: { persisted: string | null }) =>
        useDecisionDraft(persisted),
      { initialProps: { persisted: null as string | null } },
    );
    act(() => result.current.setDraft("APPROVED"));
    expect(result.current.isDirty).toBe(true);

    rerender({ persisted: "APPROVED" });

    expect(result.current.draft).toBe("APPROVED");
    expect(result.current.isDirty).toBe(false);
  });

  it("keeps the selection on screen when a confirmation is cancelled", () => {
    // Nothing was persisted, so the draft must survive the re-render.
    const { result, rerender } = renderHook(
      ({ persisted }: { persisted: string | null }) =>
        useDecisionDraft(persisted),
      { initialProps: { persisted: null as string | null } },
    );
    act(() => result.current.setDraft("REJECTED"));

    rerender({ persisted: null });

    expect(result.current.draft).toBe("REJECTED");
    expect(result.current.isDirty).toBe(true);
  });

  it("re-seeds when the persisted value changes underneath an untouched draft", () => {
    const { result, rerender } = renderHook(
      ({ persisted }: { persisted: string | null }) =>
        useDecisionDraft(persisted),
      { initialProps: { persisted: "APPROVED" as string | null } },
    );

    rerender({ persisted: "REJECTED" });

    expect(result.current.draft).toBe("REJECTED");
    expect(result.current.isDirty).toBe(false);
  });
});
