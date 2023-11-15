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
import { UsMeWorkReleaseOpportunity } from "./UsMeWorkReleaseOpportunity";

export const usMeWorkReleaseConfig: OpportunityConfig<UsMeWorkReleaseOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_ME",
    urlSection: "workRelease",
    label: "Work Release",
    featureVariant: "usMeWorkRelease",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be `,
      opportunityText:
        "eligible for the Community Transition Program (Work Release)",
      callToAction:
        "Search for case managers above to review residents on their caseload who are approaching " +
        "Work Release eligibility and complete application paperwork.",
    }),
    firestoreCollection: "US_ME-workReleaseReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 180,
    },
  };
