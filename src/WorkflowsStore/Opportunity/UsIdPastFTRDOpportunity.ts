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

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  transformReferral,
  UsIdPastFTRDReferralRecord,
} from "./UsIdPastFTRDReferralRecord";

export class UsIdPastFTRDOpportunity extends OpportunityBase<
  Client,
  UsIdPastFTRDReferralRecord
> {
  readonly isAlert = true;

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ID;

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  constructor(client: Client) {
    super(client, "pastFTRD", client.rootStore, transformReferral);
    makeObservable(this, {
      requirementsMet: computed,
    });
  }

  get requirementsMet(): OpportunityRequirement[] {
    const { eligibilityDate } = this;
    if (!eligibilityDate) return [];

    const requirements: OpportunityRequirement[] = [];

    const daysPastEligibleDate = differenceInDays(new Date(), eligibilityDate);
    const text = `${daysPastEligibleDate} days past FTRD (${formatWorkflowsDate(
      eligibilityDate
    )})`;
    // There is no policy to refer to so the tooltip is undefined
    requirements.push({
      text,
    });

    return requirements;
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.eligibleCriteria.supervisionPastFullTermCompletionDate
      .eligibleDate;
  }
}
