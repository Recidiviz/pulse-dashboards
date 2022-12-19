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

import { makeObservable } from "mobx";

import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  getTransformer,
  getValidator,
  UsTnSupervisionLevelDowngradeReferralRecord,
} from "./UsTnSupervisionLevelDowngradeReferralRecord";

export class UsTnSupervisionLevelDowngradeOpportunity extends OpportunityBase<
  Client,
  UsTnSupervisionLevelDowngradeReferralRecord
> {
  readonly policyOrMethodologyUrl =
    "https://drive.google.com/file/d/1fkqncNb_GNYBvRfOgij4QHw4HEdkkHHz/view";

  constructor(client: Client) {
    super(
      client,
      "supervisionLevelDowngrade",
      client.rootStore,
      getTransformer((raw: string) =>
        client.rootStore.workflowsStore.formatSupervisionLevel(raw)
      ),
      getValidator(client)
    );

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];

    const {
      assessmentLevel,
      latestAssessmentDate,
      supervisionLevel,
    } = this.record.criteria.supervisionLevelHigherThanAssessmentLevel;

    return [
      {
        text: `Current supervision level: ${supervisionLevel}; last risk score: ${assessmentLevel} (as of ${formatWorkflowsDate(
          latestAssessmentDate
        )})`,
      },
    ];
  }

  readonly isAlert = true;

  denialReasonsMap = {
    COURT: "COURT: Court mandates supervision at a higher level",
    [OTHER_KEY]: "Other: please specify a reason",
  };
}
