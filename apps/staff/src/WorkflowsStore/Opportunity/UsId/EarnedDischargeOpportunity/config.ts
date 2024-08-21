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
import { EarnedDischargeOpportunity } from "./EarnedDischargeOpportunity";

export const usIdEarnedDischargeConfig: OpportunityConfig<EarnedDischargeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_ID",
    urlSection: "earnedDischarge",
    label: "Earned Discharge",
    dynamicEligibilityText: "client[|s] may be eligible for earned discharge",
    callToAction: `Review clients who may be eligible for Earned Discharge and complete a pre-filled request form.`,
    subheading:
      "This alert helps staff identify people who may be eligible for earned discharge and directs staff to complete the pre-filled request form.",
    firestoreCollection: "US_ID-earnedDischargeReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    methodologyUrl:
      "http://forms.idoc.idaho.gov/WebLink/0/edoc/282369/Termination%20of%20Probation%20or%20Parole%20Supervision.pdf",
    denialReasons: {
      SCNC: "Not compliant with special conditions",
      FFR: "Failure to make payments towards fines, fees, and restitution despite ability to pay",
      INTERLOCK: "Has an active interlock device",
      NCIC: "Did not pass NCIC check",
      PCD: "Parole Commission permanently denied early discharge request",
      CD: "Court permanently denied early discharge request",
      MIS: "Has had a violent misdemeanor conviction in the past 12 months",
      Other: "Other, please specify a reason",
    },
    sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
    tooltipEligibilityText: "Eligible for Earned Discharge",
    eligibleCriteriaCopy: {
      usIdLsirLevelLowModerateForXDays: {
        text: '{{#if (eq "LOW" riskLevel)}}Currently low risk with no increase in risk level in past 90 days{{else}}Currently moderate risk with no increase in risk level in past 360 days{{/if}}',
        tooltip:
          "Assessed at low risk level on LSI-R with no risk increase in past 90 days or moderate risk level on LSI-R with no risk increase in past 360 days",
      },
      negativeDaWithin90Days: {
        text: "Negative UA within past 90 days",
        tooltip:
          "Negative UA within past 90 days, unless the client lacks a history of drug/alcohol abuse or has been supervised at low risk for more than one year",
      },
      usIdIncomeVerifiedWithin3Months: {
        text: "Verified compliant employment",
        tooltip:
          "Verified employment status, full-time student, or adequate lawful income from non-employment sources have been confirmed within past 3 months",
      },
      noFelonyWithin24Months: {
        text: "No felony convictions in past 24 months",
        tooltip:
          "Has not committed a felony while on probation or parole in past 24 months",
      },
      noViolentMisdemeanorWithin12Months: {
        text: "No violent misdemeanor convictions in past 12 months",
        tooltip:
          "Has not committed a violent misdemeanor or DUI misdemeanor while on probation or parole in past 12 months",
      },
      pastEarnedDischargeEligibleDate: {
        text: "Served {{daysToYearsMonthsPast (daysPast opportunity.person.supervisionStartDate)}}",
        tooltip:
          "If on probation, served minimum sentence according to the court; if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent offense, served at least one-third of remaining sentence; if on parole for a life sentence, served at least five years on parole",
      },
    },
    ineligibleCriteriaCopy: {
      pastEarnedDischargeEligibleDate: {
        text: "Needs {{monthsOrDaysRemainingFromToday eligibleDate}} on supervision",
        tooltip:
          "If on probation, served minimum sentence according to the court; if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent offense, served at least one-third of remaining sentence; if on parole for a life sentence, served at least five years on parole",
      },
    },
    homepagePosition: 2,
  };
