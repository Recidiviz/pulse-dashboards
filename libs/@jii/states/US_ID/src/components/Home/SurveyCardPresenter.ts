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

import { makeAutoObservable } from "mobx";

import { IntakeAssessmentPresenter } from "~@jii/case-planning";
import { UserStore } from "~@jii/data";
import { UsIdTranslationsObject } from "~@jii/translation";
import { WorkflowsResidentRecord } from "~datatypes";
import { FirebaseAuthClient } from "~firebase-auth";
import { Hydratable } from "~hydration-utils";

type CardCopy = UsIdTranslationsObject["reentry"]["surveyCard"];

export class SurveyCardPresenter implements Hydratable {
  private intakeAuth: IntakeAssessmentPresenter;

  constructor(
    resident: WorkflowsResidentRecord,
    firebaseAuthClient: FirebaseAuthClient,
    userStore: UserStore,
    private copy: CardCopy,
  ) {
    makeAutoObservable(this);

    this.intakeAuth = new IntakeAssessmentPresenter(
      firebaseAuthClient,
      userStore,
      resident,
    );
  }

  hydrate() {
    this.intakeAuth.hydrate();
  }

  get hydrationState() {
    return this.intakeAuth.hydrationState;
  }

  private get residentHasSurvey(): boolean {
    return this.intakeAuth.isAuthorized;
  }

  get heading() {
    return this.copy.heading;
  }

  private get conditionalCopy(): CardCopy["survey"] | CardCopy["noSurvey"] {
    return this.residentHasSurvey ? this.copy.survey : this.copy.noSurvey;
  }

  get chip() {
    return this.conditionalCopy.chip;
  }

  get chipColor(): "red" | "green" {
    return this.residentHasSurvey ? "green" : "red";
  }

  get value() {
    return this.conditionalCopy.value;
  }

  get body() {
    return this.conditionalCopy.body;
  }

  get linkText() {
    return "linkText" in this.conditionalCopy
      ? this.conditionalCopy.linkText
      : undefined;
  }
}
