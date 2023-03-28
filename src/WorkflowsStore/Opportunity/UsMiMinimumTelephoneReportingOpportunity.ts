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
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  transformReferral,
  UsMiMinimumTelephoneReportingReferralRecord,
} from "./UsMiMinimumTelephoneReportingReferralRecord";

const DENIAL_REASONS_MAP = {
  [OTHER_KEY]: "Other, please specify a reason",
};

export class UsMiMinimumTelephoneReportingOpportunity extends OpportunityBase<
  Client,
  UsMiMinimumTelephoneReportingReferralRecord
> {
  readonly sidebarModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_MI;

  constructor(client: Client) {
    super(
      client,
      "usMiMinimumTelephoneReporting",
      client.rootStore,
      transformReferral
    );

    makeObservable(this, {
      requirementsMet: computed,
      requirementsAlmostMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const requirements: OpportunityRequirement[] = [];
    const {
      criteria: { initialCompassScoreMinimumOrMedium },
    } = this.record;

    if (initialCompassScoreMinimumOrMedium?.assessmentLevel) {
      requirements.push({
        text: `Currently on ${initialCompassScoreMinimumOrMedium?.assessmentLevel.toLowerCase()} assessment level`,
      });
    }

    if (initialCompassScoreMinimumOrMedium?.eligibleDate) {
      requirements.push({
        text: `Initial compass score date is ${formatWorkflowsDate(
          initialCompassScoreMinimumOrMedium?.eligibleDate
        )}`,
      });
    }

    return requirements;
  }
}
