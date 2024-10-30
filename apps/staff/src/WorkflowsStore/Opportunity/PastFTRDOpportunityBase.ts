// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { OpportunityType } from "~datatypes";

import { Client } from "../Client";
import { ValidateFunction } from "../subscriptions";
import { OpportunityBase } from "./OpportunityBase";
import { BasePastFTRDReferralRecord } from "./PastFTRDReferralRecord";

export abstract class PastFTRDOpportunityBase<
  ReferralRecord extends BasePastFTRDReferralRecord,
> extends OpportunityBase<Client, ReferralRecord> {
  constructor(
    client: Client,
    type: OpportunityType,
    record: ReferralRecord,
    validateRecord?: ValidateFunction<ReferralRecord>,
  ) {
    if (validateRecord !== undefined) validateRecord(record);
    super(client, type, client.rootStore, record);
  }

  get eligibilityDate(): Date | undefined {
    return (
      this.record?.eligibleCriteria.supervisionPastFullTermCompletionDate
        ?.eligibleDate ??
      this.record?.ineligibleCriteria.supervisionPastFullTermCompletionDate
        ?.eligibleDate
    );
  }
}
