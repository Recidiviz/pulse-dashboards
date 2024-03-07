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
import { CompliantReportingOpportunity } from "./CompliantReportingOpportunity";

export const usTnCompliantReportingConfig: OpportunityConfig<CompliantReportingOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_TN",
    urlSection: "compliantReporting",
    label: "Compliant Reporting",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be eligible for `,
      opportunityText: "Compliant Reporting",
      callToAction:
        "Review and refer eligible clients for Compliant Reporting.",
    }),
    firestoreCollection: "compliantReportingReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    denialReasons: {
      DECF: "DECF: No effort to pay fine and costs",
      DECR: "DECR: Criminal record",
      DECT: "DECT: Insufficient time in supervision level",
      DEDF: "DEDF: No effort to pay fees",
      DEDU: "DEDU: Serious compliance problems ",
      DEIJ: "DEIJ: Not allowed per court",
      DEIR: "DEIR: Failure to report as instructed",
      [OTHER_KEY]: "Other, please specify a reason",
    },
    methodologyUrl:
      "https://drive.google.com/file/d/1YNAUTViqg_Pgt15KsZPUiNG11Dh2TTiB/view",
    sidebarComponents: [
      "SpecialConditions",
      "ClientProfileDetails",
      "ClientHousing",
      "FinesAndFees",
    ],
  };
