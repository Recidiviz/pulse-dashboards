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
  ParoleCommissionDecision,
  ReleaseTaskType,
} from "~@idaho-th/prisma/client";
import {
  computeReleaseTaskProgress,
  ORDERED_RELEASE_TASK_TYPES,
} from "~@idaho-th/shared";

import {
  computeAcceptHomePlanUpdates,
  computeReleaseStageStatuses,
} from "../homePlan.progression";

describe("computeReleaseTaskProgress", () => {
  it("returns null for non-RELEASE stages", () => {
    expect(
      computeReleaseTaskProgress(ApplicationStage.APPLICATION, 3),
    ).toBeNull();
    expect(
      computeReleaseTaskProgress(ApplicationStage.APPROVALS, 3),
    ).toBeNull();
    expect(computeReleaseTaskProgress(ApplicationStage.CLOSED, 3)).toBeNull();
  });

  it("defaults completedCount to 0 when the count is undefined", () => {
    expect(
      computeReleaseTaskProgress(ApplicationStage.RELEASE, undefined),
    ).toEqual({
      completedCount: 0,
      totalCount: ORDERED_RELEASE_TASK_TYPES.length,
    });
  });

  it("uses totalCount from ORDERED_RELEASE_TASK_TYPES", () => {
    expect(computeReleaseTaskProgress(ApplicationStage.RELEASE, 2)).toEqual({
      completedCount: 2,
      totalCount: ORDERED_RELEASE_TASK_TYPES.length,
    });
  });
});

describe("computeAcceptHomePlanUpdates", () => {
  it("waits on P&P once the Parole Commission has already ruled", () => {
    const result = computeAcceptHomePlanUpdates(
      [],
      "provider-a",
      ParoleCommissionDecision.PAROLE_GRANTED,
    );

    expect(result.staffUpdate.status).toBe(ApplicationStatus.WAITING_ON_PP);
  });

  it("advances staff to approvals and marks selected provider as SELECTED", () => {
    const result = computeAcceptHomePlanUpdates(
      [
        {
          id: "pa-selected",
          providerId: "provider-a",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
        },
        {
          id: "pa-other",
          providerId: "provider-b",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
        },
      ],
      "provider-a",
    );

    expect(result.staffUpdate).toEqual({
      stage: ApplicationStage.APPROVALS,
      status: ApplicationStatus.WAITING_ON_PAROLE_BOARD,
    });

    expect(result.providerUpdates).toEqual([
      {
        providerApplicationId: "pa-selected",
        stage: ApplicationStage.APPROVALS,
        subStage: ApplicationSubStage.SELECTED,
        status: ApplicationStatus.WAITING,
      },
      {
        providerApplicationId: "pa-other",
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.NOT_SELECTED,
        status: ApplicationStatus.DONE,
      },
    ]);
  });

  it("leaves Declined peers untouched and cancels still-active peers", () => {
    const result = computeAcceptHomePlanUpdates(
      [
        {
          id: "pa-selected",
          providerId: "provider-a",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
        },
        {
          id: "pa-declined",
          providerId: "provider-b",
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.DECLINED,
        },
        {
          id: "pa-pending",
          providerId: "provider-c",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
        },
      ],
      "provider-a",
    );

    expect(result.providerUpdates).toEqual([
      {
        providerApplicationId: "pa-selected",
        stage: ApplicationStage.APPROVALS,
        subStage: ApplicationSubStage.SELECTED,
        status: ApplicationStatus.WAITING,
      },
      {
        providerApplicationId: "pa-pending",
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.CANCELED,
        status: ApplicationStatus.DONE,
      },
    ]);
  });

  it("cancels Info Needed peers instead of leaking their internal state", () => {
    const result = computeAcceptHomePlanUpdates(
      [
        {
          id: "pa-selected",
          providerId: "provider-a",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
        },
        {
          id: "pa-info",
          providerId: "provider-b",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.INFO_NEEDED,
        },
      ],
      "provider-a",
    );

    expect(result.providerUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerApplicationId: "pa-info",
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.CANCELED,
          status: ApplicationStatus.DONE,
        }),
      ]),
    );
  });
});

describe("computeReleaseStageStatuses", () => {
  // Ownership (per RELEASE_TASK_DEFS): FUNDING_SECURED and BED_CONFIRMED are
  // PROVIDER tasks; HOUSING_DATE_REQUESTED, HOUSING_DATE_PROVIDED, and
  // TRANSPORTATION_SECURED are STAFF (case manager) tasks. Tasks can be
  // completed in any order, so status only depends on whether each party's
  // own tasks are done.
  const allIncomplete = {
    [ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING]: false,
    [ReleaseTaskType.FUNDING_SECURED]: false,
    [ReleaseTaskType.HOUSING_DATE_REQUESTED]: false,
    [ReleaseTaskType.HOUSING_DATE_PROVIDED]: false,
    [ReleaseTaskType.BED_CONFIRMED]: false,
    [ReleaseTaskType.TRANSPORTATION_SECURED]: false,
    [ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS]: false,
  };

  const allComplete = {
    [ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING]: true,
    [ReleaseTaskType.FUNDING_SECURED]: true,
    [ReleaseTaskType.HOUSING_DATE_REQUESTED]: true,
    [ReleaseTaskType.HOUSING_DATE_PROVIDED]: true,
    [ReleaseTaskType.BED_CONFIRMED]: true,
    [ReleaseTaskType.TRANSPORTATION_SECURED]: true,
    [ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS]: true,
  };

  it("marks both parties action needed when every task is incomplete", () => {
    expect(computeReleaseStageStatuses(allIncomplete)).toEqual({
      staffStatus: ApplicationStatus.ACTION_NEEDED,
      selectedProviderStatus: ApplicationStatus.ACTION_NEEDED,
    });
  });

  it("marks both parties awaiting release when all tasks are complete", () => {
    expect(computeReleaseStageStatuses(allComplete)).toEqual({
      staffStatus: ApplicationStatus.AWAITING_RELEASE,
      selectedProviderStatus: ApplicationStatus.AWAITING_RELEASE,
    });
  });

  it("keeps provider action needed (and staff waiting) while any provider task is incomplete, regardless of staff tasks", () => {
    expect(
      computeReleaseStageStatuses({
        ...allComplete,
        [ReleaseTaskType.FUNDING_SECURED]: false,
      }),
    ).toEqual({
      staffStatus: ApplicationStatus.WAITING,
      selectedProviderStatus: ApplicationStatus.ACTION_NEEDED,
    });

    expect(
      computeReleaseStageStatuses({
        ...allComplete,
        [ReleaseTaskType.BED_CONFIRMED]: false,
      }),
    ).toEqual({
      staffStatus: ApplicationStatus.WAITING,
      selectedProviderStatus: ApplicationStatus.ACTION_NEEDED,
    });
  });

  it("keeps staff action needed (and provider waiting) while any staff task is incomplete, regardless of provider tasks", () => {
    expect(
      computeReleaseStageStatuses({
        ...allComplete,
        [ReleaseTaskType.HOUSING_DATE_REQUESTED]: false,
      }),
    ).toEqual({
      staffStatus: ApplicationStatus.ACTION_NEEDED,
      selectedProviderStatus: ApplicationStatus.WAITING,
    });

    expect(
      computeReleaseStageStatuses({
        ...allComplete,
        [ReleaseTaskType.HOUSING_DATE_PROVIDED]: false,
      }),
    ).toEqual({
      staffStatus: ApplicationStatus.ACTION_NEEDED,
      selectedProviderStatus: ApplicationStatus.WAITING,
    });

    expect(
      computeReleaseStageStatuses({
        ...allComplete,
        [ReleaseTaskType.TRANSPORTATION_SECURED]: false,
      }),
    ).toEqual({
      staffStatus: ApplicationStatus.ACTION_NEEDED,
      selectedProviderStatus: ApplicationStatus.WAITING,
    });
  });

  it("marks both parties action needed independent of completion order (a later staff task completed before an earlier provider task)", () => {
    expect(
      computeReleaseStageStatuses({
        ...allIncomplete,
        [ReleaseTaskType.TRANSPORTATION_SECURED]: true,
        [ReleaseTaskType.FUNDING_SECURED]: false,
      }),
    ).toEqual({
      staffStatus: ApplicationStatus.ACTION_NEEDED,
      selectedProviderStatus: ApplicationStatus.ACTION_NEEDED,
    });
  });
});
