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

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsMiClassificationReviewOpportunity } from "./UsMiClassificationReviewOpportunity";

export const usMiClassificationReviewConfig: OpportunityConfig<UsMiClassificationReviewOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_MI",
    urlSection: "classificationReview",
    label: "Classification Review",
    snooze: {
      // Ideal behavior is to calculate snooze until based on the date of the last classification review
      // or when they are marked ineligible, whichever is earliest.
      autoSnoozeParams: {
        type: "snoozeDays",
        params: {
          days: 180,
        },
      },
    },
    dynamicEligibilityText:
      "client[|s] may be eligible for a supervision level downgrade",
    callToAction:
      "Review clients who meet the time threshold for classification review and downgrade supervision levels in COMS.",
    subheading:
      "This alert helps staff identify clients due or overdue for a classification review, which are generally mandated after six months of supervision and at six-month intervals thereafter, though some clients must receive a classification review earlier than six months by policy. Agents may reconsider the supervision level for a client based on developments in their case and behavior. Review clients who meet the time threshold for classification review and downgrade their supervision level in OMNI.",
    firestoreCollection: "US_MI-classificationReviewReferrals",
    eligibilityDateText: "Next Classification Due Date",
    sidebarComponents: [
      "UsMiRecommendedSupervisionLevel",
      "EligibilityDate",
      "ClientProfileDetails",
      "CaseNotes",
    ],
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MI,
    denialReasons: {
      VIOLATIONS: "Excessive violation behavior during current review period",
      EMPLOYMENT:
        "Chronic unemployment with no effort to job search or recent, concerning unemployment",
      "FINES & FEES":
        "No effort to pay fines and fees despite documented ability to pay",
      "CASE PLAN":
        "No progress toward completion of Transition Accountability Plan goals/tasks",
      NONCOMPLIANT: "Noncompliant with the order of supervision",
      ABSCONSION: "Chronic missing of reporting dates",
      Other: "Other: please specify a reason",
    },
    eligibleCriteriaCopy: {
      usMiClassificationReviewPastDueDate: {
        text: "Recommended classification review date, based on supervision start date and last classification review date, is {{date eligibleDate}}",
        tooltip:
          "Classification reviews shall be completed after six months of active supervision […] " +
          "Subsequent classification reviews shall be scheduled at six-month intervals.",
      },
      usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
        text: "Currently eligible based on offense type and supervision level",
        tooltip:
          "The supervising Agent shall ensure that a Correctional Offender " +
          "Management Profiling for Alternative Sanctions (COMPAS) has been completed " +
          "for each offender on their active caseload as outlined in OP 06.01.145 " +
          "“Administration and Use of COMPAS and TAP.” Unless mandated by statute or " +
          "other criteria as directed in this operating procedure, the COMPAS shall be " +
          "used to determine the initial supervision level of each offender.\n" +
          "Unless an offender’s supervision level is mandated by policy or statute, " +
          "the supervising Agent shall reduce an offender’s supervision level if " +
          "the offender has satisfactorily completed six continuous months at the " +
          "current assigned supervision level.",
      },
    },
    homepagePosition: 1,
  };
