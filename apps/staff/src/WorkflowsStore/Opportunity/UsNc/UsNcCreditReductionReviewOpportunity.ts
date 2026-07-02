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

import {
  UsNcCreditReductionReviewRecord,
  usNcCreditReductionReviewSchema,
} from "~datatypes";

import {
  OPPORTUNITY_STATUS_COLORS,
  StatusPalette,
} from "../../../core/utils/workflowsUtils";
import {
  AdjudicationStatus,
  AdjudicationStatusValue,
} from "../../../FirestoreStore";
import { Client } from "../../Client";
import { UsNcCreditReductionReviewForm } from "../Forms/UsNcCreditReductionReviewForm";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityTab, OpportunityTabGroup } from "../types";

export class UsNcCreditReductionReviewOpportunity extends OpportunityBase<
  Client,
  UsNcCreditReductionReviewRecord["output"]
> {
  form: UsNcCreditReductionReviewForm;

  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usNcCreditReductionReview",
      client.rootStore,
      usNcCreditReductionReviewSchema.parse(record),
    );

    this.form = new UsNcCreditReductionReviewForm(this, client.rootStore);
  }

  get adjudicationStatus(): AdjudicationStatus | undefined {
    return this.updates?.adjudicationStatus;
  }

  override tabTitle(category?: OpportunityTabGroup): OpportunityTab {
    if (this.adjudicationStatus)
      return this.adjudicationStatus.adjudicationStatus;
    return super.tabTitle(category);
  }

  override eligibilityStatusLabel(): string | null {
    if (this.adjudicationStatus)
      return this.adjudicationStatus.adjudicationStatus;
    return super.eligibilityStatusLabel();
  }

  override get customStatusPalette(): StatusPalette | undefined {
    if (!this.adjudicationStatus) return super.customStatusPalette;
    const status = this.adjudicationStatus.adjudicationStatus;
    if (status === "Approved") return OPPORTUNITY_STATUS_COLORS.eligible;
    if (status === "Partially Approved")
      return OPPORTUNITY_STATUS_COLORS.almostEligible;
    return OPPORTUNITY_STATUS_COLORS.denied;
  }

  async setAdjudicationStatus(status: AdjudicationStatusValue): Promise<void> {
    await this.rootStore.firestoreStore.updateAdjudicationStatus(
      this.currentUserEmail,
      this,
      status,
    );
  }

  async deleteAdjudicationStatus(): Promise<void> {
    await this.rootStore.firestoreStore.deleteAdjudicationStatus(this);
  }

  override async deleteSubmitted(): Promise<void> {
    await Promise.all([
      super.deleteSubmitted(),
      // Clear chief approval in parallel so the person never briefly lands on
      // "Approved by Chief" during the revert.
      this.isGrantApproved ? this.deleteActionHistory() : Promise.resolve(),
    ]);
  }

  override async markSubmitted(
    stateCode: string,
    newSubcategory?: string,
  ): Promise<void> {
    await super.markSubmitted(stateCode, newSubcategory);
    if (this.adjudicationStatus) {
      await this.deleteAdjudicationStatus();
    }
  }

  override async setDenialReasons(
    reasons: string[],
    updatedUserInput?: Record<string, string>,
  ): Promise<void> {
    await super.setDenialReasons(reasons, updatedUserInput);
    if (reasons.length > 0 && this.adjudicationStatus) {
      await this.deleteAdjudicationStatus();
    }
  }
}
