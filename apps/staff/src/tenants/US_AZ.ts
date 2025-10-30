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

import { TenantConfig } from "../core/models/types";
import { INSIGHTS_PAGES } from "../core/views";
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";

const US_AZ_CONFIG = {
  name: "Arizona",
  stateCode: "AZ",
  domain: "corrections.az.gov",
  availableStateCodes: [dashboard.US_AZ],
  enableUserRestrictions: false,
  supervisionDisplayIdCopy: "ADC number",
  facilitiesDisplayIdCopy: "ADC number",
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsMethodologyUrl:
    "https://docs.google.com/document/d/e/2PACX-1vQdaopTwajMs7exIRMLm6OtZQuPXI_gOb7W96CHNcpJ0Wez5a2qd3Ag_mpOpOcHobXo1FOnmnfF2JnL/pub",
  workflowsSystemConfigs: {
    INCARCERATION: {
      search: [
        {
          searchType: "INCARCERATION_OFFICER",
          searchField: ["officerId"],
          searchTitle: "COIII",
          searchTitleIgnoreCase: true,
        },
        {
          searchType: "FACILITY",
          searchField: ["facilityId"],
          searchTitle: "facility",
          restrictedToFeatureVariant: "usAzFacilitySearch",
        },
      ],
    },
    SUPERVISION: {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "CRO",
          searchTitleIgnoreCase: true,
        },
      ],
    },
  },
  navigation: {
    insights: [INSIGHTS_PAGES.supervision],
    workflows: ["home", "clients", "residents"],
  },
  incarcerationStaffTitleOverride: "COIII",
  releaseDateCopyOverride: "SED",
  insightsNumDaysWithoutLogin: 14,
  workflowsOpportunityFilterConfig: {
    filters: [
      {
        title: "Agreement Form Signature Status",
        field: "Agreement Form Signature Status",
        type: "opportunity",
        options: [
          {
            value: "Signed",
          },
          {
            value: "Not Signed",
          },
          {
            value: "Refusal to Sign",
          },
          {
            value: "Declined 180+ Days Ago",
          },
        ],
      },
      {
        title: "Mandatory Literacy Status",
        field: "Mandatory Literacy Enrollment Information",
        type: "opportunity",
        options: [
          {
            value: "Currently Enrolled",
          },
          { value: "Completed" },
        ],
      },
      {
        title: "Home Plan Information",
        field: "Home Plan Information",
        type: "opportunity",
        options: [
          {
            value: "Home Plan Not Started",
          },
          {
            value: "Home Plan Approved",
          },
          {
            value: "Home Plan Cancelled",
          },
          {
            value: "Home Plan In Progress",
          },
          {
            value: "Denied",
          },
          {
            value: "Return to CC Supervisor",
          },
          {
            value: "Return to COIII",
          },
        ],
      },
    ],
  },
} satisfies TenantConfig<"US_AZ">;

export default US_AZ_CONFIG;
