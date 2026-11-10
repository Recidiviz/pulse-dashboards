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

import { createOptimisticReleaseTaskToggle } from "../optimisticReleaseTasks";

describe("createOptimisticReleaseTaskToggle", () => {
  function createQueryUtils(initialHomePlan: {
    releaseTasks: {
      completedCount: number;
      tasks: { taskType: string; completed: boolean }[];
    } | null;
  }) {
    let data = initialHomePlan as typeof initialHomePlan | undefined;
    return {
      cancel: vi.fn(async () => undefined),
      getData: vi.fn(() => data),
      setData: vi.fn(
        (
          _input: { applicationId: string },
          updater: typeof data | ((old: typeof data) => typeof data),
        ) => {
          data = typeof updater === "function" ? updater(data) : updater;
        },
      ),
      getLatest: () => data,
    };
  }

  it("optimistically toggles the matching task and recalculates completedCount", async () => {
    const queryUtils = createQueryUtils({
      releaseTasks: {
        completedCount: 1,
        tasks: [
          { taskType: "BED_CONFIRMED", completed: true },
          { taskType: "TRANSPORTATION_SECURED", completed: false },
        ],
      },
    });

    const handlers = createOptimisticReleaseTaskToggle(queryUtils as never);
    const context = await handlers.onMutate({
      applicationId: "app-1",
      taskType: "TRANSPORTATION_SECURED" as never,
      completed: true,
    });

    expect(queryUtils.cancel).toHaveBeenCalledWith({ applicationId: "app-1" });
    expect(queryUtils.getLatest()?.releaseTasks).toEqual({
      completedCount: 2,
      tasks: [
        { taskType: "BED_CONFIRMED", completed: true },
        { taskType: "TRANSPORTATION_SECURED", completed: true },
      ],
    });
    expect(context.previousHomePlan?.releaseTasks?.completedCount).toBe(1);
  });

  it("does not change cache when releaseTasks are missing", async () => {
    const queryUtils = createQueryUtils({ releaseTasks: null });
    const handlers = createOptimisticReleaseTaskToggle(queryUtils as never);

    await handlers.onMutate({
      applicationId: "app-1",
      taskType: "BED_CONFIRMED" as never,
      completed: true,
    });

    expect(queryUtils.getLatest()).toEqual({ releaseTasks: null });
  });

  it("rolls back to the previous home plan on mutation error", async () => {
    const previous = {
      releaseTasks: {
        completedCount: 0,
        tasks: [{ taskType: "BED_CONFIRMED", completed: false }],
      },
    };
    const queryUtils = createQueryUtils(previous);
    const handlers = createOptimisticReleaseTaskToggle(queryUtils as never);

    handlers.onError(new Error("fail"), { applicationId: "app-1" } as never, {
      previousHomePlan: previous as never,
    });

    expect(queryUtils.setData).toHaveBeenCalledWith(
      { applicationId: "app-1" },
      previous,
    );
  });

  it("does not roll back when there is no context", () => {
    const queryUtils = createQueryUtils({ releaseTasks: null });
    const handlers = createOptimisticReleaseTaskToggle(queryUtils as never);
    handlers.onError(
      new Error("x"),
      { applicationId: "app-1" } as never,
      undefined,
    );
    expect(queryUtils.setData).not.toHaveBeenCalled();
  });
});
