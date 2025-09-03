// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { cloneDeep } from "lodash";

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { LSUForm } from "../../Forms/LSUForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import { monthsOrDaysRemainingFromToday } from "../../utils/criteriaUtils";
import {
  LSUDraftData,
  LSUReferralRecord,
  usIdLsuSchema,
} from "./LSUReferralRecord";

export const LSU_CRITERIA: Record<
  keyof LSUReferralRecord["eligibleCriteria"],
  OpportunityRequirement
> = {
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
  underSupervisionCustodialAuthorityAtLeastOneYear: {
    text: "On supervision at least 1 year",
    tooltip: "Has been on supervision for at least 1 year",
  },
  usIdIncomeVerifiedWithin3Months: {
    text: "Verified compliant employment",
    tooltip:
      "Policy requirement: Verified employment status, full-time student, or adequate lawful income from non-employment sources have been confirmed within past 3 months",
  },
};

const INELIGIBLE_CRITERIA_COPY: Record<
  keyof LSUReferralRecord["ineligibleCriteria"],
  OpportunityRequirement
> = {
  underSupervisionCustodialAuthorityAtLeastOneYear: {
    text: "Needs $TIME_REMAINING on supervision",
    tooltip: "Policy requirement: Has been on supervision for at least 1 year",
  },
  usIdIncomeVerifiedWithin3Months: {
    text: "Needs employment verification",
    tooltip:
      "Policy requirement: Verified employment status, full-time student, or adequate lawful " +
      "income from non-employment sources have been confirmed within past 3 months.",
  },
};


export class LSUOpportunity extends OpportunityBase<
  Client,
  LSUReferralRecord,
  OpportunityUpdateWithForm<LSUDraftData>
> {
  form: LSUForm;

  constructor(client: Client, record: DocumentData) {
    super(client, "LSU", client.rootStore, usIdLsuSchema.parse(record));

    this.form = new LSUForm(this, client.rootStore);
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { ineligibleCriteria } = this.record;
    const requirements: OpportunityRequirement[] = [];
    const { usIdIncomeVerifiedWithin3Months, underSupervisionCustodialAuthorityAtLeastOneYear } =
      cloneDeep(INELIGIBLE_CRITERIA_COPY);

    if (ineligibleCriteria.usIdIncomeVerifiedWithin3Months) {
      requirements.push(usIdIncomeVerifiedWithin3Months);
    }

    if (
      ineligibleCriteria.underSupervisionCustodialAuthorityAtLeastOneYear &&
      ineligibleCriteria.underSupervisionCustodialAuthorityAtLeastOneYear.eligibleDate
    ) {
      const monthsOrDaysRemaining = monthsOrDaysRemainingFromToday(
        ineligibleCriteria.underSupervisionCustodialAuthorityAtLeastOneYear.eligibleDate,
      );
      underSupervisionCustodialAuthorityAtLeastOneYear.text =
        underSupervisionCustodialAuthorityAtLeastOneYear.text.replace(
          "$TIME_REMAINING",
          `${monthsOrDaysRemaining}`,
        );
      requirements.push(underSupervisionCustodialAuthorityAtLeastOneYear);
    }
    return requirements;
  }

  get almostEligibleStatusMessage(): string | undefined {
    if (!this.almostEligible) return;
    const { usIdIncomeVerifiedWithin3Months, underSupervisionCustodialAuthorityAtLeastOneYear } =
      this.record?.ineligibleCriteria ?? {};
    if (usIdIncomeVerifiedWithin3Months) {
      return INELIGIBLE_CRITERIA_COPY.usIdIncomeVerifiedWithin3Months.text;
    }
    if (
      underSupervisionCustodialAuthorityAtLeastOneYear &&
      underSupervisionCustodialAuthorityAtLeastOneYear.eligibleDate
    ) {
      const monthsOrDaysRemaining = monthsOrDaysRemainingFromToday(
        underSupervisionCustodialAuthorityAtLeastOneYear.eligibleDate,
      );
      return INELIGIBLE_CRITERIA_COPY.underSupervisionCustodialAuthorityAtLeastOneYear.text.replace(
        "$TIME_REMAINING",
        `${monthsOrDaysRemaining}`,
      );
    }
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { eligibleCriteria } = this.record;
    const requirements: OpportunityRequirement[] = [];

    if (eligibleCriteria.usIdIncomeVerifiedWithin3Months?.incomeVerifiedDate) {
      requirements.push(LSU_CRITERIA.usIdIncomeVerifiedWithin3Months);
    }

    if (!eligibleCriteria.usIdNoActiveNco?.activeNco) {
      requirements.push(LSU_CRITERIA.usIdNoActiveNco);
    }

    if (eligibleCriteria.usIdLsirLevelLowFor90Days?.riskLevel === "LOW") {
      requirements.push(LSU_CRITERIA.usIdLsirLevelLowFor90Days);
    }

    if (
      eligibleCriteria.underSupervisionCustodialAuthorityAtLeastOneYear?.eligibleDate &&
      eligibleCriteria.underSupervisionCustodialAuthorityAtLeastOneYear?.eligibleDate <= new Date()
    ) {
      requirements.push(LSU_CRITERIA.underSupervisionCustodialAuthorityAtLeastOneYear);
    }

    return requirements;
  }

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return super.eligibilityDate ?? this.record.eligibleStartDate;
  }
}
