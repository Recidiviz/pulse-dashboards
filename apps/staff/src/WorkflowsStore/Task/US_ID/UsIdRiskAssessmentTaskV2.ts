// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import UsIdTaskBase from "./UsIdTaskBase";

class UsIdRiskAssessmentTaskV2 extends UsIdTaskBase<"usIdRiskAssessment"> {
  displayName = "Risk Assessment";
  vitalsMetricId = "timely_risk_assessment" as const;
  taskAction = "assessed";

  get riskLevel(): string | undefined {
    const { riskLevel } = this.details;
    if (!riskLevel) return;
    return riskLevel;
  }

  get additionalDetails() {
    const { lastActionTaskText, riskLevel } = this;
    if (!lastActionTaskText || !riskLevel) return super.additionalDetails;

    return `${super.additionalDetails}
    Risk Level: ${this.riskLevel}
    `;
  }
}

export default UsIdRiskAssessmentTaskV2;
