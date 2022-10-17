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

import dedent from "dedent";
import { some } from "lodash";
import { computed, makeObservable } from "mobx";
import moment from "moment";

import { Client } from "../Client";
import { OTHER_KEY } from "../WorkflowsStore";
import {
  LSUDraftData,
  LSUEarnedDischargeCommonCriteria,
  LSUReferralRecord,
  transformReferral,
} from "./LSUReferralRecord";
import {
  OpportunityWithFormBase,
  PrefilledDataTransformer,
} from "./OpportunityWithFormBase";
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

export const LSUEarnedDischargeCommonRequirementsMet = (
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

const defaultFormValueJoiner = (...items: (string | undefined)[]) =>
  items.filter((item) => item).join("\n");

const formatFormValueDate = (date: string) => moment(date).format("MM/DD/YYYY");

export class LSUOpportunity extends OpportunityWithFormBase<
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
    const requirements = LSUEarnedDischargeCommonRequirementsMet(criteria);

    if (!criteria.usIdNoActiveNco?.activeNco) {
      requirements.push(LSU_CRITERIA.usIdNoActiveNco);
    }

    return requirements;
  }

  prefilledDataTransformer: PrefilledDataTransformer<LSUDraftData> = () => {
    if (!this.record) return {};

    const { formInformation: form } = this.record;
    return {
      chargeDescriptions: form.chargeDescriptions?.join(",") ?? "",
      contactInformation: defaultFormValueJoiner(
        form.currentAddress,
        form.currentPhoneNumber,
        form.emailAddress
      ),

      employmentInformation: defaultFormValueJoiner(
        form.employerName,
        form.employerAddress,
        form.employmentStartDate
          ? `Started ${formatFormValueDate(form.employmentStartDate)}`
          : "",
        form.employmentDateVerified
          ? `Verified ${formatFormValueDate(form.employmentDateVerified)}`
          : ""
      ),

      assessmentInformation: dedent`
        ${form.assessmentScore ? `Score: ${form.assessmentScore}` : ""}
        ${
          form.assessmentDate
            ? `Last assessed: ${formatFormValueDate(form.assessmentDate)}`
            : ""
        }
      `,

      substanceTest: form.drugScreenDate
        ? `Tested ${
            form.drugScreenResult ? "positive" : "negative"
          } on ${formatFormValueDate(form.drugScreenDate)}`
        : "",

      ncicCheck: defaultFormValueJoiner(
        form.ncicReviewDate
          ? `Completed on ${formatFormValueDate(form.ncicReviewDate)}`
          : "",
        form.ncicNoteBody
      ),

      treatmentCompletionDate: defaultFormValueJoiner(
        form.txDischargeDate
          ? `${form.txNoteTitle} on ${formatFormValueDate(
              form.txDischargeDate
            )}`
          : "",
        form.txNoteBody
      ),
    };
  };

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.eligibleStartDate;
  }
}
