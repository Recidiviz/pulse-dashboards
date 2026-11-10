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
  ApplicationStatus,
  ReleaseTaskType,
  TaskCompletedByRole,
} from "~@idaho-th/prisma/client";

import {
  buildReleaseTaskCompletionState,
  buildToggleReleaseTaskWriteData,
} from "../homePlan.progression";

describe("buildReleaseTaskCompletionState", () => {
  it("overrides the toggled task while preserving the rest", () => {
    expect(
      buildReleaseTaskCompletionState(
        [
          {
            taskType: ReleaseTaskType.FUNDING_SECURED,
            completed: false,
          },
          {
            taskType: ReleaseTaskType.HOUSING_DATE_REQUESTED,
            completed: true,
          },
        ],
        ReleaseTaskType.FUNDING_SECURED,
        true,
      ),
    ).toEqual({
      [ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING]: false,
      [ReleaseTaskType.FUNDING_SECURED]: true,
      [ReleaseTaskType.HOUSING_DATE_REQUESTED]: true,
      [ReleaseTaskType.HOUSING_DATE_PROVIDED]: false,
      [ReleaseTaskType.BED_CONFIRMED]: false,
      [ReleaseTaskType.TRANSPORTATION_SECURED]: false,
      [ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS]: false,
    });
  });
});

describe("buildToggleReleaseTaskWriteData", () => {
  const releaseTasks = [
    {
      id: "task-0",
      taskType: ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING,
      completed: false,
    },
    {
      id: "task-1",
      taskType: ReleaseTaskType.FUNDING_SECURED,
      completed: false,
    },
    {
      id: "task-2",
      taskType: ReleaseTaskType.HOUSING_DATE_REQUESTED,
      completed: false,
    },
    {
      id: "task-3",
      taskType: ReleaseTaskType.HOUSING_DATE_PROVIDED,
      completed: false,
    },
    {
      id: "task-4",
      taskType: ReleaseTaskType.BED_CONFIRMED,
      completed: false,
    },
    {
      id: "task-5",
      taskType: ReleaseTaskType.TRANSPORTATION_SECURED,
      completed: false,
    },
    {
      id: "task-6",
      taskType: ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS,
      completed: false,
    },
  ];

  it("keeps both parties action needed when only one provider task is completed", () => {
    const writeData = buildToggleReleaseTaskWriteData({
      releaseTasks,
      taskId: "task-1",
      taskType: ReleaseTaskType.FUNDING_SECURED,
      completed: true,
      completedByRole: TaskCompletedByRole.PROVIDER,
      completedByPseudonymizedId: "provider-1",
      selectedProviderApplicationId: "provider-app-1",
      isManualAddressPlan: false,
    });

    expect(writeData.staffApplication).toEqual({
      update: { status: ApplicationStatus.ACTION_NEEDED },
    });
    expect(writeData.providerApplications).toEqual({
      update: {
        where: { id: "provider-app-1" },
        data: { status: ApplicationStatus.ACTION_NEEDED },
      },
    });
    expect(writeData.homePlan?.update?.releaseTasks?.update).toMatchObject({
      where: { id: "task-1" },
      data: {
        completed: true,
        completedByRole: TaskCompletedByRole.PROVIDER,
        completedByPseudonymizedId: "provider-1",
      },
    });
  });

  it("clears completion metadata when a task is unchecked", () => {
    const writeData = buildToggleReleaseTaskWriteData({
      releaseTasks: releaseTasks.map((task) =>
        task.taskType === ReleaseTaskType.HOUSING_DATE_REQUESTED
          ? { ...task, completed: true }
          : task,
      ),
      taskId: "task-2",
      taskType: ReleaseTaskType.HOUSING_DATE_REQUESTED,
      completed: false,
      completedByRole: TaskCompletedByRole.STAFF,
      completedByPseudonymizedId: "staff-1",
      selectedProviderApplicationId: null,
      isManualAddressPlan: false,
    });

    expect(writeData.homePlan?.update?.releaseTasks?.update).toEqual({
      where: { id: "task-2" },
      data: {
        completed: false,
        completedAt: null,
        completedByRole: null,
        completedByPseudonymizedId: null,
      },
    });
    expect(writeData.providerApplications).toBeUndefined();
  });

  it("marks staff awaiting release when all tasks are complete and there is no selected provider", () => {
    const writeData = buildToggleReleaseTaskWriteData({
      releaseTasks: releaseTasks.map((task) => ({ ...task, completed: true })),
      taskId: "task-5",
      taskType: ReleaseTaskType.TRANSPORTATION_SECURED,
      completed: true,
      completedByRole: TaskCompletedByRole.STAFF,
      completedByPseudonymizedId: "staff-1",
      selectedProviderApplicationId: null,
      isManualAddressPlan: false,
    });

    expect(writeData.staffApplication).toEqual({
      update: { status: ApplicationStatus.AWAITING_RELEASE },
    });
    expect(writeData.providerApplications).toBeUndefined();
  });

  it("keeps staff waiting when only their own tasks are complete", () => {
    const writeData = buildToggleReleaseTaskWriteData({
      releaseTasks: releaseTasks.map((task) =>
        task.taskType === ReleaseTaskType.FUNDING_SECURED
          ? task
          : { ...task, completed: true },
      ),
      taskId: "task-0",
      taskType: ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING,
      completed: true,
      completedByRole: TaskCompletedByRole.STAFF,
      completedByPseudonymizedId: "staff-1",
      selectedProviderApplicationId: "provider-app-1",
      isManualAddressPlan: false,
    });

    expect(writeData.staffApplication).toEqual({
      update: { status: ApplicationStatus.WAITING },
    });
    expect(writeData.providerApplications).toEqual({
      update: {
        where: { id: "provider-app-1" },
        data: { status: ApplicationStatus.ACTION_NEEDED },
      },
    });
  });

  it("keeps staff action needed on a manual-address plan until every task is complete", () => {
    const writeData = buildToggleReleaseTaskWriteData({
      releaseTasks: releaseTasks.map((task) =>
        task.taskType === ReleaseTaskType.FUNDING_SECURED ||
        task.taskType === ReleaseTaskType.BED_CONFIRMED
          ? task
          : { ...task, completed: true },
      ),
      taskId: "task-5",
      taskType: ReleaseTaskType.TRANSPORTATION_SECURED,
      completed: true,
      completedByRole: TaskCompletedByRole.STAFF,
      completedByPseudonymizedId: "staff-1",
      selectedProviderApplicationId: null,
      isManualAddressPlan: true,
    });

    expect(writeData.staffApplication).toEqual({
      update: { status: ApplicationStatus.ACTION_NEEDED },
    });
  });
});
