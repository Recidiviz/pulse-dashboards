// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { differenceInDays } from "date-fns";
import { computed, makeObservable } from "mobx";

import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { TransformFunction, ValidateFunction } from "../subscriptions";
import { OpportunityBase } from "./OpportunityBase";
import { BasePastFTRDReferralRecord } from "./PastFTRDReferralRecord";
import { OpportunityRequirement, OpportunityType } from "./types";
import { CriteriaCopy, CriteriaFormatters, hydrateCriteria } from "./utils";

const CRITERIA_FORMATTERS: CriteriaFormatters<BasePastFTRDReferralRecord> = {
  supervisionPastFullTermCompletionDate: {
    DAYS_PAST_ELIGIBLE_DATE: ({ eligibleDate }) =>
      differenceInDays(new Date(), eligibleDate).toString(),
    ELIGIBILITY_DATE: ({ eligibleDate }) => formatWorkflowsDate(eligibleDate),
  },
};

const CRITERIA_COPY: CriteriaCopy<BasePastFTRDReferralRecord> = {
  eligibleCriteria: [
    [
      "supervisionPastFullTermCompletionDate",
      {
        text: "$DAYS_PAST_ELIGIBLE_DATE days past FTRD ($ELIGIBILITY_DATE)",
      },
    ],
  ],
  ineligibleCriteria: [],
};

export abstract class PastFTRDOpportunityBase<
  ReferralRecord extends BasePastFTRDReferralRecord
> extends OpportunityBase<Client, ReferralRecord> {
  readonly isAlert = true;

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  constructor(
    client: Client,
    type: OpportunityType,
    transformReferral?: TransformFunction<ReferralRecord>,
    validateRecord?: ValidateFunction<ReferralRecord>
  ) {
    super(client, type, client.rootStore, transformReferral, validateRecord);
    makeObservable(this, {
      requirementsMet: computed,
    });
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(
      this.record,
      "eligibleCriteria",
      CRITERIA_COPY,
      CRITERIA_FORMATTERS
    );
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.eligibleCriteria.supervisionPastFullTermCompletionDate
      .eligibleDate;
  }
}