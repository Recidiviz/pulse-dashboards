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

import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { FeatureGateError } from "../../errors";
import { toTitleCase } from "../../utils";
import { Client } from "../Client";
import { ValidateFunction } from "../subscriptions";
import { OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  UsMiMinimumTelephoneReportingReferralRecord,
  usMiMinimumTelephoneReportingSchema,
} from "./UsMiMinimumTelephoneReportingReferralRecord";
import { CriteriaCopy, CriteriaFormatters, hydrateCriteria } from "./utils";

const CRITERIA_FORMATTERS: CriteriaFormatters<UsMiMinimumTelephoneReportingReferralRecord> =
  {
    usMiSupervisionAndAssessmentLevelEligibleForTelephoneReporting: {
      COMPAS_SCORE: ({ initialAssessmentLevelRawText }) =>
        toTitleCase(initialAssessmentLevelRawText),
    },
  } as const;

const CRITERIA_COPY: CriteriaCopy<UsMiMinimumTelephoneReportingReferralRecord> =
  {
    eligibleCriteria: [
      [
        "onMinimumSupervisionAtLeastSixMonths",
        {
          text: "Served at least six months on Minimum In-Person or Minimum Low Risk supervision",
          tooltip:
            "Offenders assigned to minimum in person or minimum low-risk supervision shall be evaluated for assignment to minimum TRS after they have completed six months of active supervision.",
        },
      ],
      [
        "usMiSupervisionAndAssessmentLevelEligibleForTelephoneReporting",
        {
          text: "Original COMPAS score was $COMPAS_SCORE",
          tooltip:
            "Original COMPAS score was minimum or medium and current supervision level is minimum in person or current supervision level is minimum low risk.",
        },
      ],
      [
        "usMiNotRequiredToRegisterUnderSora",
        {
          text: "Not required to register per SORA",
          tooltip:
            "Not currently required to register pursuant to to the Sex Offender Registration Act.",
        },
      ],
      [
        "usMiNotServingIneligibleOffensesForTelephoneReporting",
        {
          text: "Not on supervision for an offense excluded from eligibility for telephone reporting",
          tooltip:
            "Not currently serving for an offense listed in WS 01.06.115 Attachment A “Michigan Sex Offender Registry Offenses” or any any similar offense from another state. Not currently serving for an offense included in OP 06.04.130K Attachment A “TRS Exclusion List” including Attempts, Solicitation and Conspiracy. Agents should reference the PACC code on the list when determining eligibility. Not serving for Operating Under the Influence of Liquor (OUIL) or Operating While Impaired (OWI) (any level), unless the offender has successfully completed twelve months of active supervision. A probationer currently serving for OUIL/OWI may only be placed on TRS if authorized by the sentencing court and documented by a court order. Not serving a life or commuted sentence. Not serving a probation term with a delay of sentence.",
        },
      ],
      [
        "supervisionNotPastFullTermCompletionDateOrUpcoming90Days",
        {
          text: "More than 90 days remaining until full-term discharge.",
        },
      ],
    ],
    ineligibleCriteria: [],
  };

const DENIAL_REASONS_MAP = {
  FIREARM:
    "Serving on a felony offense involving possession or use of a firearm",
  [OTHER_KEY]: "Other, please specify a reason",
};

const getFeatureFlagValidator =
  (
    client: Client
  ): ValidateFunction<UsMiMinimumTelephoneReportingReferralRecord> =>
  (record: UsMiMinimumTelephoneReportingReferralRecord): void => {
    const featureFlags = client.rootStore.workflowsStore.featureVariants;
    if (!featureFlags.usMiPrereleaseOpportunities) {
      throw new FeatureGateError(
        "usMiMinimumTelephoneReporting opportunity is not enabled for this user."
      );
    }
  };

export class UsMiMinimumTelephoneReportingOpportunity extends OpportunityBase<
  Client,
  UsMiMinimumTelephoneReportingReferralRecord
> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_MI;

  constructor(client: Client) {
    super(
      client,
      "usMiMinimumTelephoneReporting",
      client.rootStore,
      usMiMinimumTelephoneReportingSchema.parse,
      getFeatureFlagValidator(client)
    );

    makeObservable(this, {
      requirementsMet: computed,
      requirementsAlmostMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(
      this.record,
      "eligibleCriteria",
      CRITERIA_COPY,
      CRITERIA_FORMATTERS
    );
  }
}
