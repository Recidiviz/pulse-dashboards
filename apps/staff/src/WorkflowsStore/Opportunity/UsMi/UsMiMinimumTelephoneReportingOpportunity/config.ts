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
import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsMiMinimumTelephoneReportingOpportunity } from "./UsMiMinimumTelephoneReportingOpportunity";

export const usMiMinimumTelephoneReportingConfig: OpportunityConfig<UsMiMinimumTelephoneReportingOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_MI",
    urlSection: "minimumTelephoneReporting",
    label: "Minimum Telephone Reporting",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be eligible for downgrade to a `,
      opportunityText: "minimum telephone reporting",
      callToAction:
        "Review clients who meet the requirements for minimum telephone reporting and change supervision levels in OMNI.",
    }),
    firestoreCollection: "US_MI-minimumTelephoneReporting",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    eligibilityDateText:
      "Earliest Eligibility Date for Minimum Telephone Reporting",
    denialReasons: {
      FIREARM:
        "Serving on a felony offense involving possession or use of a firearm",
      "SPEC COURT":
        "Enrolled in a special issue court (e.g. Drug Treatment Court, Recovery Court, MH Court, Veterans Court)",
      RPOSN:
        "Designated as Reentry Project for Offenders with Special Needs (RPOSN - D-47)",
      "HIGH PROFILE":
        "Currently serving for an offense that resulted in the death of a person or a high-profile case with adverse community reaction (requires Max or higher based on risk score)",
      JUDGE: "County Judge declined client for consideration",
      Other: "Other, please specify a reason",
    },
    sidebarComponents: ["ClientProfileDetails", "EligibilityDate"],
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MI,
  };
