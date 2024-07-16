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

import { computed, makeObservable, override } from "mobx";

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { UsIdEarnedDischargeForm } from "../../Forms/UsIdEarnedDischargeForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  EarnedDischargeDraftData,
  EarnedDischargeReferralRecord,
  usIdEarnedDischargeSchema,
} from "./EarnedDischargeReferralRecord";

export class EarnedDischargeOpportunity extends OpportunityBase<
  Client,
  EarnedDischargeReferralRecord,
  OpportunityUpdateWithForm<EarnedDischargeDraftData>
> {
  form?: UsIdEarnedDischargeForm;

  constructor(client: Client) {
    super(
      client,
      "earnedDischarge",
      client.rootStore,
      usIdEarnedDischargeSchema.parse,
    );

    makeObservable(this, {
      almostEligible: computed,
      requirementsMet: override,
      requirementsAlmostMet: override,
      almostEligibleStatusMessage: computed,
    });

    this.form = new UsIdEarnedDischargeForm(this, client.rootStore);
  }

  get almostEligible(): boolean {
    return Object.keys(this.record?.ineligibleCriteria ?? {}).length > 0;
  }

  get almostEligibleStatusMessage(): string | undefined {
    const { requirementsAlmostMet } = this;
    if (requirementsAlmostMet.length === 0) return;
    return requirementsAlmostMet[0].text;
  }

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.eligibleStartDate;
  }
}
