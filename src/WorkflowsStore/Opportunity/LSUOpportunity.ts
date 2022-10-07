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

import { some } from "lodash";
import { computed, makeObservable } from "mobx";

import { Client } from "../Client";
import { OpportunityValidationError } from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";
import {
  LSUDraftData,
  LSUEarnedDischargeCommonCriteria,
  LSUReferralRecord,
  transformReferral,
} from "./LSUReferralRecord";
import { OpportunityWithFormBase } from "./OpportunityWithFormBase";
import { OpportunityRequirement } from "./types";

const DENIAL_REASONS_MAP = {
  SCNC:
    "SCNC: Not compliant with all court-ordered conditions and special conditions",
  FFR:
    "FFR: Failure to make payments toward fines, fees, and restitution despite ability to pay",
  "NCO/CPO": "NCO/CPO: Has an active NCO, CPO, or restraining order",
  INTERLOCK: "INTERLOCK: Has an active interlock device",
  [OTHER_KEY]: "Other, please specify a reason",
};

// This could be configured externally once it's fleshed out
// to include all copy and other static data
export const LSU_EARNED_DISCHARGE_COMMON_CRITERIA: Record<
  keyof LSUEarnedDischargeCommonCriteria,
  OpportunityRequirement
> = {
  usIdLsirLevelLowModerateForXDays: {
    // The risk level text is an empty string but is always overwritten with a custom string based on actual risk level in requirementsMet
    text: "",
    tooltip:
      "Policy requirement: Assessed at low risk level on LSI-R with no risk increase in past 90 days or moderate risk level on LSI-R with no risk increase in past 360 days",
  },
  negativeUaWithin90Days: {
    text: "Negative UA within past 90 days",
    tooltip:
      "Policy requirement: Negative UA within past 90 days, unless the client lacks a history of drug/alcohol abuse or has been supervised at low risk for more than one year",
  },
  noFelonyWithin24Months: {
    text: "No felony convictions in past 24 months",
    tooltip:
      "Policy requirement: Has not committed a felony while on probation or parole in past 24 months",
  },
  noViolentMisdemeanorWithin12Months: {
    text: "No violent or DUI misdemeanor convictions in past 12 months",
    tooltip:
      "Policy requirement: Has not committed a violent misdemeanor or DUI misdemeanor while on probation or parole in past 12 months",
  },
  usIdIncomeVerifiedWithin3Months: {
    text: "Verified compliant employment",
    tooltip:
      "Policy requirement: Verified employment status, full-time student, or adequate lawful income from non-employment sources have been confirmed within past 3 months",
  },
};

export const LSU_CRITERIA: Record<
  keyof LSUReferralRecord["criteria"],
  OpportunityRequirement
> = {
  ...LSU_EARNED_DISCHARGE_COMMON_CRITERIA,
  usIdNoActiveNco: {
    text: "No active NCO, CPO, or restraining order",
    tooltip:
      "Policy requirement: Does not have an active NCO, CPO, or restraining order",
  },
};

export const LSUEarnedDishcargeCommonRequirementsMet = (
  criteria: LSUEarnedDischargeCommonCriteria
): OpportunityRequirement[] => {
  const requirements: OpportunityRequirement[] = [];
  const {
    usIdLsirLevelLowModerateForXDays,
    negativeUaWithin90Days,
    noFelonyWithin24Months,
    noViolentMisdemeanorWithin12Months,
    usIdIncomeVerifiedWithin3Months,
  } = criteria;

  if (usIdLsirLevelLowModerateForXDays?.riskLevel) {
    const text =
      usIdLsirLevelLowModerateForXDays.riskLevel === "LOW"
        ? "Currently low risk with no increase in risk level in past 90 days"
        : "Currently moderate risk with no increase in risk level in past 360 days";
    requirements.push({
      text,
      tooltip: LSU_CRITERIA.usIdLsirLevelLowModerateForXDays.tooltip,
    });
  }

  if (!some(negativeUaWithin90Days?.latestUaResults)) {
    // TODO(#2468): Reassess how to indicate no UA required
    if (negativeUaWithin90Days.latestUaDates.length === 0) {
      requirements.push({
        text: "No UA needed",
        tooltip: LSU_CRITERIA.negativeUaWithin90Days.tooltip,
      });
    } else {
      requirements.push(LSU_CRITERIA.negativeUaWithin90Days);
    }
  }

  if (noFelonyWithin24Months?.latestFelonyConvictions.length === 0) {
    requirements.push(LSU_CRITERIA.noFelonyWithin24Months);
  }

  if (
    noViolentMisdemeanorWithin12Months?.latestViolentConvictions.length === 0
  ) {
    requirements.push(LSU_CRITERIA.noViolentMisdemeanorWithin12Months);
  }

  if (usIdIncomeVerifiedWithin3Months?.incomeVerifiedDate) {
    requirements.push(LSU_CRITERIA.usIdIncomeVerifiedWithin3Months);
  }

  return requirements;
};

class LSUOpportunity extends OpportunityWithFormBase<
  LSUReferralRecord,
  LSUDraftData
> {
  navigateToFormText = "Generate Chrono";

  constructor(client: Client) {
    super(client, "LSU", transformReferral);
    makeObservable(this, {
      requirementsMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { criteria } = this.record;
    const requirements = LSUEarnedDishcargeCommonRequirementsMet(criteria);

    if (!criteria.usIdNoActiveNco?.activeNco) {
      requirements.push(LSU_CRITERIA.usIdNoActiveNco);
    }

    return requirements;
  }
}

/**
 * Returns an `LSUOpportunity` if the provided data indicates the client is eligible
 */
export function createLSUOpportunity(
  eligible: boolean | undefined,
  client: Client
): LSUOpportunity | undefined {
  if (!eligible) return undefined;
  try {
    return new LSUOpportunity(client);
  } catch (e) {
    // constructor performs further validation that may fail
    if (e instanceof OpportunityValidationError) {
      return undefined;
    }
    // don't handle anything unexpected, it's probably a bug!
    throw e;
  }
}
