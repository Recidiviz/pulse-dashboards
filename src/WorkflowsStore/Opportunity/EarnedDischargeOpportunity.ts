// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { computed, makeObservable } from "mobx";

import { Client } from "../Client";
import { OTHER_KEY } from "../utils";
import {
  EarnedDischargeReferralRecord,
  transformReferral,
} from "./EarnedDischargeReferralRecord";
import {
  LSU_EARNED_DISCHARGE_COMMON_CRITERIA,
  LSUEarnedDischargeCommonRequirementsMet,
} from "./LSUOpportunity";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";

const DENIAL_REASONS_MAP = {
  SCNC: "Not compliant with special conditions",
  FFR:
    "Failure to make payments towards fines, fees, and restitution despite ability to pay",
  INTERLOCK: "Has an active interlock device",
  PCD: "Parole Commission permanently denied early discharge request",
  CD: "Court permanently denied early discharge request",
  [OTHER_KEY]: "Other, please specify a reason",
};

// This could be configured externally once it's fleshed out
// to include all copy and other static data
// TODO: Update the keys in this mapping once we know what the data looks like
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CRITERIA: Record<
  keyof EarnedDischargeReferralRecord["criteria"],
  OpportunityRequirement
> = {
  ...LSU_EARNED_DISCHARGE_COMMON_CRITERIA,
  pastEarnedDischargeEligibleDate: {
    text: "Minimum time has been served for eligibility",
    tooltip:
      "Policy requirement: If on probation, served minimum sentence according to the court; " +
      "if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent " +
      "offense, served at least one-third of remaining sentence; if on parole for a life sentence, " +
      "served at least five years on parole.",
  },
  usIdLsirLevelLowModerateForXDays: {
    // The risk level text is an empty string but is always overwritten with a custom string based on actual risk level in requirementsMet
    text: "",
    tooltip:
      "Policy requirement: Assessed at low risk level on LSI-R with no risk increase in past 90 days or moderate risk level on LSI-R with no risk increase in past 360 days",
  },
};

export class EarnedDischargeOpportunity extends OpportunityBase<EarnedDischargeReferralRecord> {
  constructor(client: Client) {
    super(client, "earnedDischarge", transformReferral);

    makeObservable(this, {
      requirementsMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { criteria } = this.record;
    const requirements = LSUEarnedDischargeCommonRequirementsMet(criteria);

    // TODO(#2415): Update this to be dynamic once sex offense info is in FE
    if (criteria.pastEarnedDischargeEligibleDate) {
      requirements.push(CRITERIA.pastEarnedDischargeEligibleDate);
    }
    if (criteria.usIdLsirLevelLowModerateForXDays?.riskLevel) {
      const text =
        criteria.usIdLsirLevelLowModerateForXDays.riskLevel === "LOW"
          ? "Currently low risk with no increase in risk level in past 90 days"
          : "Currently moderate risk with no increase in risk level in past 360 days";
      requirements.push({
        text,
        tooltip: CRITERIA.usIdLsirLevelLowModerateForXDays.tooltip,
      });
    }

    return requirements;
  }

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.eligibleStartDate;
  }
}
