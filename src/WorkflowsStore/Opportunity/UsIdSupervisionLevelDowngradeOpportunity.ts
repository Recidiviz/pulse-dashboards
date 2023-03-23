/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { makeObservable } from "mobx";

import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { Client } from "../Client";
import { OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import {
  formatBaseSLDRequirements,
  getBaseSLDTransformer,
  getBaseSLDValidator,
  SupervisionLevelDowngradeReferralRecord,
} from "./SupervisionLevelDowngradeReferralRecord";
import { OpportunityRequirement } from "./types";

export type UsIdSupervisionLevelDowngradeReferralRecord =
  SupervisionLevelDowngradeReferralRecord;

export class UsIdSupervisionLevelDowngradeOpportunity extends OpportunityBase<
  Client,
  UsIdSupervisionLevelDowngradeReferralRecord
> {
  constructor(client: Client) {
    super(
      client,
      "usIdSupervisionLevelDowngrade",
      client.rootStore,
      getBaseSLDTransformer((raw: string) =>
        client.rootStore.workflowsStore.formatSupervisionLevel(raw)
      ),
      getBaseSLDValidator(client)
    );

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];

    return formatBaseSLDRequirements(this.record);
  }

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  readonly policyOrMethodologyUrl =
    "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=share_link";

  readonly isAlert = true;

  denialReasonsMap = {
    INCORRECT: "INCORRECT: Risk score listed here is incorrect",
    OVERRIDE:
      "OVERRIDE: Client is being overridden to a different supervision level",
    [OTHER_KEY]: "Other: please specify a reason",
  };

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.criteria.supervisionLevelHigherThanAssessmentLevel
      .latestAssessmentDate;
  }
}
