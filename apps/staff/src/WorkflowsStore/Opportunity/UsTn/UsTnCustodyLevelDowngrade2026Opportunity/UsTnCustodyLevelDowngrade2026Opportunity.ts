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
  UsTnReclassification2026ReferralRecord,
  usTnReclassification2026Schema,
} from "~datatypes";

import { Client } from "../../../Client";
import { UsTnReclassification2026Form } from "../../Forms/UsTnReclassification2026Form";
import { OpportunityBase } from "../../OpportunityBase";

export class UsTnCustodyLevelDowngrade2026Opportunity extends OpportunityBase<
  Client,
  UsTnReclassification2026ReferralRecord["output"]
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usTnCustodyLevelDowngrade2026Policy",
      client.rootStore,
      usTnReclassification2026Schema.parse(record),
    );

    this.form = new UsTnReclassification2026Form(this, client.rootStore);
  }
}
