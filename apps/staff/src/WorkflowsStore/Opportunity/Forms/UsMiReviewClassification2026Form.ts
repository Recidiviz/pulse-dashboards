// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
  calculateUsMiAgeOptionSelection,
  calculateUsMiVfoOptionSelection,
  countUsMiIncidents,
  deriveMiReviewClassification,
  getUsMiIncidentsInPeriod,
  hasUsMiFourMonthGoodBehavior,
  miFemaleReviewClassificationQuestions,
  miMaleReviewClassificationQuestions,
  US_MI_GOOD_BEHAVIOR_PAST_YEAR_SCORE,
  UsMiAssessmentSectionsSpec,
  UsMiFormReviewInformation,
  usMiOverrideSelections,
  UsMiReviewClassification2026DraftData,
  usMiSecurityLevelsForGender,
} from "~datatypes";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { Resident } from "../../Resident";
import { FormBase } from "./FormBase";
import {
  calculateRemaining,
  overridesCompleted,
} from "./UsMiInitialClassification2026Form";

const ReviewKeySelections = [
  "s1q1Selection",
  "s1q2Selection",

  "s2q3Selection",
  "s2q4Selection",
  "s2q5Selection",
  "s2q6Selection",
  "s2q7Selection",
  "s2q8Selection",
  "s2q9Selection",
  "s2q10Selection",
  "s2q11Selection",
  "s2q12Selection",
  "s2q13Selection",

  "s3q14Selection",
  "s3q15Selection",
  "s3q16Selection",
  "s3q17Selection",
] as const;

function getHighProgramCompletion(count: number | null | undefined) {
  if (count === undefined || count === null) return 1;
  return count > 0 ? 0 : 1;
}

// With neither score on record, the selection is left for the user to fill in.
function getGoodBehaviorSelection(
  pastFourMonthsScore: number | null,
  pastYearScore: number | null,
) {
  if (pastFourMonthsScore === null && pastYearScore === null) return undefined;
  if (hasUsMiFourMonthGoodBehavior(pastFourMonthsScore)) return 0;
  if (pastYearScore === US_MI_GOOD_BEHAVIOR_PAST_YEAR_SCORE) return 1;
  return 2;
}

// With no recorded completions, the count is 0 rather than left for the user
// to fill in.
function getCoreProgramCompletion(
  notes: UsMiFormReviewInformation["programCompleteCoreNotes"],
) {
  return (
    notes?.coreProgramCompletionCount ??
    notes?.coreProgramCompletionsList?.length ??
    0
  );
}

function inferredMiClassificationData(
  formInformation: UsMiFormReviewInformation,
  gender: string | undefined,
): Partial<UsMiReviewClassification2026DraftData> {
  if (gender === undefined) return {};
  const questionsList =
    gender === "MALE"
      ? miMaleReviewClassificationQuestions
      : miFemaleReviewClassificationQuestions;

  const s1q1Selection = calculateUsMiAgeOptionSelection(
    questionsList[0].questions[0],
    formInformation.ageNotes,
  );

  const s1q2Selection = calculateUsMiVfoOptionSelection(
    questionsList[0].questions[1],
    formInformation.vfoNotes?.vfoLevelDetail,
  );

  const s2q3Selection =
    formInformation?.pastAdSegNotes?.numAdSegStartsInPast36Months;

  //  6 months
  const s2q4Notes = getUsMiIncidentsInPeriod(
    formInformation.currentViolentIncNotes?.incidentsList,
    "0-6 months",
  );
  const s2q4Selection = countUsMiIncidents(s2q4Notes);

  // 6-12 months
  const s2q5Notes = getUsMiIncidentsInPeriod(
    formInformation.currentViolentIncNotes?.incidentsList,
    "6-12 months",
  );

  const s2q5Selection = countUsMiIncidents(s2q5Notes);

  // 12 -24 months
  const s2q6Notes = getUsMiIncidentsInPeriod(
    formInformation.currentViolentIncNotes?.incidentsList,
    "12-24 months",
  );
  const s2q6Selection = countUsMiIncidents(s2q6Notes);

  // 24 - 36 months
  const s2q7Notes = getUsMiIncidentsInPeriod(
    formInformation.currentViolentIncNotes?.incidentsList,
    "24-36 months",
  );

  const s2q7Selection = countUsMiIncidents(s2q7Notes);

  // 0-36 months
  const s2q8Selection = countUsMiIncidents(formInformation.pastViolentIncNotes);

  // --- misconducts for fighting - etc etc

  //  0 - 6 months
  const s2q9Notes = getUsMiIncidentsInPeriod(
    formInformation.currentFightThreatPowIncNotes?.incidentsList,
    "0-6 months",
  );
  const s2q9Selection = countUsMiIncidents(s2q9Notes);

  // 6-12 months
  const s2q10Notes = getUsMiIncidentsInPeriod(
    formInformation.currentFightThreatPowIncNotes?.incidentsList,
    "6-12 months",
  );

  const s2q10Selection = countUsMiIncidents(s2q10Notes);

  const s2q11Notes = getUsMiIncidentsInPeriod(
    formInformation.currentFightThreatPowIncNotes?.incidentsList,
    "12-36 months",
  );

  const s2q11Selection = countUsMiIncidents(s2q11Notes);

  //  0 - 36 months
  const s2q12Selection = countUsMiIncidents(
    formInformation.pastFightThreatPowIncNotes,
  );

  const s2q13Selection = countUsMiIncidents(
    formInformation.currentOtherIncNotes,
  );

  const s3q14Selection = getGoodBehaviorSelection(
    formInformation.goodBehPastFourMonthScore,
    formInformation.goodBehPastYearScore,
  );

  const s3q15Selection = getCoreProgramCompletion(
    formInformation.programCompleteCoreNotes,
  );

  const s3q16Selection = getHighProgramCompletion(
    formInformation.programCompleteHighNotes?.highProgramCompletionCount,
  );

  const s1q1Notes = formInformation.ageNotes;

  const s1q2Notes = formInformation.vfoNotes;

  const s2q3Notes = formInformation.pastAdSegNotes;
  const s2q8Notes = formInformation.pastViolentIncNotes;

  const s2q12Notes = formInformation.pastFightThreatPowIncNotes;

  const s2q13Notes = formInformation.currentOtherIncNotes;

  const s3q14Notes = hasUsMiFourMonthGoodBehavior(
    formInformation.goodBehPastFourMonthScore,
  )
    ? formInformation.goodBehPastFourMonthNotes
    : formInformation.goodBehPastYearNotes;

  const s3q15Notes =
    formInformation.programCompleteCoreNotes?.coreProgramCompletionsList;

  const s3q16Notes =
    formInformation.programCompleteHighNotes?.highProgramCompletionsList;

  return {
    s1q1Selection,
    s1q2Selection,

    // section 2
    s2q3Selection,
    s2q4Selection,
    s2q5Selection,
    s2q6Selection,
    s2q7Selection,
    s2q8Selection,
    s2q9Selection,
    s2q10Selection,
    s2q11Selection,
    s2q12Selection,
    s2q13Selection,

    // section 3
    s3q14Selection,
    s3q15Selection,
    s3q16Selection,

    s1q1Notes,
    s1q2Notes,
    s2q3Notes,
    s2q4Notes,
    s2q5Notes,
    s2q6Notes,
    s2q7Notes,
    s2q8Notes,
    s2q9Notes,
    s2q10Notes,
    s2q11Notes,
    s2q12Notes,
    s2q13Notes,
    s3q14Notes,
    s3q15Notes,
    s3q16Notes,
  };
}

export class UsMiReviewClassificationForm extends FormBase<UsMiReviewClassification2026DraftData> {
  get navigateToFormText(): string {
    return this.opportunity.isSubmitted
      ? "Review classification"
      : "Auto-fill classification";
  }

  get formContents(): OpportunityFormComponentName {
    return "FormUsMiClassification";
  }

  get formTitle() {
    return "Review";
  }

  get remainingFields() {
    return calculateRemaining(this.formData, ReviewKeySelections);
  }

  prefilledDataTransformer() {
    const {
      opportunity: {
        record: { formInformation },
      },
      person,
    } = this;

    const inferredData = inferredMiClassificationData(
      formInformation,
      (person as Resident).gender,
    );

    return {
      ...formInformation,
      ...inferredData,
    };
  }

  get questionList(): UsMiAssessmentSectionsSpec[] | undefined {
    const person = this.person as Resident;
    if (person.stateCode === "US_MI") {
      const questionList =
        person.gender === "MALE"
          ? miMaleReviewClassificationQuestions
          : miFemaleReviewClassificationQuestions;
      return questionList;
    }
  }

  get displayCustodyLevel() {
    const person = this.person as Resident;
    if (person.stateCode === "US_MI") {
      const level = person.displayCustodyLevel.split("Security");
      if (level[0].trim() === "Unknown") return "Unknown";
      return level[1].trim();
    }
  }

  get subsections() {
    const list: string[] = [];
    miMaleReviewClassificationQuestions.forEach((section) => {
      list.push(section.title);
    });
    return list;
  }

  get derivedData() {
    const { person } = this;
    return deriveMiReviewClassification(
      this.formData,
      (person as Resident).gender,
    );
  }

  get proceedToPreview() {
    return overridesCompleted(
      this.formData,
      usMiOverrideSelections,
      usMiSecurityLevelsForGender((this.person as Resident).gender),
    );
  }
}
