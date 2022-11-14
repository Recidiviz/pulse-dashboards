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

import { Client } from "../Client";
import { OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import { UsTnExpirationReferralRecord } from "./UsTnExpirationReferralRecord";

export class UsTnExpirationOpportunity extends OpportunityBase<UsTnExpirationReferralRecord> {
  constructor(client: Client) {
    super(client, "usTnExpiration");

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];

    // TODO(#2613): fill this in

    return [
      {
        text: `Expiration date is [TODO]`,
      },
    ];
  }

  denialReasonsMap = {
    DATE: "DATE: Expiration date is incorrect or missing",
    [OTHER_KEY]: "Other: please specify a reason",
  };

  // TODO(#2613): fill in eligibilityDate and other stubs as appropriate
}
