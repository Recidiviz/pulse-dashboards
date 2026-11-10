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
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
  HomePlanInvestigationResult,
  ParoleCommissionDecision,
  ReleaseDecision,
} from "~@idaho-th/prisma/client";
import {
  buildAdvanceStageWriteData,
  isStrictlyForward,
  mapClosedOutcomeToSubStage,
  resolveAdvanceStage,
} from "~@idaho-th/trpc/routes/staffApplication/advanceStage.progression";
import { ADVANCE_STAGE_BAD_REQUEST } from "~@idaho-th/trpc/routes/staffApplication/staffApplication.constants";

describe("isStrictlyForward", () => {
  it("allows forward transitions, including skips", () => {
    expect(
      isStrictlyForward(
        ApplicationStage.APPLICATION,
        ApplicationStage.APPROVALS,
      ),
    ).toBe(true);
    expect(
      isStrictlyForward(ApplicationStage.APPLICATION, ApplicationStage.RELEASE),
    ).toBe(true);
    expect(
      isStrictlyForward(ApplicationStage.APPROVALS, ApplicationStage.CLOSED),
    ).toBe(true);
  });

  it("rejects same-stage and backward transitions", () => {
    expect(
      isStrictlyForward(ApplicationStage.RELEASE, ApplicationStage.RELEASE),
    ).toBe(false);
    expect(
      isStrictlyForward(ApplicationStage.RELEASE, ApplicationStage.APPROVALS),
    ).toBe(false);
    expect(
      isStrictlyForward(ApplicationStage.CLOSED, ApplicationStage.RELEASE),
    ).toBe(false);
  });
});

describe("mapClosedOutcomeToSubStage", () => {
  it("maps each popup outcome to the documented sub-stage", () => {
    expect(mapClosedOutcomeToSubStage(ClosedOutcome.CLIENT_RELEASED)).toBe(
      ApplicationSubStage.RELEASED,
    );
    expect(mapClosedOutcomeToSubStage(ClosedOutcome.RELEASE_DENIED)).toBe(
      ApplicationSubStage.PLAN_REJECTED,
    );
    expect(
      mapClosedOutcomeToSubStage(ClosedOutcome.HOUSING_PLAN_REJECTED),
    ).toBe(ApplicationSubStage.PLAN_REJECTED);
    expect(
      mapClosedOutcomeToSubStage(ClosedOutcome.APPLICATION_WITHDRAWN),
    ).toBe(ApplicationSubStage.CANCELED);
  });

  it("falls back to CANCELED for OTHER and for a missing outcome", () => {
    expect(mapClosedOutcomeToSubStage(ClosedOutcome.OTHER)).toBe(
      ApplicationSubStage.CANCELED,
    );
    expect(mapClosedOutcomeToSubStage(undefined)).toBe(
      ApplicationSubStage.CANCELED,
    );
    expect(mapClosedOutcomeToSubStage(null)).toBe(ApplicationSubStage.CANCELED);
  });
});

describe("buildAdvanceStageWriteData", () => {
  const selectedProvider = {
    id: "pa-selected",
    providerId: "provider-a",
    stage: ApplicationStage.APPROVALS,
    subStage: ApplicationSubStage.SELECTED,
  };

  it("advances to RELEASE: both CM and selected provider have tasks to act on", () => {
    const data = buildAdvanceStageWriteData({
      targetStage: ApplicationStage.RELEASE,
      selectedProviderId: "provider-a",
      providerApplications: [selectedProvider],
    });

    // Release tasks can be completed in any order (not a fixed relay), so
    // both parties start with their own unstarted tasks needing action.
    expect(data.staffApplication).toEqual({
      update: {
        stage: ApplicationStage.RELEASE,
        status: ApplicationStatus.ACTION_NEEDED,
      },
    });
    expect(data.providerApplications).toEqual({
      update: [
        {
          where: { id: "pa-selected" },
          data: {
            stage: ApplicationStage.RELEASE,
            status: ApplicationStatus.ACTION_NEEDED,
          },
        },
      ],
    });
    // A manual advance must not fabricate an approvals decision.
    expect(data.homePlan).toBeUndefined();
  });

  it("advances to APPROVALS: both parties wait", () => {
    const data = buildAdvanceStageWriteData({
      targetStage: ApplicationStage.APPROVALS,
      selectedProviderId: "provider-a",
      providerApplications: [
        { ...selectedProvider, stage: ApplicationStage.APPLICATION },
      ],
    });

    expect(data.staffApplication).toEqual({
      update: {
        stage: ApplicationStage.APPROVALS,
        status: ApplicationStatus.WAITING_ON_PAROLE_BOARD,
      },
    });
    expect(data.providerApplications).toEqual({
      update: [
        {
          where: { id: "pa-selected" },
          data: {
            stage: ApplicationStage.APPROVALS,
            status: ApplicationStatus.WAITING,
          },
        },
      ],
    });
  });

  it("closes from Application: cancels every still-active provider", () => {
    const data = buildAdvanceStageWriteData({
      targetStage: ApplicationStage.CLOSED,
      closedOutcome: ClosedOutcome.APPLICATION_WITHDRAWN,
      selectedProviderId: null,
      providerApplications: [
        {
          id: "pa-1",
          providerId: "p1",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
        },
        {
          id: "pa-2",
          providerId: "p2",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
        },
      ],
    });

    expect(data.staffApplication).toEqual({
      update: {
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.CANCELED,
        status: ApplicationStatus.DONE,
        closedOutcome: ClosedOutcome.APPLICATION_WITHDRAWN,
        closedOutcomeNote: null,
      },
    });
    expect(data.providerApplications).toEqual({
      update: [
        {
          where: { id: "pa-1" },
          data: {
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.CANCELED,
            status: ApplicationStatus.DONE,
          },
        },
        {
          where: { id: "pa-2" },
          data: {
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.CANCELED,
            status: ApplicationStatus.DONE,
          },
        },
      ],
    });
  });

  it("closes a rejected plan as CANCELED for the provider, persisting the OTHER note only for OTHER", () => {
    const rejected = buildAdvanceStageWriteData({
      targetStage: ApplicationStage.CLOSED,
      closedOutcome: ClosedOutcome.HOUSING_PLAN_REJECTED,
      selectedProviderId: "provider-a",
      providerApplications: [
        { ...selectedProvider, stage: ApplicationStage.RELEASE },
      ],
    });

    expect(rejected.staffApplication).toMatchObject({
      update: {
        subStage: ApplicationSubStage.PLAN_REJECTED,
        closedOutcomeNote: null,
      },
    });
    // Provider never sees "Plan Rejected" — it reads as Canceled.
    expect(rejected.providerApplications).toEqual({
      update: [
        {
          where: { id: "pa-selected" },
          data: {
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.CANCELED,
            status: ApplicationStatus.DONE,
          },
        },
      ],
    });

    const other = buildAdvanceStageWriteData({
      targetStage: ApplicationStage.CLOSED,
      closedOutcome: ClosedOutcome.OTHER,
      closedOutcomeNote: "Moved out of state",
      selectedProviderId: null,
      providerApplications: [],
    });
    expect(other.staffApplication).toMatchObject({
      update: { closedOutcomeNote: "Moved out of state" },
    });
  });

  it("leaves already-closed provider rows untouched when closing", () => {
    const data = buildAdvanceStageWriteData({
      targetStage: ApplicationStage.CLOSED,
      closedOutcome: ClosedOutcome.CLIENT_RELEASED,
      selectedProviderId: "provider-a",
      providerApplications: [
        { ...selectedProvider, stage: ApplicationStage.RELEASE },
        {
          id: "pa-other",
          providerId: "p2",
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.DECLINED,
        },
      ],
    });

    expect(data.providerApplications).toEqual({
      update: [
        {
          where: { id: "pa-selected" },
          data: {
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.RELEASED,
            status: ApplicationStatus.DONE,
          },
        },
      ],
    });
  });

  it("cancels non-selected providers when closing as CLIENT_RELEASED", () => {
    const data = buildAdvanceStageWriteData({
      targetStage: ApplicationStage.CLOSED,
      closedOutcome: ClosedOutcome.CLIENT_RELEASED,
      selectedProviderId: "provider-a",
      providerApplications: [
        { ...selectedProvider, stage: ApplicationStage.RELEASE },
        {
          id: "pa-other",
          providerId: "p2",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
        },
      ],
    });

    expect(data.providerApplications).toEqual({
      update: [
        {
          where: { id: "pa-selected" },
          data: {
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.RELEASED,
            status: ApplicationStatus.DONE,
          },
        },
        {
          where: { id: "pa-other" },
          data: {
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.CANCELED,
            status: ApplicationStatus.DONE,
          },
        },
      ],
    });
  });

  it("cancels all still-active providers when closing with a Manual Address home plan", () => {
    const data = buildAdvanceStageWriteData({
      targetStage: ApplicationStage.CLOSED,
      closedOutcome: ClosedOutcome.CLIENT_RELEASED,
      selectedProviderId: null,
      providerApplications: [
        {
          id: "pa-closed-earlier",
          providerId: "p1",
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.DECLINED,
        },
        {
          id: "pa-still-active",
          providerId: "p2",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
        },
      ],
    });

    expect(data.providerApplications).toEqual({
      update: [
        {
          where: { id: "pa-still-active" },
          data: {
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.CANCELED,
            status: ApplicationStatus.DONE,
          },
        },
      ],
    });
  });
});

describe("resolveAdvanceStage", () => {
  const baseContext = {
    id: "app-1",
    staffApplication: {
      stage: ApplicationStage.APPLICATION,
      paroleCommissionDecision: null,
    },
    formData: { legalCurrentStatus: "Rider" },
    homePlan: {
      selectedProviderId: "provider-a",
      releaseDecision: ReleaseDecision.PROBATION_GRANTED,
      homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
    },
    providerApplications: [],
  };

  it("returns the selected provider id from the home plan", () => {
    expect(
      resolveAdvanceStage(baseContext, ApplicationStage.APPROVALS, false),
    ).toEqual({ selectedProviderId: "provider-a" });
  });

  it("rejects advancing to Release without a home plan", () => {
    expect(() =>
      resolveAdvanceStage(
        { ...baseContext, homePlan: null },
        ApplicationStage.RELEASE,
        false,
      ),
    ).toThrow(ADVANCE_STAGE_BAD_REQUEST.HOME_PLAN_REQUIRED);
  });

  it("gates a Termer's advance to Release on the stored Parole Commission Decision", () => {
    const termerContext = {
      ...baseContext,
      formData: { legalCurrentStatus: "Termer" },
      staffApplication: {
        stage: ApplicationStage.APPROVALS,
        paroleCommissionDecision: null,
      },
      homePlan: { ...baseContext.homePlan, releaseDecision: null },
    };

    expect(() =>
      resolveAdvanceStage(termerContext, ApplicationStage.RELEASE, false),
    ).toThrow(ADVANCE_STAGE_BAD_REQUEST.APPROVALS_REQUIRED);

    expect(
      resolveAdvanceStage(
        {
          ...termerContext,
          staffApplication: {
            stage: ApplicationStage.APPROVALS,
            paroleCommissionDecision: ParoleCommissionDecision.PAROLE_GRANTED,
          },
        },
        ApplicationStage.RELEASE,
        false,
      ),
    ).toEqual({ selectedProviderId: "provider-a" });
  });

  it("rejects a closed outcome when the target stage is not CLOSED", () => {
    expect(() =>
      resolveAdvanceStage(baseContext, ApplicationStage.APPROVALS, true),
    ).toThrow(ADVANCE_STAGE_BAD_REQUEST.CLOSED_OUTCOME_NOT_ALLOWED);
  });

  it("rejects advancing a draft application", () => {
    expect(() =>
      resolveAdvanceStage(
        {
          ...baseContext,
          staffApplication: {
            stage: ApplicationStage.DRAFT,
            paroleCommissionDecision: null,
          },
        },
        ApplicationStage.APPLICATION,
        false,
      ),
    ).toThrow(ADVANCE_STAGE_BAD_REQUEST.CASE_DRAFT);
  });

  it("rejects reopening a Closed case", () => {
    expect(() =>
      resolveAdvanceStage(
        {
          ...baseContext,
          staffApplication: {
            stage: ApplicationStage.CLOSED,
            paroleCommissionDecision: null,
          },
        },
        ApplicationStage.RELEASE,
        false,
      ),
    ).toThrow(ADVANCE_STAGE_BAD_REQUEST.CASE_CLOSED);
  });

  it("rejects same-stage and backward advances", () => {
    expect(() =>
      resolveAdvanceStage(
        {
          ...baseContext,
          staffApplication: {
            stage: ApplicationStage.RELEASE,
            paroleCommissionDecision: null,
          },
        },
        ApplicationStage.RELEASE,
        false,
      ),
    ).toThrow(ADVANCE_STAGE_BAD_REQUEST.NOT_FORWARD);

    expect(() =>
      resolveAdvanceStage(
        {
          ...baseContext,
          staffApplication: {
            stage: ApplicationStage.RELEASE,
            paroleCommissionDecision: null,
          },
        },
        ApplicationStage.APPROVALS,
        false,
      ),
    ).toThrow(ADVANCE_STAGE_BAD_REQUEST.NOT_FORWARD);
  });
});
