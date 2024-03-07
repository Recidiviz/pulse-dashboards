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

import { OTHER_KEY } from "../../../utils";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { generateTabs } from "../../utils/tabUtils";
import { UsTnSupervisionLevelDowngradeOpportunity } from "./UsTnSupervisionLevelDowngradeOpportunity";

export const usTnSupervisionLevelDowngradeConfig: OpportunityConfig<UsTnSupervisionLevelDowngradeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_TN",

    urlSection: "supervisionLevelDowngrade",
    label: "Supervision Level Downgrade",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be `,
      opportunityText:
        "supervised at a higher level than their latest risk score",
      callToAction: "Change their supervision level in TOMIS.",
    }),
    firestoreCollection: "US_TN-supervisionLevelDowngrade",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    tabOrder: generateTabs({ isAlert: true }),
    methodologyUrl:
      "https://drive.google.com/file/d/1fkqncNb_GNYBvRfOgij4QHw4HEdkkHHz/view",
    sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
    denialReasons: {
      COURT: "COURT: Court mandates supervision at a higher level",
      [OTHER_KEY]: "Other: please specify a reason",
    },
    isAlert: true,
  };
