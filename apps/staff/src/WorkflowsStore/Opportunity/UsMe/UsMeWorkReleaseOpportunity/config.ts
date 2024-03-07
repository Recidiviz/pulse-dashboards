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
    denialReasons: {
      "CASE PLAN": "Not compliant with case plan goals",
      PROGRAM:
        "Has not completed, or is not currently participating in, required core programming",
      DECLINE: "Resident declined opportunity to apply for Work Release",
      [OTHER_KEY]: "Other, please specify a reason",
    },
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_ME,
    sidebarComponents: ["Incarceration", "CaseNotes"],
  };
