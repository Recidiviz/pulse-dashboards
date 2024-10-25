// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { OpportunityRequirement } from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsOrEarnedDischargeSentenceConfiguration extends ApiOpportunityConfiguration {
  get omsCriteriaHeader() {
    return "Eligibility Criteria Requirements Verified via DOC400";
  }

  get nonOMSCriteriaHeader() {
    return "Additional Eligibility Requirements Manually Verified ";
  }

  get nonOMSCriteria(): OpportunityRequirement[] {
    return [
      {
        text: "No disqualifying sentence enhancements not entered in the DOC400",
        tooltip:
          "Is not on supervision for a sentencing enhancement imposed under the provisions of ORS 161.610, 161.725, 161.735, 164.061, 475.907, 475.925, or 475.930; as well as ORS 137.635 for Probation Burglary I ",
      },
      {
        text: "No court violations in the past 6 months",
        tooltip:
          "Has not been found in violation by the court in the immediate 6 months prior to review",
      },
      {
        text: "Not convicted of a crime that occurred while on supervision for the case under review (not found in DOC400/CIS)",
        tooltip:
          "Has not been convicted of a crime (felony or misdemeanor) that occurred while on supervision for the case under review",
      },
      {
        text: "Has fully paid any restitution and compensatory fine or is current on payment plan",
        tooltip:
          "Has either fully paid any restitution and compensatory fine ordered by the court, or established a payment schedule through the court or appropriate supervising authority consistent with ORS 137.106, and is current in their payment obligations",
      },
      {
        text: "Has completed any specialty court programs or treatment programs",
        tooltip:
          "Has completed any specialty court program and treatment programs with set durations or timeframes, and has consistently participated in any ongoing treatment programs",
      },
      {
        text: "In compliance with supervision conditions and case plan",
        tooltip:
          "Is in compliance with conditions of supervision and any applicable supervision case plan",
      },
    ];
  }
}
