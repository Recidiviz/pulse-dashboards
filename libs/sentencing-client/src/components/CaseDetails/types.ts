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

import { Case, Client } from "../../api";

export enum RecommendationType {
  Probation = "Probation",
  Rider = "Rider",
  Term = "Term",
  None = "None",
}

export enum ProfileStrength {
  High = "High",
  Medium = "Medium",
  Low = "Low",
}

export type Attributes = Omit<
  Partial<Case & Client>,
  "recommendedOpportunities"
>;

export type FormValue = number | string | string[] | boolean | null | undefined;

export type FormFieldBase = {
  key: keyof Attributes;
  label: string;
  value: FormValue;
  inputType:
    | "text"
    | "number"
    | "multi-select"
    | "dropdown"
    | "dropdown-multi-select"
    | "radio";
  description?: string;
  placeholder?: string;
  minMaxRange?: { min: number; max: number };
  options?: string[];
  showOtherContextValuesMatch?: string[];
  otherContext?: {
    key: keyof Attributes;
    placeholder?: string;
    value: FormValue;
  };
  showNestedValuesMatch?: string[];
  isRequired?: boolean;
  isDisabled?: boolean;
  disabledMessage?: string;
  validationErrorMessage?: string;
};

export type FormField = FormFieldBase & {
  nested?: { [key: string]: FormFieldBase };
};

export type FormFieldWithNestedList = FormFieldBase & {
  nested?: FormFieldBase[];
};

export type FormFieldList = FormFieldWithNestedList[];

export type FormUpdates = Record<keyof Attributes, FormValue>;

export type MutableCaseAttributes = Partial<
  Pick<
    Case,
    | "lsirScore"
    | "offense"
    | "previouslyIncarceratedOrUnderSupervision"
    | "hasPreviousFelonyConviction"
    | "hasPreviousViolentOffenseConviction"
    | "hasPreviousSexOffenseConviction"
    | "previousTreatmentCourt"
    | "substanceUseDisorderDiagnosis"
    | "asamCareRecommendation"
    | "mentalHealthDiagnoses"
    | "otherMentalHealthDiagnosis"
    | "hasDevelopmentalDisability"
    | "isVeteran"
    | "plea"
    | "hasOpenChildProtectiveServicesCase"
    | "needsToBeAddressed"
    | "otherNeedToBeAddressed"
    | "status"
    | "selectedRecommendation"
    | "currentOnboardingTopic"
  >
>;

export type NonNullableKey<T> = T extends null ? never : T;

export type NonArrayType<T> = T extends (infer U)[] ? U : T;
