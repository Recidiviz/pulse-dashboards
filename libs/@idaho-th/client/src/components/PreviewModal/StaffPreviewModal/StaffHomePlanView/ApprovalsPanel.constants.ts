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
  ReleaseDecision,
} from "~@idaho-th/shared";

import type { DecisionOption } from "../approvals";
import type { ApprovalsDecisionField } from "./ApprovalsPanel.utils";

// Rider only: the court's decision.
export const RELEASE_DECISION_OPTIONS: DecisionOption<ReleaseDecision>[] = [
  { value: ReleaseDecision.PROBATION_GRANTED, label: "Probation granted" },
  { value: ReleaseDecision.PROBATION_DENIED, label: "Probation denied" },
];

const HOME_PLAN_APPROVED_OPTION: DecisionOption<HomePlanInvestigationResult> = {
  value: HomePlanInvestigationResult.APPROVED,
  label: "Home plan approved",
};
const HOME_PLAN_REJECTED_OPTION: DecisionOption<HomePlanInvestigationResult> = {
  value: HomePlanInvestigationResult.REJECTED,
  label: "Home plan rejected",
};

export const TERMER_HOME_PLAN_INVESTIGATION_OPTIONS: DecisionOption<HomePlanInvestigationResult>[] =
  [
    HOME_PLAN_APPROVED_OPTION,
    HOME_PLAN_REJECTED_OPTION,
    {
      value: HomePlanInvestigationResult.NOT_APPLICABLE,
      label: "Not applicable",
    },
  ];

export const RIDER_HOME_PLAN_INVESTIGATION_OPTIONS: DecisionOption<HomePlanInvestigationResult>[] =
  [HOME_PLAN_APPROVED_OPTION, HOME_PLAN_REJECTED_OPTION];

export const RELEASE_DECISION_RADIO_NAME = "releaseDecision";
export const HOME_PLAN_INVESTIGATION_RADIO_NAME = "homePlanInvestigation";

/** Toast copy naming the decision group that was just saved. */
export const APPROVALS_SAVED_TOAST: Record<ApprovalsDecisionField, string> = {
  releaseDecision: "Release decision saved.",
  homePlanInvestigation: "Home plan investigation saved.",
};
