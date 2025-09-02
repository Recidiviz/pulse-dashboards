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

  tabTitle(): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    switch (this.record.metadata.tabName) {
      case "REPORT_DUE_ELIGIBLE":
      case "REPORT_DUE_ALMOST_ELIGIBLE":
      case "EARLY_REQUESTS":
        return "Suitable for Early Termination";
      case "REPORT_DUE_INELIGIBLE":
        return "Report Due (Other)";
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
        return "REPORT_DUE";
      case "EARLY_REQUESTS":
        return "EARLY_REQUESTS";
    }
  }

  get allBenchmarksMet() {
    // For Early Requests, we want to determine whether the person is missing another
    // criteria in addition to the half-time criteria
    const ineligibleCriteria = Object.keys(this.record.ineligibleCriteria);

    switch (this.record.metadata.tabName) {
      case "REPORT_DUE_ELIGIBLE":
        return true;
      case "EARLY_REQUESTS":
        return ineligibleCriteria.length === 1;
      case "REPORT_DUE_ALMOST_ELIGIBLE":
      case "REPORT_DUE_INELIGIBLE":
      default:
        return false;
    }
  }

  eligibilityStatusLabel(includeReasons?: boolean) {
    if (this.denied) {
      return super.eligibilityStatusLabel(includeReasons);
    }
    if (this.record.metadata.tabName === "REPORT_SUBMITTED") {
      return this.tabTitle();
    }
    if (this.record.metadata.tabName === "REPORT_DUE_INELIGIBLE") {
      return "Report Due";
    }

    return this.allBenchmarksMet
      ? "All Benchmarks Met"
      : "Verification Required";
  }

  get customStatusPalette() {
    if (this.denied) {
      return OPPORTUNITY_STATUS_COLORS.ineligible;
    }
    if (this.record.metadata.tabName === "REPORT_SUBMITTED") {
      return OPPORTUNITY_STATUS_COLORS.submitted;
    }
    if (this.allBenchmarksMet) {
      return OPPORTUNITY_STATUS_COLORS.eligible;
    } else {
      return OPPORTUNITY_STATUS_COLORS.submitted;
    }
  }
}
