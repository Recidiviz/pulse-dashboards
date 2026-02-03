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

import { UsTnInitialClassification2026DraftData } from "~datatypes";

import {
  getSingleSectionQuestionIndex,
  getSingleSectionQuestionScore,
} from "../../../core/Paperwork/US_TN/common/ScoredAssessmentQuestion";
import { assessmentQuestions } from "../../../core/Paperwork/US_TN/UsTnDiangosticClassification2026/assessmentQuestions";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { UsTnInitialClassification2026Opportunity } from "../UsTn";
import { FormBase } from "./FormBase";

export class UsTnDiagnosticClassification2026Form extends FormBase<
  UsTnInitialClassification2026DraftData,
  UsTnInitialClassification2026Opportunity
> {
  navigateToFormText = "Auto-fill paperwork";

  get formContents(): OpportunityFormComponentName {
    return "FormUsTnDiagnosticClassification2026";
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

    const q3Selection = getSingleSectionQuestionIndex(
      assessmentQuestions[2],
      formInformation.q3Score,
    );

    const q4Selection = getSingleSectionQuestionIndex(
      assessmentQuestions[3],
      formInformation.q4Score,
    );

    const q5Selection = getSingleSectionQuestionIndex(
      assessmentQuestions[4],
      formInformation.q5Score,
    );

    const q6Selection = getSingleSectionQuestionIndex(
      assessmentQuestions[5],
      formInformation.q6Score,
    );

    const q1aNotes =
      formInformation.q1Notes.listPriorNonTdocConvictions60Months;

    const q1bNotes =
      formInformation.q1Notes.listPriorViolentTdocConvictions60Months;

    return {
      ...formInformation,
      q1Selection,
      q2Selection,
      q3Selection,
      q4Selection,
      q5Selection,
      q6Selection,
      q1aNotes,
      q1bNotes,
    };
  }

  get derivedData() {
    const {
      q1Selection,
      q2Selection,
      q3Selection,
      q4Selection,
      q5Selection,
      q6Selection,
    } = this.formData;

    const q1Score = getSingleSectionQuestionScore(
      assessmentQuestions[0],
      q1Selection,
    );
    const q2Score = getSingleSectionQuestionScore(
      assessmentQuestions[1],
      q2Selection,
    );
    const q3Score = getSingleSectionQuestionScore(
      assessmentQuestions[2],
      q3Selection,
    );
    const q4Score = getSingleSectionQuestionScore(
      assessmentQuestions[3],
      q4Selection,
    );
    const q5Score = getSingleSectionQuestionScore(
      assessmentQuestions[4],
      q5Selection,
    );
    const q6Score = getSingleSectionQuestionScore(
      assessmentQuestions[5],
      q6Selection,
    );

    const totalScore = Math.min(
      41,
      q1Score + q2Score + q3Score + q4Score + q5Score + q6Score,
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
      totalScore,
      trusteeEligible,
    };
  }

  get formTemplateData() {
    const { person, formData, derivedData } = this;

    const now = new Date();

    return {
      ...formData,
      ...derivedData,
      omsId: person.externalId,
      downloadDate: now.toLocaleDateString(),
      downloadTime: now.toLocaleTimeString(),
    };
  }
}
