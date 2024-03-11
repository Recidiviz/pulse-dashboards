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
import { EarnedDischargeOpportunity } from "./EarnedDischargeOpportunity";

export const usIdEarnedDischargeConfig: OpportunityConfig<EarnedDischargeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_ID",
    urlSection: "earnedDischarge",
    label: "Earned Discharge",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be eligible for `,
      opportunityText: `earned discharge`,
      callToAction: `Review clients who may be eligible for Earned Discharge and complete a pre-filled request form.`,
    }),
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
  };
