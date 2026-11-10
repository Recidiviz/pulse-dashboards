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

import type { ActiveReleaseTaskType, ReleaseTaskType } from "~@idaho-th/shared";
import { RELEASE_TASK_DEFS, RELEASE_TASK_DETAILS } from "~@idaho-th/shared";

import type {
  ReleaseTaskDetailConfig,
  ReleaseTaskDetailsOptions,
  ReleaseTaskRow,
} from "./types";

/**
 * Builds the `details` prop for every detail-bearing task, so a view never has
 * to list the task types by hand. Adding a task to RELEASE_TASK_DETAILS is
 * enough for it to show up in both the staff and provider views.
 */
export const buildReleaseTaskDetails = (
  tasks: ReleaseTaskRow[] | null | undefined,
  { viewerRole, canToggle, onChange }: ReleaseTaskDetailsOptions,
): Partial<Record<ReleaseTaskType, ReleaseTaskDetailConfig>> => {
  const details: Partial<Record<ReleaseTaskType, ReleaseTaskDetailConfig>> = {};

  for (const [key, detail] of Object.entries(RELEASE_TASK_DETAILS)) {
    const taskType = key as ActiveReleaseTaskType;
    const task = tasks?.find((row) => row.taskType === taskType);
    const editable =
      canToggle && RELEASE_TASK_DEFS[taskType].ownerRole === viewerRole;

    details[taskType] =
      detail.type === "text"
        ? {
            type: "text",
            value: task?.note ?? "",
            editable,
            onChange:
              onChange &&
              ((note) => onChange(taskType, { type: "text", note })),
          }
        : {
            type: "date",
            value: task?.date ?? null,
            editable,
            onChange:
              onChange &&
              ((date) => onChange(taskType, { type: "date", date })),
          };
  }

  return details;
};
