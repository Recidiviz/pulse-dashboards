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

import type { ReleaseTaskType } from "~@idaho-th/shared";

type ReleaseTaskInput = {
  applicationId: string;
  taskType: ReleaseTaskType;
  completed: boolean;
};

type HomePlanWithReleaseTasks =
  | {
      releaseTasks: {
        completedCount: number;
        tasks: { taskType: ReleaseTaskType; completed: boolean }[];
      } | null;
    }
  | undefined;

type ReleaseTaskQueryUtils<THomePlan extends HomePlanWithReleaseTasks> = {
  cancel: (input: { applicationId: string }) => Promise<void>;
  getData: (input: { applicationId: string }) => THomePlan;
  setData: (
    input: { applicationId: string },
    updater: THomePlan | ((old: THomePlan) => THomePlan),
  ) => void;
};

export function createOptimisticReleaseTaskToggle<
  THomePlan extends HomePlanWithReleaseTasks,
>(queryUtils: ReleaseTaskQueryUtils<THomePlan>) {
  return {
    onMutate: async ({
      applicationId,
      taskType,
      completed,
    }: ReleaseTaskInput) => {
      await queryUtils.cancel({ applicationId });
      const previousHomePlan = queryUtils.getData({ applicationId });

      queryUtils.setData({ applicationId }, (old) => {
        if (!old?.releaseTasks) return old;

        const tasks = old.releaseTasks.tasks.map((task) =>
          task.taskType === taskType ? { ...task, completed } : task,
        );

        return {
          ...old,
          releaseTasks: {
            ...old.releaseTasks,
            tasks,
            completedCount: tasks.filter((task) => task.completed).length,
          },
        };
      });

      return { previousHomePlan };
    },
    onError: (
      _error: unknown,
      { applicationId }: ReleaseTaskInput,
      context: { previousHomePlan: THomePlan } | undefined,
    ) => {
      if (context) {
        queryUtils.setData({ applicationId }, context.previousHomePlan);
      }
    },
  };
}
