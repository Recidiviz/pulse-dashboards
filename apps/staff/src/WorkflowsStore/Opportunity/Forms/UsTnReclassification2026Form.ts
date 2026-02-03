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

import {
  formatMultiplePeriodReports,
  UsTnReclassification2026DraftData,
} from "~datatypes";

import {
  getBreakdownSectionQuestionIndex,
  getBreakdownSectionScore,
  getSingleSectionQuestionIndex,
  getSingleSectionQuestionScore,
} from "../../../core/Paperwork/US_TN/common/ScoredAssessmentQuestion";
import { assessmentQuestions } from "../../../core/Paperwork/US_TN/UsTnReclassification2026/assessmentQuestions";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { UsTnAnnualReclassification2026Opportunity } from "../UsTn";
import { FormBase } from "./FormBase";

const QUESTION_TEMPLATE_MAP = {
  q3a: "q3Selection_0_6",
  q3b: "q3Selection_6_12",
  q4a: "q4Selection_0_6",
  q4b: "q4Selection_6_12",
  q5a: "q5Selection_0_6",
  q5b: "q5Selection_6_12",
  q5c: "q5Selection_12_18",
  q5d: "q5Selection_18_36",
  q5e: "q5Selection_36_60",
} satisfies Record<string, keyof UsTnReclassification2026DraftData>;

export class UsTnReclassification2026Form extends FormBase<
  UsTnReclassification2026DraftData,
  UsTnAnnualReclassification2026Opportunity
> {
  navigateToFormText = "Auto-fill paperwork";

  get formContents(): OpportunityFormComponentName {
    return "FormUsTnReclassification2026";
  }

  prefilledDataTransformer() {
    const {
      opportunity: {
        record: { formInformation },
      },
    } = this;

    const q1Selection = getSingleSectionQuestionIndex(
      assessmentQuestions[0],
      formInformation.q1Score,
    );

    const q2Selection = getSingleSectionQuestionIndex(
      assessmentQuestions[1],
      formInformation.q2Score,
    );

    const q3Selection_0_6 = getBreakdownSectionQuestionIndex(
      assessmentQuestions[2].sections[0],
      formInformation.q3Notes,
    );

    const q3Selection_6_12 = getBreakdownSectionQuestionIndex(
      assessmentQuestions[2].sections[1],
      formInformation.q3Notes,
    );

    const q4Selection_0_6 = getBreakdownSectionQuestionIndex(
      assessmentQuestions[3].sections[0],
      formInformation.q4Notes,
    );

    const q4Selection_6_12 = getBreakdownSectionQuestionIndex(
      assessmentQuestions[3].sections[1],
      formInformation.q4Notes,
    );

    const q5Selection_0_6 = getBreakdownSectionQuestionIndex(
      assessmentQuestions[4].sections[0],
      formInformation.q5Notes,
    );

    const q5Selection_6_12 = getBreakdownSectionQuestionIndex(
      assessmentQuestions[4].sections[1],
      formInformation.q5Notes,
    );

    const q5Selection_12_18 = getBreakdownSectionQuestionIndex(
      assessmentQuestions[4].sections[2],
      formInformation.q5Notes,
    );

    const q5Selection_18_36 = getBreakdownSectionQuestionIndex(
      assessmentQuestions[4].sections[3],
      formInformation.q5Notes,
    );

    const q5Selection_36_60 = getBreakdownSectionQuestionIndex(
      assessmentQuestions[4].sections[4],
      formInformation.q5Notes,
    );

    let q6Selection = getSingleSectionQuestionIndex(
      assessmentQuestions[5],
      formInformation.q6Score,
    );

    // There are two options with a score of 0
    // Check the person's age to determine which they are
    if (q6Selection === 3 && (formInformation.q6Notes?.age ?? 0) > 30) {
      q6Selection++;
    }

    const q7Selection = getSingleSectionQuestionIndex(
      assessmentQuestions[6],
      formInformation.q7Score,
    );

    const q1aNotes =
      formInformation.q1Notes.listPriorNonTdocConvictions60Months;

    const q1bNotes =
      formInformation.q1Notes.listPriorViolentTdocConvictions60Months;

    const q3NotesFormatted = formatMultiplePeriodReports(
      formInformation.q3Notes,
    );

    const q4NotesFormatted = formatMultiplePeriodReports(
      formInformation.q4Notes,
    );

    const q5NotesFormatted = formatMultiplePeriodReports(
      formInformation.q5Notes,
    );

    return {
      ...formInformation,
      q1Selection,
      q2Selection,
      q3Selection_0_6,
      q3Selection_6_12,
      q4Selection_0_6,
      q4Selection_6_12,
      q5Selection_0_6,
      q5Selection_6_12,
      q5Selection_12_18,
      q5Selection_18_36,
      q5Selection_36_60,
      q6Selection,
      q7Selection,
      q1aNotes,
      q1bNotes,
      q3NotesFormatted,
      q4NotesFormatted,
      q5NotesFormatted,
    };
  }

  get derivedData() {
    const {
      q1Selection,
      q2Selection,
      q3Selection_0_6,
      q3Selection_6_12,
      q4Selection_0_6,
      q4Selection_6_12,
      q5Selection_0_6,
      q5Selection_6_12,
      q5Selection_12_18,
      q5Selection_18_36,
      q5Selection_36_60,
      q6Selection,
      q7Selection,
    } = this.formData;

    const q1Score = getSingleSectionQuestionScore(
      assessmentQuestions[0],
      q1Selection,
    );
    const q2Score = getSingleSectionQuestionScore(
      assessmentQuestions[1],
      q2Selection,
    );

    let q3Score = getBreakdownSectionScore(
      assessmentQuestions[2].sections[0],
      q3Selection_0_6,
    );
    q3Score += getBreakdownSectionScore(
      assessmentQuestions[2].sections[1],
      q3Selection_6_12,
    );

    let q4Score = getBreakdownSectionScore(
      assessmentQuestions[3].sections[0],
      q4Selection_0_6,
    );
    q4Score += getBreakdownSectionScore(
      assessmentQuestions[3].sections[1],
      q4Selection_6_12,
    );

    let q5Score = getBreakdownSectionScore(
      assessmentQuestions[4].sections[0],
      q5Selection_0_6,
    );
    q5Score += getBreakdownSectionScore(
      assessmentQuestions[4].sections[1],
      q5Selection_6_12,
    );
    q5Score += getBreakdownSectionScore(
      assessmentQuestions[4].sections[2],
      q5Selection_12_18,
    );
    q5Score += getBreakdownSectionScore(
      assessmentQuestions[4].sections[3],
      q5Selection_18_36,
    );
    q5Score += getBreakdownSectionScore(
      assessmentQuestions[4].sections[4],
      q5Selection_36_60,
    );

    const q6Score = getSingleSectionQuestionScore(
      assessmentQuestions[5],
      q6Selection,
    );
    const q7Score = getSingleSectionQuestionScore(
      assessmentQuestions[6],
      q7Selection,
    );

    const totalScore = Math.min(
      41,
      q1Score + q2Score + q3Score + q4Score + q5Score + q6Score + q7Score,
    );

    const trusteeEligible = [
      this.formData.trusteeHas10YearsOrLessRemaining,
      this.formData.trusteeNoAssaultiveDisciplinaryWithSeriousInjuryLast5Years,
      this.formData.trusteeNoEscapeFromLowTrusteePast5Years,
      this.formData.trusteeNoEscapeFromMediumCloseMaxPast10Years,
      this.formData.trusteeNoViolentFelonyConvictionPast5YearsIncarceration,
      this.formData.trusteeNotConvictedOfFirstDegreeMurder,
      this.formData.trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody,
      this.formData.trusteeNotScoredHighForViolence,
      this.formData.trusteeNotServingForSexualOffense,
      this.formData.trusteeNoFelonyDetainers,
      this.formData.trusteeNoPendingFelonyCharges,
      this.formData.trusteeNoPendingImmigrationActions,
      this.formData.trusteeWardenHasApproved,
    ].every((criterion) => criterion === "true");

    return {
      q1Score,
      q2Score,
      q3Score,
      q4Score,
      q5Score,
      q6Score,
      q7Score,
      totalScore,
      trusteeEligible,
    };
  }

  get formTemplateData() {
    const { person, derivedData, formData } = this;

    const now = new Date();

    const templatedData: Record<string, string> = {};

    Object.entries(QUESTION_TEMPLATE_MAP).forEach(
      ([templatePrefix, dataKey]) => {
        const selection = formData[dataKey];
        templatedData[`${templatePrefix}0`] = selection === 0 ? "X" : "_";
        templatedData[`${templatePrefix}1`] = selection === 1 ? "X" : "_";
        templatedData[`${templatePrefix}2`] = selection === 2 ? "X" : "_";
        templatedData[`${templatePrefix}3`] = selection === 3 ? "X" : "_";
      },
    );

    return {
      ...formData,
      ...derivedData,
      ...templatedData,
      omsId: person.externalId,
      downloadDate: now.toLocaleDateString(),
      downloadTime: now.toLocaleTimeString(),
    };
  }
}
