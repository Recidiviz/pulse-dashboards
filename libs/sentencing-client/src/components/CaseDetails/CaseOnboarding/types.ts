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

import { CaseDetailsForm } from "../Form/CaseDetailsForm";
import { FormFieldList, MutableCaseAttributes } from "../types";

export enum OnboardingTopic {
  OffenseLsirScore = "OffenseLsirScore",
  PrimaryNeeds = "PrimaryNeeds",
  AdditionalNeeds = "AdditionalNeeds",
  Done = "Done",
}

export type CaseOnboardingProps = {
  form?: CaseDetailsForm;
  firstName?: string;
  lastTopic?: MutableCaseAttributes["currentOnboardingTopic"];
  saveAttributes: (options?: { showToast: boolean }) => void;
  navigateToDashboard: () => void;
  updateOnboardingTopicStatus: (
    currentTopic: MutableCaseAttributes["currentOnboardingTopic"],
  ) => Promise<void>;
};

export type CaseOnboardingTopicProps = {
  form: CaseDetailsForm;
  firstName?: string;
};

export type OnboardingFields = {
  OFFENSE_LSIR_SCORE_FIELDS: FormFieldList;
  PRIMARY_NEEDS_FIELD: FormFieldList;
  ADDITIONAL_NEEDS_FIELDS: FormFieldList;
};
