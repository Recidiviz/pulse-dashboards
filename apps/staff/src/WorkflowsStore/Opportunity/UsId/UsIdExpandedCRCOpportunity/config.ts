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
import { UsIdExpandedCRCOpportunity } from "./UsIdExpandedCRCOpportunity";

export const usIdExpandedCRCConfig: OpportunityConfig<UsIdExpandedCRCOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_ID",
    urlSection: "expandedCRC",
    label: "Expanded CRC Program",
    featureVariant: "usIdExpandedCRC",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} resident[|s] [is|are] `,
      opportunityText:
        "eligible for transfer to Expanded Community Reentry Centers.",
      callToAction:
        "Review clients who may be eligible for a transfer to XCRC and start their paperwork in ATLAS.",
    }),
    firestoreCollection: "US_ID-expandedCRCReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 30,
    },
    denialReasons: {
      MEDICAL: "Was not approved by an IDOC medical provider",
      PENDING:
        "There are pending felony charges or felony investigations in which the resident is a suspect",
      BEHAVIOR: "Resident has had poor institutional behavior",
      PROGRAM: "Missing required facility programming",
      TRUST: "Resident does not have $500.00 in their resident trust account",
      EMPLOYMENT:
        "Resident is not currently employed full-time or engaged in or accepted to a full-time " +
        "Idaho educational program approved by the IDOC",
      CLASS_A_OR_B:
        "Has class A or B disciplinary reports in the past six months",
      [OTHER_KEY]: "Other, please specify a reason",
    },
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_ID,
    sidebarComponents: ["Incarceration", "UsIdPastTwoYearsAlert", "CaseNotes"],
  };
