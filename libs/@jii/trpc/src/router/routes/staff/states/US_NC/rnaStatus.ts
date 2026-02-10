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

import { JsonValue } from "@prisma/client/runtime/client";
import isEmpty from "lodash-es/isEmpty";
import { z } from "zod";

export const rnaAssessmentStatus = z.enum([
  "UPCOMING",
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETE",
]);

export type RNAAssessmentStatus = z.infer<typeof rnaAssessmentStatus>;

type RNARow = {
  completed: boolean;
  answers: JsonValue;
};

export function getStatusOfExistingRNA(
  currentRNA: RNARow,
): RNAAssessmentStatus {
  if (currentRNA.completed) return rnaAssessmentStatus.enum.COMPLETE;

  if (!isEmpty(currentRNA.answers)) return rnaAssessmentStatus.enum.IN_PROGRESS;

  return rnaAssessmentStatus.enum.NOT_STARTED;
}
