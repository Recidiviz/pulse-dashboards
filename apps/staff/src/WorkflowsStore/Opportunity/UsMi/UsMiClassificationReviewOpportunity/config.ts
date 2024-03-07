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
import { add } from "date-fns";
import simplur from "simplur";

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OTHER_KEY } from "../../../utils";
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
      defaultSnoozeUntilFn: (snoozedOn: Date) => add(snoozedOn, { days: 180 }),
    },
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be `,
      opportunityText: "eligible for a supervision level downgrade",
      callToAction:
        "Review clients who meet the time threshold for classification review and downgrade supervision levels in COMS.",
    }),
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
      [OTHER_KEY]: "Other: please specify a reason",
    },
  };
