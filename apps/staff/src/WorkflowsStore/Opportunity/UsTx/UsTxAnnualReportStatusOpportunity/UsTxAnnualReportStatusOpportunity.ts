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

import { DocumentData } from "@google-cloud/firestore";

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { UsTxAnnualReportStatusForm } from "../../Forms/UsTxAnnualReportStatusForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsTxAnnualReportStatusDraftData,
  UsTxAnnualReportStatusReferralRecord,
  usTxAnnualReportStatusSchema,
} from "./UsTxAnnualReportStatusOpportunityReferralRecord";

export class UsTxAnnualReportStatusOpportunity extends OpportunityBase<
  Client,
  UsTxAnnualReportStatusReferralRecord,
  OpportunityUpdateWithForm<UsTxAnnualReportStatusDraftData>
> {
  form: UsTxAnnualReportStatusForm;

  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usTxAnnualReportStatus",
      client.rootStore,
      usTxAnnualReportStatusSchema.parse(record),
    );

    this.form = new UsTxAnnualReportStatusForm(this, this.rootStore);
  }
}
