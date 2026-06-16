// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { DocumentData } from "@google-cloud/firestore";

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { UsTxAnnualReportStatusV2Form } from "../../Forms/UsTxAnnualReportStatusV2Form/UsTxAnnualReportStatusV2Form";
import {
  UsTxAnnualReportStatusV2DraftData,
  UsTxAnnualReportStatusV2ReferralRecord,
  usTxAnnualReportStatusV2Schema,
} from "../UsTxAnnualReportStatusV2Opportunity/UsTxAnnualReportStatusV2OpportunityReferralRecord";
import { UsTxArsErsV2OpportunityBase } from "../UsTxArsErsV2OpportunityBase";

export class UsTxAnnualReportStatusV2Opportunity extends UsTxArsErsV2OpportunityBase<
  UsTxAnnualReportStatusV2ReferralRecord,
  OpportunityUpdateWithForm<UsTxAnnualReportStatusV2DraftData>
> {
  form: UsTxAnnualReportStatusV2Form;

  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usTxAnnualReportStatusV2",
      client.rootStore,
      usTxAnnualReportStatusV2Schema.parse(record),
    );

    this.form = new UsTxAnnualReportStatusV2Form(this, this.rootStore);
  }
}
