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

import { OPPORTUNITY_STATUS_COLORS } from "../../../../core/utils/workflowsUtils";
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

  get almostEligible() {
    // Even though "Early Requests" have an ineligible criteria specified,
    // they are technically "eligible" for the opportunity
    if (this.record.metadata.tabName === "EARLY_REQUESTS") return false;
    return super.almostEligible;
  }

  tabTitle(): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    switch (this.record.metadata.tabName) {
      case "REPORT_DUE_ELIGIBLE":
      case "REPORT_DUE_ALMOST_ELIGIBLE":
        return "Report Due (Benchmarks Met)";
      case "REPORT_DUE_INELIGIBLE":
        return "Report Due (Other)";
      case "EARLY_REQUESTS":
        return "Early Requests";
      case "REPORT_SUBMITTED":
        return "Report Submitted";
      default:
        return "Other";
    }
  }

  get subcategory() {
    if (this.denied) return;

    switch (this.record.metadata.tabName) {
      case "REPORT_DUE_ELIGIBLE":
      case "REPORT_DUE_ALMOST_ELIGIBLE":
        return this.record.metadata.tabName;
    }
  }

  eligibilityStatusLabel(includeReasons?: boolean) {
    if (this.denied) return super.eligibilityStatusLabel(includeReasons);

    switch (this.record.metadata.tabName) {
      case "REPORT_DUE_ELIGIBLE":
        return "All Benchmarks Met";
      case "REPORT_DUE_ALMOST_ELIGIBLE":
        return "Almost All Benchmarks Met";
      case "REPORT_DUE_INELIGIBLE":
        return "Report Due";
      case "EARLY_REQUESTS":
      case "REPORT_SUBMITTED":
        return this.tabTitle();
      default:
        return "Other";
    }
  }

  get customStatusPalette() {
    if (this.record.metadata.tabName === "REPORT_SUBMITTED")
      return OPPORTUNITY_STATUS_COLORS.submitted;
  }
}
