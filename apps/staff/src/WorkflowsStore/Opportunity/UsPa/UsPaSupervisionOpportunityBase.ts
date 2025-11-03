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

import { OpportunityType } from "~datatypes";

import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityTab } from "../types";
import { hydrateReq } from "../utils";

/**
 * Base class for US_PA Supervision Opportunities.
 *
 * Handles "Eligibility Unclear" status and related requirements.
 * TODO (#10375): Remove when US_PA requirements are solidified.
 */
export abstract class UsPaSupervisionOpportunityBase<
  ReferralRecord extends DocumentData,
> extends OpportunityBase<Client, ReferralRecord> {
  /**
   * Text indicating unclear eligibility status that is treated
   * as a non-OMS requirement.
   */
  eligibilityUnclearText?: string[];
  /**
   * Whether the opportunity is in an "Eligibility Unclear" status,
   * which is true when the metadata tab name is "ELIGIBILITY_UNCLEAR".
   */
  isEligibilityUnclear?: boolean;

  readonly eligibilityUnclearDisplayName = "Eligibility Unclear";

  constructor(
    client: Client,
    opportunityType: OpportunityType,
    rootStore: RootStore,
    record: ReferralRecord,
  ) {
    super(client, opportunityType, rootStore, record);

    const isEligibilityUnclearEnabled =
      !!rootStore.userStore.activeFeatureVariants.usPaUnclearEligibility;

    if (isEligibilityUnclearEnabled) {
      const { eligibilityUnclearText, tabName } = record.metadata;
      this.eligibilityUnclearText = eligibilityUnclearText;
      this.isEligibilityUnclear = tabName === "ELIGIBILITY_UNCLEAR";
    }
  }

  /**
   * US_PA Opportunities with unclear eligibility are treated as almost eligible,
   * so the user can still take action on them.
   */
  get almostEligible() {
    return this.isEligibilityUnclear || super.almostEligible;
  }

  /**
   * A non-OMS requirement that is non-configurable, maintained in the backend,
   * and used to flag why the opportunity has an unclear eligibility status.
   */
  get eligibilityUnclearRequirements() {
    if (!this.eligibilityUnclearText) return [];

    return this.eligibilityUnclearText.map((text) =>
      hydrateReq({
        raw: { text },
        opportunity: this,
        formatters: this.criteriaFormatters,
      }),
    );
  }

  /**
   * This private getter determines if the opportunity is in a final state.
   *
   * If the opportunity is in a final state, such as denied or submitted,
   * we no longer show the "Eligibility Unclear" status.
   * However, if it is not in a final state (i.e. Almost Eligible or Eligible), we show the unclear status.
   */
  private get isOpportunityInFinalState() {
    return (
      this.denied ||
      this.isSubmitted ||
      this.isGrantApproved ||
      this.isInSnoozeReview ||
      this.isInSupervisorReview
    );
  }

  eligibilityStatusLabel(includeReasons?: boolean) {
    if (this.isOpportunityInFinalState)
      return super.eligibilityStatusLabel(includeReasons);
    else if (this.isEligibilityUnclear)
      return this.eligibilityUnclearDisplayName;
    else return super.eligibilityStatusLabel(includeReasons);
  }

  tabTitle(): OpportunityTab {
    // A non-permanent tab for unclear eligibility status while perceived US_PA eligibility criteria
    // accuracy and quality is improved. Expect this to be removed in the future and swallowed
    // into the standard eligibility flow.
    if (this.isOpportunityInFinalState) return super.tabTitle();
    else if (this.isEligibilityUnclear)
      return this.eligibilityUnclearDisplayName;
    else return super.tabTitle();
  }
}
