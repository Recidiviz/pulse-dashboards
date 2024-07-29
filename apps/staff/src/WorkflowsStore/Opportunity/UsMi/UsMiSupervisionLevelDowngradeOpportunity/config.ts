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
import { UsMiSupervisionLevelDowngradeOpportunity } from "./UsMiSupervisionLevelDowngradeOpportunity";

export const usMiSupervisionLevelDowngradeConfig: OpportunityConfig<UsMiSupervisionLevelDowngradeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_MI",
    urlSection: "supervisionLevelMismatch",
    label: "Supervision Level Mismatch",
    dynamicEligibilityText:
      "client[|s] within their first 6 months of supervision [is|are] being supervised at a level that does not match their latest risk score",
    callToAction:
      "Review clients whose supervision level does not match their risk level and change supervision levels in COMS.",
    subheading:
      "This alert helps staff identify clients who are eligible for a downgrade in their supervision level during their first six months on supervision. The tool will surface clients who have not yet received a COMPAS but are being supervised at a level other than medium or whose supervision level is not aligned with their COMPAS score. Review clients within their first six months of supervision and whose supervision level does not match their risk level and downgrade their supervision level in OMNI.",
    firestoreCollection: "US_MI-supervisionLevelDowngrade",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    eligibilityDateText: "Initial Classification Due Date",
    isAlert: true,
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MI,
    sidebarComponents: ["ClientProfileDetails", "EligibilityDate", "CaseNotes"],
    denialReasons: {
      OVERRIDE:
        "Agent supervision level override due to noncompliance with supervision",
      "EXCLUDED CHARGE":
        "Client is required to be supervised at a higher level of supervision by policy",
      Other: "Other: please specify a reason",
    },
    eligibleCriteriaCopy: {
      supervisionLevelHigherThanAssessmentLevel: {
        text: "Currently supervised at {{supervisionLevel}}; Latest COMPAS score is {{assessmentLevel}}",
        tooltip:
          "The supervising Agent shall ensure that a Correctional Offender Management Profiling for Alternative Sanctions (COMPAS) has been completed for each offender on their active caseload as outlined in OP 06.01.145 “Administration and Use of COMPAS and TAP.”  Unless mandated by statute or other criteria as directed in this operating procedure, the COMPAS shall be used to determine the initial supervision level of each offender.  Any offender placed on active supervision without a completed COMPAS shall be supervised at a Medium level of supervision until a COMPAS can be completed (unless a higher level of supervision is mandated as outlined in this operating procedure).",
      },

      usMiNotPastInitialClassificationReviewDate: {
        text: "Not past initial classification review date",
        tooltip:
          "Classification reviews shall be completed after six months of active supervision.  Unless an offender’s supervision level is mandated by policy or statute, the supervising Agent shall reduce an offender’s supervision level if the offender has satisfactorily completed six continuous months at the current assigned supervision level.",
      },

      usMiNotServingIneligibleOffensesForDowngradeFromSupervisionLevel: {
        text: "Not serving for an offense ineligible for a lower supervision level",
      },
    },
    homepagePosition: 5,
  };
