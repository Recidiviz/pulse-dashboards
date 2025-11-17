// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import {
  UsTnInitialClassification2026ReferralRecord,
  usTnInitialClassification2026Schema,
} from "~datatypes";

import { Client } from "../../../Client";
import { UsTnInitialClassification2026Form } from "../../Forms/UsTnInitialClassification2026Form";
import { OpportunityBase } from "../../OpportunityBase";

export class UsTnInitialClassification2026Opportunity extends OpportunityBase<
  Client,
  UsTnInitialClassification2026ReferralRecord["output"]
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usTnInitialClassification2026Policy",
      client.rootStore,
      usTnInitialClassification2026Schema.parse(record),
    );

    this.form = new UsTnInitialClassification2026Form(this, client.rootStore);
  }
}
