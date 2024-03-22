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
import { UsPaAdminSupervisionOpportunity } from "./UsPaAdminSupervisionOpportunity";

export const usPaAdminSupervisionConfig: OpportunityConfig<UsPaAdminSupervisionOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_PA",
    urlSection: "adminSupervision",
    label: "Administrative Supervision",
    dynamicEligibilityText:
      "client[|s] may be eligible for transfer to Adminstrative Supervision",
    callToAction:
      "Review clients who may be eligible for Adminstrative Supervision and complete the DC-P 402 checklist",
    firestoreCollection: "US_PA-adminSupervisionReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    sidebarComponents: ["ClientProfileDetails"],
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_PA,
    denialReasons: {
      FELONY_DRUG:
        "Client is currently being supervised for an ineligible felony drug offense",
      Other: "Other, please specify a reason",
    },
    eligibleCriteriaCopy: {
      usPaNoHighSanctionsInPastYear: {
        text: "Client has not incurred high sanctions within the last year",
      },
      usPaFulfilledRequirements: {
        text: "Has fulfilled treatment and special condition requirements",
      },
      usPaNotServingIneligibleAsOffense: {
        text: "Not serving for an ineligible offense",
      },
      usPaSupervisionLevelIsNotLimited: {
        text: "Currently on {{supervisionLevel}} supervision",
      },
    },
  };
