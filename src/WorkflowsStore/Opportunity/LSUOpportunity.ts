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

import { OpportunityUpdateWithForm } from "../../firestore";
import { Client } from "../Client";
import { OTHER_KEY } from "../utils";
import { LSUForm } from "./Forms/LSUForm";
import {
  LSUDraftData,
  LSUEarnedDischargeCommonCriteria,
  LSUReferralRecord,
  transformReferral,
} from "./LSUReferralRecord";
import { OpportunityBase } from "./OpportunityBase";
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
  usIdLsirLevelLowFor90Days: {
    text: "Currently low risk with no increase in risk level in past 90 days",
    tooltip:
      "Policy requirement: Assessed at low risk level on LSI-R with no risk increase in past 90 days",
  },
  onSupervisionAtLeastOneYear: {
    text: "On supervision for at least 12 months",
    tooltip: "Has been on supervision for at least 12 months",
  },
};

export const LSUEarnedDischargeCommonRequirementsMet = (
  criteria: LSUEarnedDischargeCommonCriteria
): OpportunityRequirement[] => {
  const requirements: OpportunityRequirement[] = [];
  const {
    negativeUaWithin90Days,
    noFelonyWithin24Months,
    noViolentMisdemeanorWithin12Months,
    usIdIncomeVerifiedWithin3Months,
  } = criteria;

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

export class LSUOpportunity extends OpportunityBase<
  Client,
  LSUReferralRecord,
  OpportunityUpdateWithForm<LSUDraftData>
> {
  form: LSUForm;

  constructor(client: Client) {
    super(client, "LSU", client.rootStore, transformReferral);
    makeObservable(this, {
      requirementsMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
    this.form = new LSUForm(this.type, this, client.rootStore);
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { criteria } = this.record;
    const requirements = LSUEarnedDischargeCommonRequirementsMet(criteria);

    if (!criteria.usIdNoActiveNco?.activeNco) {
      requirements.push(LSU_CRITERIA.usIdNoActiveNco);
    }

    if (criteria.usIdLsirLevelLowFor90Days?.riskLevel === "LOW") {
      requirements.push(LSU_CRITERIA.usIdLsirLevelLowFor90Days);
    }

    if (criteria.onSupervisionAtLeastOneYear.eligibleDate <= new Date()) {
      requirements.push(LSU_CRITERIA.onSupervisionAtLeastOneYear);
    }

    return requirements;
  }

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.eligibleStartDate;
  }
}
