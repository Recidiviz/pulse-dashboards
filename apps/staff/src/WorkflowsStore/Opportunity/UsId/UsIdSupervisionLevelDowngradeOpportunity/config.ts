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

import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsIdSupervisionLevelDowngradeOpportunity } from "./UsIdSupervisionLevelDowngradeOpportunity";

export const usIdSupervisionLevelDowngradeConfig: OpportunityConfig<UsIdSupervisionLevelDowngradeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_ID",
    urlSection: "supervisionLevelMismatch",
    label: "Supervision Level Mismatch",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] [is|are] being `,
      opportunityText:
        "supervised at a level that does not match their latest risk score",
      callToAction: "Change their supervision level in Atlas",
    }),
    firestoreCollection: "US_ID-supervisionLevelDowngrade",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    methodologyUrl:
      "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=share_link",
    denialReasons: {
      INCORRECT: "INCORRECT: Risk score listed here is incorrect",
      OVERRIDE:
        "OVERRIDE: Client is being overridden to a different supervision level",
      Other: "Other: please specify a reason",
    },
    sidebarComponents: ["ClientProfileDetails"],
    isAlert: true,
    tooltipEligibilityText: "Eligible for supervision downgrade",
  };
