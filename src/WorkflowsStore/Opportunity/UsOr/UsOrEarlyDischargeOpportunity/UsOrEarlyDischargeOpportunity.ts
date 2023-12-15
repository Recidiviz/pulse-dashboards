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

import { OpportunityProfileModuleName } from "../../../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { Client } from "../../../Client";
import { OTHER_KEY } from "../../../utils";
import { UsOrEarlyDischargeForm } from "../../Forms/UsOrEarlyDischargeForm";
import { OpportunityBase } from "../../OpportunityBase";
import { SupervisionOpportunityType } from "../../OpportunityConfigs";
import { OpportunityRequirement } from "../../types";
import { CriteriaCopy, hydrateCriteria } from "../../utils";
import {
  UsOrEarlyDischargeReferralRecord,
  usOrEarlyDischargeSchema,
  UsOrEarlyDischargeSubOpportunity,
} from "./UsOrEarlyDischargeReferralRecord";

const OPPORTUNITY_TYPE: SupervisionOpportunityType = "usOrEarlyDischarge";

const CRITERIA_COPY: CriteriaCopy<UsOrEarlyDischargeSubOpportunity> = {
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
        text: "Not convicted of a crime while supervision case was under review",
        tooltip:
          "Has not been convicted of a crime (felony or misdemeanor) that occurred while on supervision for the case(s) under review.",
      },
    ],
  ],
  ineligibleCriteria: [],
};

export class UsOrEarlyDischargeOpportunity extends OpportunityBase<
  Client,
  UsOrEarlyDischargeReferralRecord
> {
  client: Client;

  form: UsOrEarlyDischargeForm;

  constructor(client: Client) {
    super(
      client,
      OPPORTUNITY_TYPE,
      client.rootStore,
      usOrEarlyDischargeSchema.parse
    );

    this.client = client;

    this.form = new UsOrEarlyDischargeForm(this, client.rootStore);

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    let out: OpportunityRequirement[] = [];
    this.record.subOpportunities.forEach((subOpp) => {
      out = [
        ...out,
        { isHeading: true, text: subOpp.id },
        ...hydrateCriteria(subOpp, "eligibleCriteria", CRITERIA_COPY),
      ];
    });
    return out;
  }

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  readonly policyOrMethodologyUrl = "TBD";

  readonly isAlert = false;

  readonly tooltipEligibilityText = "Eligible for early discharge";

  denialReasonsMap = {
    [OTHER_KEY]: "Other: please specify a reason",
  };
}
