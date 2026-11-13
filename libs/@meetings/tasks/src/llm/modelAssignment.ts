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

import { createHash } from "node:crypto";

import type { AgencyConfig } from "~@meetings/config";

export type ExperimentAssignment = { experimentId?: string; variant?: string };

/**
 * Returns the agency config a run should use, with the experiment's models swapped in for the
 * treatmentPercent of staff whose email hashes into the treatment, plus the group they're in.
 */
export function assignModels(
  agency: AgencyConfig,
  staffEmail: string,
): ExperimentAssignment & { agency: AgencyConfig } {
  const experiment = agency.modelExperiment;
  if (!experiment) {
    return { agency };
  }

  const bucket =
    createHash("sha256")
      .update(`${experiment.id}:${staffEmail.trim().toLowerCase()}`)
      .digest()
      .readUInt32BE(0) % 100;
  const inTreatment = bucket < experiment.treatmentPercent;

  return {
    agency: inTreatment
      ? { ...agency, models: { ...agency.models, ...experiment.models } }
      : agency,
    experimentId: experiment.id,
    variant: inTreatment ? "treatment" : "control",
  };
}
