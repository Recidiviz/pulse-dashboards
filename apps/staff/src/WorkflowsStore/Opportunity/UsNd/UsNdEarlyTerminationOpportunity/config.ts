// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import simplur from "simplur";

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OTHER_KEY } from "../../../utils";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsNdEarlyTerminationOpportunity } from "./UsNdEarlyTerminationOpportunity";

export const usNdEarlyTerminationConfig: OpportunityConfig<UsNdEarlyTerminationOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_ND",
    urlSection: "earlyTermination",
    label: "Early Termination",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be eligible for `,
      opportunityText: "early termination",
      callToAction:
        "Review clients eligible for early termination and download the paperwork to file with the Court.",
    }),
    firestoreCollection: "earlyTerminationReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    hideDenialRevert: true,
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_ND,
    sidebarComponents: ["ClientProfileDetails"],
    denialReasons: {
      "INT MEASURE":
        "Under active intermediate measure as a result of 1+ violations",
      "CASE PLAN NC": "Has not completed case plan goals",
      SO: "Being supervised for sex offense",
      DOP: "Being supervised for an offense resulting in the death of a person",
      "FINES/FEES": "Willfull nonpayment of fines/fees despite ability to pay",
      INC: "Incarcerated on another offense",
      "SA DECLINE": "State's Attorney permanently declined consideration",
      [OTHER_KEY]: "Other, please specify a reason",
    },
  };
