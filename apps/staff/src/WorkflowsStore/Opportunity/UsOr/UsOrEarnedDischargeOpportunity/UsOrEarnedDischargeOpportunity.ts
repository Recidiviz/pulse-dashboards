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

import { makeObservable, override } from "mobx";

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import { hydrateUntypedCriteria } from "../../utils";
import {
  UsOrEarnedDischargeReferralRecord,
  usOrEarnedDischargeSchema,
} from "./UsOrEarnedDischargeReferralRecord";

export class UsOrEarnedDischargeOpportunity extends OpportunityBase<
  Client,
  UsOrEarnedDischargeReferralRecord
> {
  constructor(client: Client) {
    super(
      client,
      "usOrEarnedDischarge",
      client.rootStore,
      usOrEarnedDischargeSchema.parse,
    );

    makeObservable(this, { requirementsMet: override });
  }

  get requirementsMet(): OpportunityRequirement[] {
    const {
      record,
      config: { eligibleCriteriaCopy },
    } = this;
    if (!record) return [];
    let out: OpportunityRequirement[] = [];
    record.subOpportunities.forEach((subOpp) => {
      out = [
        ...out,
        {
          isHeading: true,
          text: `${subOpp.metadata.courtCaseNumber}: ${subOpp.metadata.sentenceStatute}`,
        },
        ...hydrateUntypedCriteria(
          subOpp.eligibleCriteria,
          eligibleCriteriaCopy,
          this,
          this.criteriaFormatters,
        ).map((oppReq) => ({ ...oppReq, key: `${subOpp.id}-${oppReq.text}` })),
      ];
    });
    return out;
  }
}
