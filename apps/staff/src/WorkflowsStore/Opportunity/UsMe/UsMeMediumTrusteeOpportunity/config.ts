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

import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsMeMediumTrusteeOpportunity } from "./UsMeMediumTrusteeOpportunity";

export const usMeMediumTrusteeConfig: OpportunityConfig<UsMeMediumTrusteeOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_ME",
    urlSection: "mediumTrustee",
    label: "Medium Trustee",
    featureVariant: "usMeCustodyLevelReview",
    initialHeader:
      "Search for case managers below to review residents on their caseload " +
      "who may be eligible for Medium Trustee Status.",
    dynamicEligibilityText:
      "resident[|s] may be eligible for Medium Trustee Status",
    callToAction:
      "Search for case managers below to review residents on their caseload " +
      "who may be eligible for Medium Trustee Status.",
    firestoreCollection: "US_ME-mediumTrusteeReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 180,
    },
    denialReasons: {
      BEHAVIOR: "Had not demonstrated prosocial behavior",
      PROGRAM: "Has not completed required core programming",
      DECLINE: "Resident declined Medium Trustee Status",
      OTHER_CORIS: "Other, please add a case note in CORIS",
    },
    methodologyUrl:
      "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view?usp=drive_link",
    sidebarComponents: ["Incarceration", "CaseNotes"],
    eligibleCriteriaCopy: {
      usMeCustodyLevelIsMedium: {
        text: "Currently on medium custody",
        tooltip:
          "The resident must be classified medium custody to be " +
          "approved for trustee status",
      },
      usMeFiveOrMoreYearsRemainingOnSentence: {
        text: "{{monthsUntil opportunity.person.releaseDate}} months remaining on sentence",
        tooltip:
          "Residents at medium custody level approved for trustee status are " +
          "residents who have at least five (5) years remaining on their sentence",
      },
      usMeNoViolationFor5Years: {
        text: "No disciplines in the last 5 years",
        tooltip:
          "Residents at medium custody level approved for trustee status are " +
          "residents who have been discipline free for at least five (5) years",
      },
    },
  };
