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
import { UsIdCRCWorkReleaseOpportunity } from "./UsIdCRCWorkReleaseOpportunity";

export const usIdCRCWorkReleaseConfig: OpportunityConfig<UsIdCRCWorkReleaseOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_ID",
    urlSection: "CRCWorkRelease",
    label: "Work-release at Community Reentry Centers",
    featureVariant: "usIdCRC",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} resident[|s] may be `,
      opportunityText:
        "eligible for work-release at a Community Reentry Center",
      callToAction:
        "Review residents who may be eligible for work-release to a CRC and start their paperwork in ATLAS.",
    }),
    firestoreCollection: "US_ID-CRCWorkReleaseReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_ID,
    denialReasons: {
      MEDICAL: "Was not approved by an IDOC medical provider",
      PENDING:
        "There are pending felony charges or felony investigations in which the resident is a suspect",
      BEHAVIOR: "Resident has had poor institutional behavior",
      PROGRAM: "Missing required facility programming",
      [OTHER_KEY]: "Other, please specify a reason",
    },
    sidebarComponents: ["Incarceration", "UsIdPastTwoYearsAlert", "CaseNotes"],
  };
