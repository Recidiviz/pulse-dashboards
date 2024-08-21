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

import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsCaSupervisionLevelDowngradeOpportunity } from "./UsCaSupervisionLevelDowngradeOpportunity";

export const usCaSupervisionLevelDowngradeConfig: OpportunityConfig<UsCaSupervisionLevelDowngradeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_CA",
    urlSection: "supervisionLevelDowngrade",
    label: "Supervision Level Downgrade",
    dynamicEligibilityText:
      "client[|s] may be eligible for a supervision level downgrade",
    callToAction:
      "Review clients who may be eligible for a Supervision Level Downgrade and complete the paperwork.",
    firestoreCollection: "US_CA-supervisionLevelDowngrade",
    methodologyUrl: "TBD",
    denialReasons: {
      Other: "Other: please specify a reason",
    },
    isAlert: false,
    tooltipEligibilityText: "Eligible for supervision downgrade",
    sidebarComponents: ["ClientProfileDetails"],
    homepagePosition: 1,
  };
