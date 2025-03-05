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

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab } from "../../types";
import {
  UsUtEarlyTerminationReferralRecord,
  usUtEarlyTerminationSchema,
} from "./UsUtEarlyTerminationReferralRecord";

export class UsUtEarlyTerminationOpportunity extends OpportunityBase<
  Client,
  UsUtEarlyTerminationReferralRecord
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usUtEarlyTermination",
      client.rootStore,
      usUtEarlyTerminationSchema.parse(record),
    );
  }

  tabTitle(): OpportunityTab {
    if (this.isSubmitted) return this.submittedTabTitle;
    if (this.denied) return this.deniedTabTitle;
    switch (this.record.metadata.tabName) {
      case "REPORT_DUE_ELIGIBLE":
      case "REPORT_DUE_ALMOST_ELIGIBLE":
        return "Report Due";
      case "EARLY_REQUESTS":
        return "Early Requests";
      default:
        return "Other";
    }
  }

  get subcategory() {
    if (this.isSubmitted || this.denied) return;

    switch (this.record.metadata.tabName) {
      case "REPORT_DUE_ELIGIBLE":
      case "REPORT_DUE_ALMOST_ELIGIBLE":
        return this.record.metadata.tabName;
    }
  }
}
