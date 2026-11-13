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
  calculateUsMiReleasedFromLevelFive,
  calculateUsMiVfoOptionSelection,
  countUsMiIncidents,
  deriveMiInitialClassification,
  miFemaleInitialClassificationQuestions,
  miMaleInitialClassificationQuestions,
  UsMiAssessmentSectionsSpec,
  UsMiFormInitialInformation,
  UsMiInitialClassification2026DraftData,
  usMiOverrideSelections,
  usMiSecurityLevelsForGender,
} from "~datatypes";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { Resident } from "../../Resident";
import { FormBase } from "./FormBase";

export function inferredMiClassificationData(
  formInformation: UsMiFormInitialInformation,
  gender: string | undefined,
): Partial<UsMiInitialClassification2026DraftData> {
  if (gender === undefined) return {};
  const questionsList =
    gender === "MALE"
      ? miMaleInitialClassificationQuestions
      : miFemaleInitialClassificationQuestions;

  const s1q1Selection = calculateUsMiAgeOptionSelection(
    questionsList[0].questions[0],
    formInformation.ageNotes,
  );

  const s1q2Selection = calculateUsMiVfoOptionSelection(
    questionsList[0].questions[1],
    formInformation.vfoNotes?.vfoLevelDetail,
  );

  const s2q3Selection = calculateUsMiReleasedFromLevelFive(
    formInformation?.prevLevelFiveNotes,
  );

  const s3q5Selection =
    formInformation?.pastAdSegNotes?.numAdSegStartsInPast36Months;

  const s3q7Selection = countUsMiIncidents(
    formInformation.currentViolentIncNotes,
  );

  const s3q8Selection = countUsMiIncidents(formInformation.pastViolentIncNotes);

  const s3q9Selection = countUsMiIncidents(
    formInformation.currentFightThreatPowIncNotes,
  );

  const s3q10Selection = countUsMiIncidents(
    formInformation.pastFightThreatPowIncNotes,
  );

  const s3q11Selection = countUsMiIncidents(
    formInformation.currentOtherIncNotes,
  );

  const s1q1Notes = formInformation.ageNotes;

  const s1q2Notes = formInformation.vfoNotes;

  const s2q3Notes = formInformation.prevLevelFiveNotes;

  const s2q4Notes = formInformation.felonyConvictionsNotes;

  const s3q5Notes = formInformation.pastAdSegNotes;

  const s3q7Notes = formInformation.currentViolentIncNotes;
  const s3q8Notes = formInformation.pastViolentIncNotes;
  const s3q9Notes = formInformation.currentFightThreatPowIncNotes;
  const s3q10Notes = formInformation.pastFightThreatPowIncNotes;
  const s3q11Notes = formInformation.currentOtherIncNotes;

  return {
    s1q1Selection,
    s1q2Selection,
    s2q3Selection,
    s3q5Selection,
    s3q7Selection,
    s3q8Selection,
    s3q9Selection,
    s3q10Selection,
    s3q11Selection,
    s1q1Notes,
    s1q2Notes,
    s2q3Notes,
    s2q4Notes,
    s3q5Notes,
    s3q7Notes,
    s3q8Notes,
    s3q9Notes,
    s3q10Notes,
    s3q11Notes,
  };
}

const InitialKeySelections = [
  "s1q1Selection",
  "s1q2Selection",
  "s2q3Selection",
  "s2q4Selection",
  "s3q5Selection",
  "s3q6Selection",
  "s3q7Selection",
  "s3q8Selection",
  "s3q9Selection",
  "s3q10Selection",
  "s3q11Selection",
] as const;

/**
 * Returns whether every override with a reason selected also has a level
 * selected from securityLevels.
 *
 * Level selections are dropdown indexes with the "Select a level..."
 * placeholder at 0, so valid values run from 1 to securityLevels.length. A
 * draft saved against a longer level list, such as a female draft that chose
 * Level V before female residents lost that level, can hold a value past the
 * end; that override counts as incomplete so the user has to choose again.
 */
export function overridesCompleted(
  formData: Partial<UsMiInitialClassification2026DraftData>,
  overrideSelections: { [key: string]: string },
  securityLevels: string[],
) {
  return Object.entries(overrideSelections).every(([reasonKey, levelKey]) => {
    const reason = formData[reasonKey];
    if (reason === undefined || reason === "") return true;

    const level = formData[levelKey];
    return (
      typeof level === "number" && level >= 1 && level <= securityLevels.length
    );
  });
}

export function calculateRemaining(
  formData: Partial<UsMiInitialClassification2026DraftData>,
  keySelections: readonly string[],
) {
  let count = 0;

  keySelections.forEach((key) => {
    if (typeof formData[key] !== "number") count += 1;
  });
  return count;
}

export class UsMiInitialClassificationForm extends FormBase<UsMiInitialClassification2026DraftData> {
  get navigateToFormText(): string {
    return this.opportunity.isSubmitted
      ? "Review classification"
      : "Auto-fill classification";
  }

  get formContents(): OpportunityFormComponentName {
    return "FormUsMiClassification";
  }

  get questionList(): UsMiAssessmentSectionsSpec[] | undefined {
    const person = this.person as Resident;
    if (person.stateCode === "US_MI") {
      const questionList =
        person.gender === "MALE"
          ? miMaleInitialClassificationQuestions
          : miFemaleInitialClassificationQuestions;
      return questionList;
    }
  }

  get displayCustodyLevel(): string | undefined {
    const person = this.person as Resident;
    if (person.stateCode === "US_MI") {
      const [prefix, suffix] = person.displayCustodyLevel.split("Security");
      if (prefix.trim() === "Unknown") return "Unknown";
      return suffix?.trim() || person.displayCustodyLevel;
    }
  }

  get formTitle() {
    return "Initial Classification";
  }

  get subsections() {
    const list: string[] = [];
    miMaleInitialClassificationQuestions.forEach((section) => {
      list.push(section.title);
    });
    return list;
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

  get derivedData() {
    const { person } = this;
    return deriveMiInitialClassification(
      this.formData,
      (person as Resident).gender,
    );
  }

  get remainingFields() {
    return calculateRemaining(this.formData, InitialKeySelections);
  }

  revertForm() {
    this.revert();
  }

  get proceedToPreview() {
    return overridesCompleted(
      this.formData,
      usMiOverrideSelections,
      usMiSecurityLevelsForGender((this.person as Resident).gender),
    );
  }
}
