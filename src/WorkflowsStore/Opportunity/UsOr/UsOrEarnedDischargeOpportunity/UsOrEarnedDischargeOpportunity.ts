/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
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
import { UsOrEarnedDischargeForm } from "../../Forms/UsOrEarnedDischargeForm";
import { OpportunityBase } from "../../OpportunityBase";
import { SupervisionOpportunityType } from "../../OpportunityConfigs";
import { OpportunityRequirement } from "../../types";
import { CriteriaCopy, hydrateCriteria } from "../../utils";
import {
  UsOrEarnedDischargeReferralRecord,
  usOrEarnedDischargeSchema,
  UsOrEarnedDischargeSubOpportunity,
} from "./UsOrEarnedDischargeReferralRecord";

const OPPORTUNITY_TYPE: SupervisionOpportunityType = "usOrEarnedDischarge";

const CRITERIA_COPY: CriteriaCopy<UsOrEarnedDischargeSubOpportunity> = {
  eligibleCriteria: [
    [
      "eligibleStatute",
      {
        text: "Currently serving for a felony or misdemeanor that is eligible for EDIS",
        tooltip:
          "Felony and/or designated drug-related or person misdemeanor convictions sentenced to Probation, Local Control Post-Prison Supervision or Board Post-Prison Supervision",
      },
    ],

    [
      "pastHalfCompletionOrSixMonths",
      {
        text: "Has served at least 6 months or half the supervision period",
        tooltip:
          "Served the minimum period of active supervision on the case under consideration (minimum of 6 months or half of the supervision period whichever is greater)",
      },
    ],
    [
      "noAdministrativeSanction",
      {
        text: "No administrative sanctions and has not been found in violation of the court in the past 6 months",
        tooltip:
          "Has not been administratively sanctioned or found in violation by the court in the immediate six months prior to review",
      },
    ],
    [
      "noConvictionDuringSentence",
      {
        text: "Not convicted of a crime that occurred while on supervision for the case under review",
        tooltip:
          "Has not been convicted of a crime (felony or misdemeanor) that occurred while on supervision for the case(s) under review.",
      },
    ],
  ],
  ineligibleCriteria: [],
};

export class UsOrEarnedDischargeOpportunity extends OpportunityBase<
  Client,
  UsOrEarnedDischargeReferralRecord
> {
  client: Client;

  form: UsOrEarnedDischargeForm;

  constructor(client: Client) {
    super(
      client,
      OPPORTUNITY_TYPE,
      client.rootStore,
      usOrEarnedDischargeSchema.parse
    );

    this.client = client;

    this.form = new UsOrEarnedDischargeForm(this, client.rootStore);

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    let out: OpportunityRequirement[] = [];
    this.record.subOpportunities.forEach((subOpp) => {
      out = [
        ...out,
        {
          isHeading: true,
          text: `${subOpp.metadata.courtCaseNumber}: ${subOpp.metadata.sentenceStatute}`,
        },
        ...hydrateCriteria(subOpp, "eligibleCriteria", CRITERIA_COPY).map(
          (oppReq) => ({ ...oppReq, key: `${subOpp.id}-${oppReq.text}` })
        ),
      ];
    });
    return out;
  }

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_OR;

  readonly isAlert = false;

  readonly tooltipEligibilityText = "Eligible for early discharge";

  denialReasonsMap = {
    FINES:
      "Compensatory fines and restitution have not been paid in full or not current on payment plan",
    PROGRAMS: "Incomplete specialty court programs or treatment programs",
    "CASE PLAN": "Not in compliance with supervision case plan",
    [OTHER_KEY]: "Other: please specify a reason",
  };
}
