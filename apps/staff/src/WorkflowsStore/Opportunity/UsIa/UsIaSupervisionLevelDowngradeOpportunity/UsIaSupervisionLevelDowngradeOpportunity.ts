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

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement, OpportunityTab } from "../../types";
import { RELEVANT_ED_DENIAL_REASONS } from "..";
import {
  UsIaEarlyDischargeOpportunity,
  UsIaSupervisionLevelDowngradeClientStatus,
} from "../UsIaEarlyDischargeOpportunity";
import {
  UsIaSupervisionLevelDowngradeReferralRecord,
  usIaSupervisionLevelDowngradeSchema,
} from "./UsIaSupervisionLevelDowngradeReferralRecord";

export class UsIaSupervisionLevelDowngradeOpportunity extends OpportunityBase<
  Client,
  UsIaSupervisionLevelDowngradeReferralRecord
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usIaCompleteSupervisionLevelDowngrade",
      client.rootStore,
      usIaSupervisionLevelDowngradeSchema.parse(record),
    );
  }

  get clientStatus(): UsIaSupervisionLevelDowngradeClientStatus {
    if (this.denied) {
      return "DENIED";
    }

    if (this.isSubmitted) {
      return "SUBMITTED";
    }

    if (this.record.isEligible) return "ELIGIBLE_NOW";

    return "PENDING_ELIGIBILITY";
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    const customReqs = [] as OpportunityRequirement[];
    const { violationsPast6MonthsFlag, openInterventionsFlag } =
      this.record.metadata;
    if (violationsPast6MonthsFlag) {
      customReqs.push({
        text: "Has violation incidents dated within the past 6 months. Please review incident history.",
      });
    }
    if (openInterventionsFlag) {
      customReqs.push({
        text: "Has open interventions in ICON. Please ensure client has completed court-ordered interventions.",
      });
    }
    return super.requirementsAlmostMet.concat(customReqs);
  }

  /**
   * This opportunity shows up in the "Pending Eligibility" tab if the companion ED opp has a
   * relevant denial reason
   */
  get earlyDischargeCompanionOpportunity():
    | UsIaEarlyDischargeOpportunity
    | undefined {
    const companionOpportunityType = "usIaEarlyDischarge";
    const earlyDischargeOpportunities =
      this.person.flattenedOpportunities.filter(
        (opportunity) => opportunity.type === companionOpportunityType,
      ) as UsIaEarlyDischargeOpportunity[];

    if (earlyDischargeOpportunities.length > 1) {
      throw new Error(
        "Expected either zero or one companion UsIaEarlyDischargeOpportunity, received multiple.",
      );
    }

    return earlyDischargeOpportunities.length === 0
      ? undefined
      : earlyDischargeOpportunities[0];
  }

  get pendingEligibility(): boolean {
    if (!this.record.isAlmostEligible) return false;

    const edOppDenial =
      this.earlyDischargeCompanionOpportunity?.updates?.denial;
    if (!edOppDenial) return false;

    const relevantDenial = edOppDenial.reasons.every((item) =>
      RELEVANT_ED_DENIAL_REASONS.includes(item),
    );

    return relevantDenial;
  }

  eligibilityStatusLabel(includeReasons?: boolean): string | null {
    if (this.denied || this.isSubmitted)
      return super.eligibilityStatusLabel(includeReasons);
    if (this.pendingEligibility) return "Pending Eligibility";
    return super.eligibilityStatusLabel(includeReasons);
  }

  tabTitle(): OpportunityTab {
    if (this.isSubmitted) return this.submittedTabTitle;
    if (this.denied) return "Snoozed";
    if (this.record.isEligible) return "Eligible Now";
    if (this.pendingEligibility) return "Pending Eligibility";
    // This tab will not be visible, but we want to catch almost eligible but not pending opps.
    return "Almost Eligible";
  }
}
