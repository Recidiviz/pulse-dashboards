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
import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsTnSupervisionLevelDowngradeOpportunity } from "./UsTnSupervisionLevelDowngradeOpportunity";

export const usTnSupervisionLevelDowngradeConfig: OpportunityConfig<UsTnSupervisionLevelDowngradeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_TN",

    urlSection: "supervisionLevelDowngrade",
    label: "Supervision Level Downgrade",
    dynamicEligibilityText:
      "client[|s] may be supervised at a higher level than their latest risk score",
    callToAction: "Change their supervision level in TOMIS.",
    subheading: `This alert helps staff identify people who may be supervised at a higher level than their latest risk score and directs staff to update their supervision level in eTOMIS.
  
Clients are surfaced if their latest risk score does not map to the corresponding supervision level as detailed below:

* Low - Minimum or lower
* Moderate - Medium or lower
* High Property - Max or lower
    `,
    firestoreCollection: "US_TN-supervisionLevelDowngrade",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    methodologyUrl:
      "https://drive.google.com/file/d/1fkqncNb_GNYBvRfOgij4QHw4HEdkkHHz/view",
    sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
    denialReasons: {
      COURT: "COURT: Court mandates supervision at a higher level",
      Other: "Other: please specify a reason",
    },
    isAlert: true,
    eligibleCriteriaCopy: {
      supervisionLevelHigherThanAssessmentLevel: {
        text: "Current supervision level: {{supervisionLevel}}; Last risk score: {{assessmentLevel}} {{#if latestAssessmentDate}}(as of {{date latestAssessmentDate}}){{else}}(assessment date unknown){{/if}}",
      },
    },
    homepagePosition: 4,
  };
