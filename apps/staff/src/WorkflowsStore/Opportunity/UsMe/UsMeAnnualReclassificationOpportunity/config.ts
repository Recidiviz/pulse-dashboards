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
import { UsMeAnnualReclassificationOpportunity } from "./UsMeAnnualReclassificationOpportunity";

export const usMeAnnualReclassificationConfig: OpportunityConfig<UsMeAnnualReclassificationOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_ME",
    urlSection: "annualReclassification",
    label: "Annual / Semi-Annual Reclassification",
    featureVariant: "usMeAnnualReclassificationReview",
    initialHeader:
      "Search for caseloads to review residents who are up for " +
      "an annual or semi-annual reclassification meeting.",
    dynamicEligibilityText:
      "resident[|s] may be due for an annual or semi-annual reclassification",
    callToAction:
      "Search for caseloads to review residents who are up for " +
      "an annual or semi-annual reclassification meeting.",
    firestoreCollection: "US_ME-reclassificationReviewReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 180,
    },
    denialReasons: {
      COMPLETE: "Reclassification is already completed",
      ERROR: "Reclassification date is incorrect",
      OTHER_CORIS: "Other, please add a case note in CORIS",
    },
    methodologyUrl:
      "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view?usp=drive_link",
    sidebarComponents: ["Incarceration"],
    eligibleCriteriaCopy: {
      usMeIncarcerationPastRelevantClassificationDate: {
        text: `At least {{#if (eq record.usMeIncarcerationPastRelevantClassificationDate.reclassType "ANNUAL")}}6{{else}}12{{/if}} months since last reclassification`,
        tooltip:
          "Residents:\na. with more than six (6) years remaining to serve based on current custody release date shall be reviewed annually; and\nb. with six (6) years or less remaining to serve based on current custody release date shall be reviewed every six (6) months.",
      },
    },
    ineligibleCriteriaCopy: {
      usMeIncarcerationPastRelevantClassificationDate: {
        text: "Will be due for a reclassification in the next month",
        tooltip:
          "Residents:\na. with more than six (6) years remaining to serve based on current custody release date shall be reviewed annually; and\nb. with six (6) years or less remaining to serve based on current custody release date shall be reviewed every six (6) months.",
      },
    },
  };
