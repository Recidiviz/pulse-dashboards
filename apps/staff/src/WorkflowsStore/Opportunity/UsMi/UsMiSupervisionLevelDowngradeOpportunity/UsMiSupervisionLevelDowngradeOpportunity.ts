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

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { Client } from "../../../Client";
import { OTHER_KEY } from "../../../utils";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import { CriteriaCopy, hydrateCriteria } from "../../utils/criteriaUtils";
import {
  getValidator,
  UsMiSupervisionLevelDowngradeReferralRecord,
  usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter,
} from "./UsMiSupervisionLevelDowngradeReferralRecord";

const CRITERIA_COPY: CriteriaCopy<UsMiSupervisionLevelDowngradeReferralRecord> =
  {
    eligibleCriteria: [
      [
        "supervisionLevelHigherThanAssessmentLevel",
        {
          text: "Currently supervised at $SUPERVISION_LEVEL; Latest COMPAS score is $ASSESSMENT_LEVEL",
          tooltip:
            "The supervising Agent shall ensure that a Correctional Offender Management Profiling for Alternative Sanctions (COMPAS) has been completed for each offender on their active caseload as outlined in OP 06.01.145 “Administration and Use of COMPAS and TAP.”  Unless mandated by statute or other criteria as directed in this operating procedure, the COMPAS shall be used to determine the initial supervision level of each offender.  Any offender placed on active supervision without a completed COMPAS shall be supervised at a Medium level of supervision until a COMPAS can be completed (unless a higher level of supervision is mandated as outlined in this operating procedure).",
        },
      ],
      [
        "usMiNotPastInitialClassificationReviewDate",
        {
          text: "Not past initial classification review date",
          tooltip:
            "Classification reviews shall be completed after six months of active supervision.  Unless an offender’s supervision level is mandated by policy or statute, the supervising Agent shall reduce an offender’s supervision level if the offender has satisfactorily completed six continuous months at the current assigned supervision level.",
        },
      ],
      [
        "usMiNotServingIneligibleOffensesForDowngradeFromSupervisionLevel",
        {
          text: "Not serving for an offense ineligible for a lower supervision level",
        },
      ],
    ],
    ineligibleCriteria: [],
  };

export class UsMiSupervisionLevelDowngradeOpportunity extends OpportunityBase<
  Client,
  UsMiSupervisionLevelDowngradeReferralRecord
> {
  constructor(client: Client) {
    super(
      client,
      "usMiSupervisionLevelDowngrade",
      client.rootStore,
      usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(
        (raw: string) =>
          client.rootStore.workflowsStore.formatSupervisionLevel(raw),
      ).parse,
      getValidator(client),
    );

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(this.record, "eligibleCriteria", CRITERIA_COPY);
  }

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
    "EligibilityDate",
    "CaseNotes",
  ];

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_MI;

  readonly isAlert = true;

  readonly hideUnknownCaseNoteDates = true;

  denialReasonsMap = {
    OVERRIDE:
      "Agent supervision level override due to noncompliance with supervision",
    "EXCLUDED CHARGE":
      "Client is required to be supervised at a higher level of supervision by policy",
    [OTHER_KEY]: "Other: please specify a reason",
  };

  get eligibilityDate(): Date | undefined {
    return this.record?.metadata.eligibleDate;
  }
}
