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
import { UsMiEarlyDischargeOpportunity } from "./UsMiEarlyDischargeOpportunity";

export const usMiEarlyDischargeConfig: OpportunityConfig<UsMiEarlyDischargeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_MI",
    urlSection: "earlyDischarge",
    label: "Early Discharge",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be `,
      opportunityText: "eligible for early discharge",
      callToAction:
        "Review clients who may be eligible for early discharge and complete discharge paperwork in COMS.",
    }),
    firestoreCollection: "US_MI-earlyDischargeReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    eligibilityDateText: "Earliest Eligibility Date for Early Discharge",
    sidebarComponents: [
      "UsMiEarlyDischargeIcDetails",
      "ClientProfileDetails",
      "EligibilityDate",
    ],
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MI,
    denialReasons: {
      "CHILD ABUSE ORDER":
        "CHILD ABUSE ORDER: Child abuse prevention order filed during supervision period",
      "SUSPECTED OFFENSE":
        "SUSPECTED OFFENSE: Suspected of a felony, assaultive misdemeanor, OWI, or offense requiring SORA registration",
      "FELONY/STATE PROBATION":
        "FELONY/STATE PROBATION: On parole and also on other state or federal probation supervision for an offense committed during the current period",
      NEEDS:
        "NEEDS: On parole and all criminogenic needs have not been addressed",
      NONCOMPLIANT: "NONCOMPLIANT: Not compliant with the order of supervision",
      PROGRAMMING: "PROGRAMMING: Has not completed all required programming",
      "PRO-SOCIAL": "PRO-SOCIAL: Has not demonstrated pro-social behavior",
      RESTITUTION:
        "RESTITUTION: Has not completed court-ordered restitution payments",
      "FINES & FEES":
        "FINES & FEES: Willful nonpayment of restitution, fees, court costs, fines, and other monetary obligations despite clear ability to pay",
      "PENDING CHARGES": "PENDING CHARGES: Pending felony charges/warrant",
      "ORDERED TREATMENT":
        "ORDERED TREATMENT: Has not completed all required treatment",
      "EXCLUDED OFFENSE":
        "EXCLUDED OFFENSE: On parole for an offense resulting in death or serious bodily injury or an offense involving the discharge of a firearm",
      JUDGE: "JUDGE: County Judge declined client for consideration",
      Other: "Other: please specify a reason",
    },
  };
