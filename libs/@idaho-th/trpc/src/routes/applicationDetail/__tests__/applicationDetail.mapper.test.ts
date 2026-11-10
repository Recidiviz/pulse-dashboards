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

import { ApplicationStage, ClosedOutcome } from "~@idaho-th/prisma/client";
import { ORDERED_RELEASE_TASK_TYPES } from "~@idaho-th/shared";

import {
  mapProviderApplicationDetailFromRow,
  mapStaffApplicationDetailFromRow,
} from "../applicationDetail.mapper";
import {
  buildProviderJoinedApplicationRow,
  buildStaffJoinedApplicationRow,
  providerApplicationId,
  staffPseudonymizedId,
  testApplication,
  testProvider,
  testProviderLocation,
  testReleaseWorkflow,
  testWorkflow,
} from "./applicationDetail.testFixtures";

const totalReleaseTaskCount = ORDERED_RELEASE_TASK_TYPES.length;

describe("applicationDetail.mapper", () => {
  it("maps staff detail from joined application context", () => {
    const detail = mapStaffApplicationDetailFromRow({
      ...buildStaffJoinedApplicationRow(),
      providerApplications: [],
    } as never);

    expect(detail.idocNumber).toBe("123456");
    expect(detail.eligibleProviders).toEqual([]);
    expect(detail.providerApplications).toEqual([]);
    expect(detail.stage).toBe(ApplicationStage.APPLICATION);
  });

  it("maps staff detail from joined context with providerApplications", () => {
    const providerApplications = [{ providerId: "sent-provider-1" }];
    const detail = mapStaffApplicationDetailFromRow({
      ...testApplication,
      staffApplication: {
        staffPseudonymizedId,
        ...testWorkflow,
      },
      eligibleProviders: [],
      providerApplications,
    } as never);

    expect(detail.providerApplications).toEqual(providerApplications);
  });

  it("returns null releaseTaskProgress for non-RELEASE stages", () => {
    const detail = mapStaffApplicationDetailFromRow({
      ...buildStaffJoinedApplicationRow(),
      providerApplications: [],
    } as never);

    expect(detail.releaseTaskProgress).toBeNull();
  });

  it("computes releaseTaskProgress for staff detail in RELEASE stage", () => {
    const detail = mapStaffApplicationDetailFromRow({
      ...testApplication,
      staffApplication: {
        staffPseudonymizedId,
        ...testReleaseWorkflow,
      },
      eligibleProviders: [],
      homePlan: { _count: { releaseTasks: 2 } },
      providerApplications: [],
    } as never);

    expect(detail.releaseTaskProgress).toEqual({
      completedCount: 2,
      totalCount: totalReleaseTaskCount,
    });
  });

  it("maps provider detail from joined application context", () => {
    const detail = mapProviderApplicationDetailFromRow(
      buildProviderJoinedApplicationRow(),
    );

    expect(detail.providerApplicationId).toBe(providerApplicationId);
    expect(detail.idocNumber).toBe("123456");
    expect(detail.stage).toBe(ApplicationStage.APPLICATION);
    expect(detail.releaseTaskProgress).toBeNull();
  });

  it("computes releaseTaskProgress for provider detail in RELEASE stage", () => {
    const detail = mapProviderApplicationDetailFromRow({
      ...testApplication,
      homePlan: { _count: { releaseTasks: 3 } },
      providerApplications: [
        {
          id: providerApplicationId,
          provider: testProvider,
          providerLocation: testProviderLocation,
          ...testReleaseWorkflow,
        },
      ],
    } as never);

    expect(detail.releaseTaskProgress).toEqual({
      completedCount: 3,
      totalCount: totalReleaseTaskCount,
    });
  });

  it.each([
    [ClosedOutcome.APPLICATION_WITHDRAWN, "CLOSED"],
    [ClosedOutcome.RELEASE_DENIED, "CLOSED"],
    [ClosedOutcome.HOUSING_PLAN_REJECTED, "CLOSED"],
    [ClosedOutcome.CLIENT_RELEASED, ClosedOutcome.CLIENT_RELEASED],
    [ClosedOutcome.OTHER, ClosedOutcome.OTHER],
    [null, null],
  ])(
    "maps staff closedOutcome %s to provider-visible %s",
    (closedOutcome, expected) => {
      const detail = mapProviderApplicationDetailFromRow(
        buildProviderJoinedApplicationRow({ closedOutcome }),
      );

      expect(detail.closedOutcome).toBe(expected);
    },
  );
});
