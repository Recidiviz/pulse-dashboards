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

import { parseLabelConfig } from "~@meetings/tasks/admin/label-studio-annotations";
import {
  type GradedDimensionKey,
  LS_AUTHORITATIVE_RATER_EMAIL,
} from "~@meetings/tasks/admin/label-studio-grades";
import {
  type OverrideGrade,
  withOverriddenGrade,
} from "~@meetings/tasks/admin/label-studio-override";
import type { LabelStudioClient } from "~@meetings/tasks/label-studio-client";
import { invalidateLabelStudioSnapshot } from "~@meetings/trpc/services/admin/label-studio-cache";

/**
 * Records a review's corrected grade in Label Studio as the authoritative
 * rater: it updates that rater's annotation on the task, or creates one if
 * they have none yet. Raters' own annotations are never touched.
 *
 * The client's token belongs to the authoritative rater, and the check below
 * refuses to write as anyone else, since collapseTaskGrades would otherwise
 * not treat the change as an override.
 */
export async function overrideLabelStudioGrade({
  client,
  projectId,
  taskId,
  dimension,
  grade,
}: {
  client: LabelStudioClient;
  projectId: number;
  taskId: number;
  dimension: GradedDimensionKey;
  grade: OverrideGrade;
}): Promise<void> {
  const me = await client.getCurrentUser();
  if (me.email.toLowerCase() !== LS_AUTHORITATIVE_RATER_EMAIL.toLowerCase()) {
    throw new Error(
      `The Label Studio token belongs to ${me.email}, not the authoritative rater`,
    );
  }

  const [labelConfigXml, annotations] = await Promise.all([
    client.getProjectLabelConfig(projectId),
    client.listAnnotationsForTask(taskId),
  ]);
  const config = parseLabelConfig(labelConfigXml);

  // A rater can hold more than one annotation on a task; edit the latest.
  const mine = annotations
    .filter((a) => a.completed_by === me.id && !a.was_cancelled)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];

  try {
    if (mine) {
      await client.updateAnnotation(mine.id, {
        result: withOverriddenGrade({
          config,
          result: mine.result,
          dimension,
          grade,
        }),
      });
    } else {
      await client.createAnnotation(taskId, {
        result: withOverriddenGrade({ config, result: [], dimension, grade }),
      });
    }
  } finally {
    // Even a failed write may have landed; don't serve the old snapshot.
    invalidateLabelStudioSnapshot();
  }
}
