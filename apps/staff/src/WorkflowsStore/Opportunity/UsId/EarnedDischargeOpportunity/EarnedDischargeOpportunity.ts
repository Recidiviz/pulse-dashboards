// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { cloneDeep } from "lodash";
import { computed, makeObservable } from "mobx";

import { OpportunityProfileModuleName } from "../../../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { OTHER_KEY } from "../../../utils";
import { UsIdEarnedDischargeForm } from "../../Forms/UsIdEarnedDischargeForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import { monthsOrDaysRemainingFromToday } from "../../utils/criteriaUtils";
import {
  LSU_EARNED_DISCHARGE_COMMON_CRITERIA,
  LSUEarnedDischargeCommonRequirementsMet,
} from "../LSUOpportunity/LSUOpportunity";
import {
  EarnedDischargeDraftData,
  EarnedDischargeReferralRecord,
  transformEarnedDischargeReferral as transformReferral,
} from "./EarnedDischargeReferralRecord";

const DENIAL_REASONS_MAP = {
  SCNC: "Not compliant with special conditions",
  FFR: "Failure to make payments towards fines, fees, and restitution despite ability to pay",
  INTERLOCK: "Has an active interlock device",
  NCIC: "Did not pass NCIC check",
  PCD: "Parole Commission permanently denied early discharge request",
  CD: "Court permanently denied early discharge request",
  MIS: "Has had a violent misdemeanor conviction in the past 12 months",
  [OTHER_KEY]: "Other, please specify a reason",
};

// This could be configured externally once it's fleshed out
// to include all copy and other static data
const ELIGIBLE_CRITERIA_COPY: Record<
  keyof EarnedDischargeReferralRecord["eligibleCriteria"],
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

export const INELIGIBLE_CRITERIA_COPY: Record<
  keyof EarnedDischargeReferralRecord["ineligibleCriteria"],
  OpportunityRequirement
> = {
  onSupervisionAtLeastOneYear: {
    text: "Needs $TIME_REMAINING on supervision",
    tooltip: "Policy requirement: Has been on supervision for at least 1 year",
  },
  pastEarnedDischargeEligibleDate: {
    text: "Needs $TIME_REMAINING on supervision",
    tooltip:
      "Policy requirement: If on probation, served minimum sentence according to the court; if on parole " +
      "for a nonviolent crime, served at least one year; if on parole for a sex/violent offense, served at " +
      "least one-third of remaining sentence; if on parole for a life sentence, served at least five years on parole.",
  },
  usIdIncomeVerifiedWithin3Months: {
    text: "Needs employment verification",
    tooltip:
      "Policy requirement: Verified employment status, full-time student, or adequate lawful " +
      "income from non-employment sources have been confirmed within past 3 months.",
  },
};

export class EarnedDischargeOpportunity extends OpportunityBase<
  Client,
  EarnedDischargeReferralRecord,
  OpportunityUpdateWithForm<EarnedDischargeDraftData>
> {
  readonly policyOrMethodologyUrl =
    "http://forms.idoc.idaho.gov/WebLink/0/edoc/282369/Termination%20of%20Probation%20or%20Parole%20Supervision.pdf";

  form?: UsIdEarnedDischargeForm;

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
    "CaseNotes",
  ];

  readonly tooltipEligibilityText = "Eligible for Earned Discharge";

  constructor(client: Client) {
    super(client, "earnedDischarge", client.rootStore, transformReferral);

    makeObservable(this, {
      almostEligible: computed,
      requirementsMet: computed,
      requirementsAlmostMet: computed,
      almostEligibleStatusMessage: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;

    this.form = new UsIdEarnedDischargeForm(this, client.rootStore);
  }

  get almostEligible(): boolean {
    return Object.keys(this.record?.ineligibleCriteria ?? {}).length > 0;
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { ineligibleCriteria } = this.record;
    const requirements: OpportunityRequirement[] = [];
    const { usIdIncomeVerifiedWithin3Months, pastEarnedDischargeEligibleDate } =
      cloneDeep(INELIGIBLE_CRITERIA_COPY);

    if (ineligibleCriteria.usIdIncomeVerifiedWithin3Months) {
      requirements.push(usIdIncomeVerifiedWithin3Months);
    }

    if (
      ineligibleCriteria.pastEarnedDischargeEligibleDate &&
      ineligibleCriteria.pastEarnedDischargeEligibleDate.eligibleDate
    ) {
      const monthsOrDaysRemaining = monthsOrDaysRemainingFromToday(
        ineligibleCriteria.pastEarnedDischargeEligibleDate.eligibleDate
      );
      pastEarnedDischargeEligibleDate.text =
        pastEarnedDischargeEligibleDate.text.replace(
          "$TIME_REMAINING",
          `${monthsOrDaysRemaining}`
        );
      requirements.push(pastEarnedDischargeEligibleDate);
    }

    return requirements;
  }

  get almostEligibleStatusMessage(): string | undefined {
    if (!this.almostEligible) return;
    const { usIdIncomeVerifiedWithin3Months, pastEarnedDischargeEligibleDate } =
      this.record?.ineligibleCriteria ?? {};
    if (usIdIncomeVerifiedWithin3Months) {
      return INELIGIBLE_CRITERIA_COPY.usIdIncomeVerifiedWithin3Months.text;
    }
    if (
      pastEarnedDischargeEligibleDate &&
      pastEarnedDischargeEligibleDate.eligibleDate
    ) {
      const monthsOrDaysRemaining = monthsOrDaysRemainingFromToday(
        pastEarnedDischargeEligibleDate.eligibleDate
      );

      return INELIGIBLE_CRITERIA_COPY.pastEarnedDischargeEligibleDate.text.replace(
        "$TIME_REMAINING",
        `${monthsOrDaysRemaining}`
      );
    }
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { eligibleCriteria } = this.record;
    const requirements =
      LSUEarnedDischargeCommonRequirementsMet(eligibleCriteria);

    // TODO(#2415): Update this to be dynamic once sex offense info is in FE
    if (eligibleCriteria.pastEarnedDischargeEligibleDate) {
      requirements.push(ELIGIBLE_CRITERIA_COPY.pastEarnedDischargeEligibleDate);
    }
    if (eligibleCriteria.usIdLsirLevelLowModerateForXDays?.riskLevel) {
      const text =
        eligibleCriteria.usIdLsirLevelLowModerateForXDays.riskLevel === "LOW"
          ? "Currently low risk with no increase in risk level in past 90 days"
          : "Currently moderate risk with no increase in risk level in past 360 days";
      requirements.push({
        text,
        tooltip:
          ELIGIBLE_CRITERIA_COPY.usIdLsirLevelLowModerateForXDays.tooltip,
      });
    }

    return requirements;
  }

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.eligibleStartDate;
  }
}
