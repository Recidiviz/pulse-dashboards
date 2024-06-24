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
import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsNdEarlyTerminationOpportunity } from "./UsNdEarlyTerminationOpportunity";

export const usNdEarlyTerminationConfig: OpportunityConfig<UsNdEarlyTerminationOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_ND",
    urlSection: "earlyTermination",
    label: "Early Termination",
    dynamicEligibilityText: "client[|s] may be eligible for early termination",
    callToAction:
      "Review clients eligible for early termination and download the paperwork to file with the Court.",
    firestoreCollection: "earlyTerminationReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 180,
    },
    hideDenialRevert: true,
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_ND,
    sidebarComponents: ["ClientProfileDetails"],
    denialReasons: {
      "INT MEASURE":
        "Under active intermediate measure as a result of 1+ violations",
      "PENDING CHARGE": "Has a pending felony or misdemeanor charge",
      "CASE PLAN NC": "Has not completed case plan goals",
      "MIN PERIOD NE": "Minimum mandatory supervision period not expired",
      DOP: "Being supervised for an offense resulting in the death of a person",
      "FINES/FEES": "Willful nonpayment of fines / fees despite ability to pay",
      INC: "Incarcerated on another offense",
      "PROS PERM DENIED": "Prosecutor permanently denied early termination",
      "PROS TEMP DENIED":
        "Prosecutor temporarily denied early termination and will reconsider",
      "SENDING STATE DENIED": "Sending state denied early termination",
    },
    eligibleCriteriaCopy: {
      supervisionPastEarlyDischargeDate: {
        text: "Early termination date is {{date eligibleDate}}",
        tooltip:
          "Policy requirement: Early termination date (as calculated by DOCSTARS) has passed or is within 30 days.",
      },
      usNdImpliedValidEarlyTerminationSupervisionLevel: {
        text: "Currently on {{lowerCase supervisionLevel}} supervision",
        tooltip:
          "Policy requirement: Currently on diversion, minimum, medium, maximum, IC-in, or IC-out supervision level.",
      },
      usNdImpliedValidEarlyTerminationSentenceType: {
        text: "Serving {{lowerCase supervisionType}} sentence",
        tooltip:
          "Policy requirement: Serving a suspended, deferred, or IC-probation sentence.",
      },
      usNdNotInActiveRevocationStatus: {
        text: "Not on active revocation status",
        tooltip: "Policy requirement: Not on active revocation status.",
      },
    },
    ineligibleCriteriaCopy: {
      supervisionPastEarlyDischargeDate: {
        text: "Early termination date (as calculated by DOCSTARS) is within 60 days",
        tooltip:
          "Policy requirement: Early termination date (as calculated by DOCSTARS) has passed or is within 30 days.",
      },
    },
  };
