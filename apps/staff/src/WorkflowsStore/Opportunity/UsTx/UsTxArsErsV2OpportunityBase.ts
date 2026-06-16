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

import { DocumentData } from "firebase/firestore";

import { OpportunityUpdateWithForm } from "../../../FirestoreStore";
import { Client } from "../../Client";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityTab } from "../types";

export abstract class UsTxArsErsV2OpportunityBase<
  ReferralRecord extends DocumentData,
  UpdateRecord extends OpportunityUpdateWithForm<any>,
> extends OpportunityBase<Client, ReferralRecord, UpdateRecord> {
  get isGrantApproved(): boolean {
    return !!this.record.metadata.grantedAt;
  }

  get isInRevisionsRequested(): boolean {
    return (
      !!this.latestAction &&
      !this.latestAction.isStale &&
      this.latestAction.supervisorResponse?.type === "REVISION"
    );
  }

  get supervisorReviewTabTitle(): OpportunityTab {
    return "Submitted for Review";
  }

  get grantApprovedTabTitle(): OpportunityTab {
    return "Approved by Supervisor";
  }

  tabTitle(): OpportunityTab {
    // Snoozed tab
    if (this.denied) return this.deniedTabTitle;

    // Submitted for Review tab
    if (this.isInSupervisorReview) return this.supervisorReviewTabTitle;

    // Awaiting Revisions tab
    if (this.isInRevisionsRequested) return "Awaiting Revisions";

    // Approved tab
    if (this.isGrantApproved) return this.grantApprovedTabTitle;

    // Almost Eligible tab
    if (this.almostEligible) return "Almost Eligible";

    // Eligible Now tab
    return "Eligible Now";
  }
}
