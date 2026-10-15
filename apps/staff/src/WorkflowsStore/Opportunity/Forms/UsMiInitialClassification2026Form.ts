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
  miFemaleInitialClassificationQuestions,
  miMaleInitialClassificationQuestions,
  UsMiAssessmentSectionsSpec,
  UsMiInitialClassification2026DraftData,
} from "~datatypes";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { Resident } from "../../Resident";
import { FormBase } from "./FormBase";

export class UsMiClassificationForm extends FormBase<UsMiInitialClassification2026DraftData> {
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
      const level = person.displayCustodyLevel.split("Security");
      if (level[0].trim() === "Unknown") return "Unknown";
      return level[1].trim();
    }
  }
}
