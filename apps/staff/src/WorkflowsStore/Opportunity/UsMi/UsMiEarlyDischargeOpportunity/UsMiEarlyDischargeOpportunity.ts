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

import { DocumentData } from "firebase/firestore";

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsMiEarlyDischargeReferralRecord,
  usMiEarlyDischargeSchema,
} from "./UsMiEarlyDischargeReferralRecord";

export class UsMiEarlyDischargeOpportunity extends OpportunityBase<
  Client,
  UsMiEarlyDischargeReferralRecord
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usMiEarlyDischarge",
      client.rootStore,
      usMiEarlyDischargeSchema.parse(record),
    );
  }

  get eligibilityDate(): Date | undefined {
    return super.eligibilityDate ?? this.record?.metadata.eligibleDate;
  }

  get denialReasons() {
    let keysToExclude: string[];
    if (this.record?.metadata.supervisionType.toLowerCase() === "parole") {
      keysToExclude = ["EXCLUDED CURRENT OFFENSE", "EXCLUDED NEW OFFENSE"];
    } else if (
      this.record?.metadata.supervisionType.toLowerCase() === "probation"
    ) {
      keysToExclude = ["EXCLUDED OFFENSE"];
    } else {
      return this.config.denialReasons;
    }

    return Object.fromEntries(
      Object.entries(this.config.denialReasons).filter(
        ([key]) => !keysToExclude.includes(key),
      ),
    );
  }
}
