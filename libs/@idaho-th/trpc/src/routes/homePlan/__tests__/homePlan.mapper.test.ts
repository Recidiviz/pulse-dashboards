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
  HomePlanInvestigationResult,
  HomePlanType,
  ParoleCommissionDecision,
  ReleaseDecision,
  ReleaseTaskType,
  TaskCompletedByRole,
} from "~@idaho-th/prisma/client";

import {
  mapProviderHomePlanResult,
  mapStaffHomePlanResult,
} from "../homePlan.mapper";

describe("home plan mapper release task badges", () => {
  const baseHomePlan = {
    id: "home-plan-1",
    applicationId: "app-1",
    type: HomePlanType.PROVIDER,
    address: null,
    selectedProviderId: "provider-1",
    createdByStaffPseudonymizedId: "staff-1",
    createdAt: new Date("2026-06-12T00:00:00.000Z"),
    updatedAt: new Date("2026-04-20T00:00:00.000Z"),
    releaseDecision: null,
    homePlanInvestigation: null,
    approvalsAt: null,
    selectedProvider: {
      id: "provider-1",
      name: "Hope Housing",
      userAssignments: [
        {
          user: {
            name: "Jane Doe",
            email: "jane.doe@example.com",
            contactPhone: "208-555-0100",
          },
        },
      ],
    },
    releaseTasks: [
      {
        id: "task-1",
        taskType: ReleaseTaskType.FUNDING_SECURED,
        completed: true,
        completedAt: new Date("2026-06-12T01:00:00.000Z"),
        completedByRole: TaskCompletedByRole.PROVIDER,
        completedByPseudonymizedId: "provider-1",
        note: null,
        date: null,
      },
    ],
  };

  const homePlan = baseHomePlan;

  it("exposes home plan updatedAt for the Updated at label", () => {
    const result = mapStaffHomePlanResult(
      "app-1",
      ApplicationStage.RELEASE,
      homePlan,
      new Date("2026-06-01T00:00:00.000Z"),
    );

    expect(result.homePlan?.updatedAt).toEqual(
      new Date("2026-04-20T00:00:00.000Z"),
    );
  });

  it("flags provider-completed tasks for staff", () => {
    const result = mapStaffHomePlanResult(
      "app-1",
      ApplicationStage.RELEASE,
      homePlan,
      new Date("2026-06-01T00:00:00.000Z"),
    );

    const signedTask = result.releaseTasks?.tasks.find(
      (task) => task.taskType === ReleaseTaskType.FUNDING_SECURED,
    );

    expect(signedTask?.updatedByOtherParty).toBe(true);
  });

  it("flags provider-completed tasks for the provider viewer", () => {
    const result = mapProviderHomePlanResult(
      "app-1",
      ApplicationStage.RELEASE,
      homePlan,
    );

    const signedTask = result.releaseTasks?.tasks.find(
      (task) => task.taskType === ReleaseTaskType.FUNDING_SECURED,
    );

    expect(signedTask?.updatedByOtherParty).toBe(false);
  });

  it("gives staff the selected provider's contact", () => {
    const result = mapStaffHomePlanResult(
      "app-1",
      ApplicationStage.RELEASE,
      homePlan,
      new Date("2026-06-01T00:00:00.000Z"),
    );

    expect(result.homePlan?.provider?.contact).toEqual({
      contactName: "Jane Doe",
      email: "jane.doe@example.com",
      contactPhone: "208-555-0100",
    });
  });

  it("withholds the contact from a provider viewer", () => {
    // The selected organization need not be the viewing provider's own.
    const result = mapProviderHomePlanResult(
      "app-1",
      ApplicationStage.RELEASE,
      homePlan,
    );

    expect(result.homePlan?.provider?.contact).toBeNull();
  });

  it("reports no contact for a provider with no users", () => {
    const result = mapStaffHomePlanResult(
      "app-1",
      ApplicationStage.RELEASE,
      {
        ...homePlan,
        selectedProvider: { ...homePlan.selectedProvider, userAssignments: [] },
      },
      new Date("2026-06-01T00:00:00.000Z"),
    );

    expect(result.homePlan?.provider?.contact).toBeNull();
  });
});

describe("home plan mapper approvals badges", () => {
  const baseHomePlan = {
    id: "home-plan-1",
    applicationId: "app-1",
    type: HomePlanType.PROVIDER,
    address: null,
    selectedProviderId: "provider-1",
    createdByStaffPseudonymizedId: "staff-1",
    createdAt: new Date("2026-06-12T00:00:00.000Z"),
    updatedAt: new Date("2026-04-20T00:00:00.000Z"),
    releaseDecision: null,
    homePlanInvestigation: null,
    approvalsAt: null,
    selectedProvider: {
      id: "provider-1",
      name: "Hope Housing",
      userAssignments: [
        {
          user: {
            name: "Jane Doe",
            email: "jane.doe@example.com",
            contactPhone: "208-555-0100",
          },
        },
      ],
    },
    releaseTasks: [],
  };

  it("shows a pending badge while the case waits in Approvals", () => {
    const result = mapStaffHomePlanResult(
      "app-1",
      ApplicationStage.APPROVALS,
      baseHomePlan,
      new Date("2026-06-01T00:00:00.000Z"),
    );

    expect(result.approvals).toEqual({
      badge: "PENDING",
      releaseDecision: null,
      homePlanInvestigation: null,
      approvalsAt: null,
    });
    expect(result.permissions.canSetApprovals).toBe(true);
    expect(result.releaseTasks?.active).toBe(false);
  });

  it("shows housing plan approved once both decisions clear approvals", () => {
    const approvalsAt = new Date("2026-06-12T01:00:00.000Z");
    const result = mapStaffHomePlanResult(
      "app-1",
      ApplicationStage.RELEASE,
      {
        ...baseHomePlan,
        releaseDecision: ReleaseDecision.PROBATION_GRANTED,
        homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        approvalsAt,
      },
      new Date("2026-06-01T00:00:00.000Z"),
    );

    expect(result.approvals).toEqual({
      badge: "HOUSING_PLAN_APPROVED",
      releaseDecision: ReleaseDecision.PROBATION_GRANTED,
      homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
      approvalsAt,
    });
    expect(result.permissions.canSetApprovals).toBe(false);
    expect(result.permissions.canToggleReleaseTasks).toBe(true);
    expect(result.releaseTasks?.active).toBe(true);
  });

  it("shows a Termer's plan approved once the stored parole decision and the investigation clear", () => {
    const result = mapStaffHomePlanResult(
      "app-1",
      ApplicationStage.RELEASE,
      {
        ...baseHomePlan,
        homePlanInvestigation: HomePlanInvestigationResult.NOT_APPLICABLE,
        approvalsAt: new Date("2026-06-12T01:00:00.000Z"),
      },
      new Date("2026-06-01T00:00:00.000Z"),
      ParoleCommissionDecision.PAROLE_GRANTED,
    );

    expect(result.approvals?.badge).toBe("HOUSING_PLAN_APPROVED");
  });

  it("shows housing plan rejected after a failed home plan investigation", () => {
    const approvalsAt = new Date("2026-06-12T01:00:00.000Z");
    const result = mapStaffHomePlanResult(
      "app-1",
      ApplicationStage.CLOSED,
      {
        ...baseHomePlan,
        homePlanInvestigation: HomePlanInvestigationResult.REJECTED,
        approvalsAt,
      },
      new Date("2026-06-01T00:00:00.000Z"),
    );

    expect(result.approvals).toEqual({
      badge: "HOUSING_PLAN_REJECTED",
      releaseDecision: null,
      homePlanInvestigation: HomePlanInvestigationResult.REJECTED,
      approvalsAt,
    });
    expect(result.permissions.canSetApprovals).toBe(false);
    expect(result.permissions.canToggleReleaseTasks).toBe(false);
    expect(result.releaseTasks?.active).toBe(false);
  });

  it.each([
    {
      name: "probation denied",
      releaseDecision: ReleaseDecision.PROBATION_DENIED,
      paroleCommissionDecision: null,
      investigation: null,
    },
    {
      name: "parole denied",
      releaseDecision: null,
      paroleCommissionDecision: ParoleCommissionDecision.PAROLE_DENIED,
      investigation: null,
    },
    {
      name: "parole denied and a failed investigation",
      releaseDecision: null,
      paroleCommissionDecision: ParoleCommissionDecision.PAROLE_DENIED,
      investigation: HomePlanInvestigationResult.REJECTED,
    },
  ])("shows release denied to staff for $name", (row) => {
    const result = mapStaffHomePlanResult(
      "app-1",
      ApplicationStage.CLOSED,
      {
        ...baseHomePlan,
        releaseDecision: row.releaseDecision,
        homePlanInvestigation: row.investigation,
        approvalsAt: new Date("2026-06-12T01:00:00.000Z"),
      },
      new Date("2026-06-01T00:00:00.000Z"),
      row.paroleCommissionDecision,
    );

    expect(result.approvals?.badge).toBe("RELEASE_DENIED");
  });

  it("shows providers a rejected plan when the release is denied", () => {
    const result = mapProviderHomePlanResult(
      "app-1",
      ApplicationStage.CLOSED,
      { ...baseHomePlan, approvalsAt: new Date("2026-06-12T01:00:00.000Z") },
      ParoleCommissionDecision.PAROLE_DENIED,
    );

    expect(result.approvals?.badge).toBe("HOUSING_PLAN_REJECTED");
    expect(result.approvals?.releaseDecision).toBeNull();
  });
});
