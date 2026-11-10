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

import { ORDERED_RELEASE_TASK_TYPES } from "../constants/homePlan";
import {
  APPLICATION_STAGE,
  APPLICATION_SUB_STAGE_LABELS,
  type ApplicationStage,
} from "../constants/housingApplication.record";

export type ReleaseTaskProgress = {
  completedCount: number;
  totalCount: number;
};

/**
 * Only meaningful during the RELEASE stage; returns null for every other
 * stage since release tasks aren't tracked/shown until then.
 *
 * completedReleaseTaskCount is undefined when the application has no
 * homePlan yet — that's a real, expected state (not a data integrity
 * issue), and is treated as 0 completed tasks.
 */
export function computeReleaseTaskProgress(
  stage: ApplicationStage,
  completedReleaseTaskCount: number | undefined,
): ReleaseTaskProgress | null {
  if (stage !== APPLICATION_STAGE.RELEASE) {
    return null;
  }

  return {
    completedCount: completedReleaseTaskCount ?? 0,
    totalCount: ORDERED_RELEASE_TASK_TYPES.length,
  };
}

export function formatReleaseTaskProgress({
  completedCount,
  totalCount,
}: ReleaseTaskProgress): string {
  const taskLabel = totalCount === 1 ? "Task" : "Tasks";
  return `${completedCount} of ${totalCount} ${taskLabel} Complete`;
}

/**
 * Resolves the text shown beneath a stage: release-task progress during the
 * release stage (when progress is provided), otherwise the human-readable
 * sub-stage label, falling back to the raw value if it has no mapped label.
 */
export function formatSubStageText(
  subStage: string,
  releaseTaskProgress: ReleaseTaskProgress | null | undefined,
): string {
  if (releaseTaskProgress) {
    return formatReleaseTaskProgress(releaseTaskProgress);
  }

  return (
    APPLICATION_SUB_STAGE_LABELS[
      subStage as keyof typeof APPLICATION_SUB_STAGE_LABELS
    ] ?? subStage
  );
}
