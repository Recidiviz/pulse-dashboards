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

import {
  HomePlanInvestigationResult,
  ParoleCommissionDecision,
  ReleaseDecision,
} from "~@idaho-th/shared/constants/homePlan";

// Only one release-side decision is ever set: the Parole Commission's for a
// Termer/PV, the court's (releaseDecision) for a Rider.
export type ApprovalsGateInput = {
  paroleCommissionDecision: ParoleCommissionDecision | null;
  releaseDecision: ReleaseDecision | null;
  homePlanInvestigation: HomePlanInvestigationResult | null;
  isRider: boolean;
  hasHomePlan: boolean;
};

export type ApprovalsOutcome =
  | {
      type: "CLOSE";
      closedOutcome: "RELEASE_DENIED" | "HOUSING_PLAN_REJECTED";
    }
  | { type: "ADVANCE" }
  | { type: "WAIT" };

const CLEARED_PAROLE_DECISIONS = new Set<ParoleCommissionDecision>([
  ParoleCommissionDecision.PAROLE_GRANTED,
  ParoleCommissionDecision.NOT_APPLICABLE,
]);

const CLEARED_TERMER_INVESTIGATIONS = new Set<HomePlanInvestigationResult>([
  HomePlanInvestigationResult.APPROVED,
  HomePlanInvestigationResult.NOT_APPLICABLE,
]);

/**
 * The one release gate, shared so the staff confirmation modal always promises
 * what the server will do. Negatives are evaluated first so that the outcome is
 * the same whichever order the CM recorded the decisions in — a denial is never
 * overridden by an earlier positive decision in the other group.
 *
 *   advance (Termer/PV) ⇔ pcd ∈ {GRANTED, N/A} ∧ hpi ∈ {APPROVED, N/A} ∧ homePlan
 *   advance (Rider)     ⇔ releaseDecision = PROBATION_GRANTED ∧ hpi = APPROVED
 */
export function deriveApprovalsOutcome(
  input: ApprovalsGateInput,
): ApprovalsOutcome {
  const releaseDenied = input.isRider
    ? input.releaseDecision === ReleaseDecision.PROBATION_DENIED
    : input.paroleCommissionDecision === ParoleCommissionDecision.PAROLE_DENIED;

  if (releaseDenied) {
    return { type: "CLOSE", closedOutcome: "RELEASE_DENIED" };
  }

  if (input.homePlanInvestigation === HomePlanInvestigationResult.REJECTED) {
    return { type: "CLOSE", closedOutcome: "HOUSING_PLAN_REJECTED" };
  }

  const canAdvance = input.isRider
    ? input.releaseDecision === ReleaseDecision.PROBATION_GRANTED &&
      input.homePlanInvestigation === HomePlanInvestigationResult.APPROVED
    : input.hasHomePlan &&
      input.paroleCommissionDecision != null &&
      CLEARED_PAROLE_DECISIONS.has(input.paroleCommissionDecision) &&
      input.homePlanInvestigation != null &&
      CLEARED_TERMER_INVESTIGATIONS.has(input.homePlanInvestigation);

  return canAdvance ? { type: "ADVANCE" } : { type: "WAIT" };
}
