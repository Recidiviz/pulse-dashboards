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

import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { SUB_STAGE_LABELS } from "../constants/common";
import {
  Alert,
  ApplicationStage,
  ApplicationSubStage,
  ReleaseTaskProgress,
} from "../interfaces/common";

export function getSubStageLabel(
  data: {
    stage: ApplicationStage;
    // Null on staff drafts (stage DRAFT) — the backend stores no substage.
    subStage?: ApplicationSubStage | null;
    releaseTaskProgress?: ReleaseTaskProgress | null;
  },
  variant: "default" | "detailed" = "default",
): string {
  const { stage, subStage, releaseTaskProgress } = data;

  if (stage === APPLICATION_STAGE.RELEASE) {
    const suffix =
      variant === "detailed" ? "Release Tasks Complete" : "Tasks Complete";
    const { completedCount = 0, totalCount = 0 } = releaseTaskProgress ?? {};
    return `${completedCount} of ${totalCount} ${suffix}`;
  }

  if (!subStage) return "";
  return SUB_STAGE_LABELS[subStage] ?? subStage;
}

export function formatReleaseDateChange(
  deltaDays: number,
  { withReleaseDatePrefix = false } = {},
): string {
  const magnitude = Math.abs(deltaDays);
  const unit = magnitude === 1 ? "day" : "days";
  const direction = deltaDays > 0 ? "later" : "earlier";

  return withReleaseDatePrefix
    ? `Release Date moved ${magnitude} ${unit} ${direction}`
    : `Moved ${magnitude} ${unit} ${direction}`;
}

/** The alert of the given type, narrowed to that type's metadata. */
export function findAlert<T extends Alert["type"]>(
  alerts: Alert[] | undefined,
  type: T,
): Extract<Alert, { type: T }> | undefined {
  return alerts?.find(
    (alert): alert is Extract<Alert, { type: T }> => alert.type === type,
  );
}
