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

import { keyBy } from "lodash";
import { makeAutoObservable } from "mobx";

import { Case } from "../../../api/APIClient";
import { OnboardingFields } from "../CaseOnboarding/types";
import {
  HAS_DEVELOPMENTAL_DISABILITY_KEY,
  HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
  IS_VETERAN_KEY,
  LSIR_SCORE_KEY,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  NEEDS_TO_BE_ADDRESSED_KEY,
  OFFENSE_KEY,
  PLEA_KEY,
  PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../constants";
import {
  FormAttributes,
  FormField,
  FormFieldList,
  FormUpdates,
  FormValue,
} from "../types";
import { caseDetailsFormTemplate } from "./CaseDetailsFormTemplate";
import {
  isValidLsirScore,
  parseAttributeValue,
  transformUpdates,
} from "./utils";

export class CaseDetailsForm {
  content: { [key: string]: FormField };

  updates: FormUpdates;

  hasError: boolean;

  constructor(
    private readonly caseAttributes: Case,
    private readonly offenses: string[],
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.hasError = false;
    this.content = this.createForm(caseAttributes);
    this.updates = {} as FormUpdates;
  }

  get contentList() {
    return Object.values(this.content).map((field) => {
      if (!field.nested) return field;
      return { ...field, nested: Object.values(field.nested) };
    }) as FormFieldList;
  }

  get onboardingFields() {
    const fields = this.contentList.reduce(
      (acc, field) => {
        if ([OFFENSE_KEY, LSIR_SCORE_KEY].includes(field.key)) {
          acc.OFFENSE_LSIR_SCORE_FIELDS.push(field);
        }
        if (field.key === NEEDS_TO_BE_ADDRESSED_KEY) {
          acc.PRIMARY_NEEDS_FIELD.push(field);
        }
        if (
          [
            SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
            MENTAL_HEALTH_DIAGNOSES_KEY,
            IS_VETERAN_KEY,
            PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
            HAS_DEVELOPMENTAL_DISABILITY_KEY,
            HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
            PLEA_KEY,
          ].includes(field.key)
        ) {
          acc.ADDITIONAL_NEEDS_FIELDS.push(field);
        }

        return acc;
      },
      {
        OFFENSE_LSIR_SCORE_FIELDS: [],
        PRIMARY_NEEDS_FIELD: [],
        ADDITIONAL_NEEDS_FIELDS: [],
      } as OnboardingFields,
    );
    return fields;
  }

  get transformedUpdates(): FormAttributes {
    return transformUpdates(this.updates);
  }

  createForm(caseAttributes: Case) {
    const withPreviousUpdates = caseDetailsFormTemplate.map((field) => {
      const attributeValue = caseAttributes[field.key];
      const invalidLsirScore =
        field.key === LSIR_SCORE_KEY &&
        attributeValue &&
        !isValidLsirScore(String(attributeValue));
      if (attributeValue === undefined && field.key !== OFFENSE_KEY) {
        return field;
      }

      if (invalidLsirScore) {
        this.updateFormError(true);
      }

      return {
        ...field,
        options: field.key === OFFENSE_KEY ? this.offenses : field.options,
        value: parseAttributeValue(field.key, attributeValue),
        nested: field.nested?.map((nestedField) => {
          const nestedAttributeValue = caseAttributes[nestedField.key];
          if (nestedAttributeValue === undefined) {
            return nestedField;
          }
          return {
            ...nestedField,
            value: parseAttributeValue(nestedField.key, nestedAttributeValue),
          };
        }),
        otherContext: {
          ...field.otherContext,
          value: field.otherContext?.key
            ? parseAttributeValue(
                field.otherContext.key,
                caseAttributes[field.otherContext.key],
              )
            : field.otherContext?.value,
        },
        isDisabled:
          field.key === LSIR_SCORE_KEY && caseAttributes.isLsirScoreLocked,
      };
    });

    return keyBy(
      withPreviousUpdates.map((field) => {
        if (!field.nested) return field;
        return { ...field, nested: keyBy(field.nested, "key") };
      }) as FormField[],
      "key",
    );
  }

  updateForm(
    key: keyof FormAttributes,
    value?: FormValue,
    parentKey?: string,
    isOtherContext?: boolean,
  ) {
    const otherContextKey = this.content[key]?.otherContext?.key;
    const keyOrContextKey =
      isOtherContext && otherContextKey ? otherContextKey : key;

    this.updates[keyOrContextKey] =
      key === "lsirScore" && value ? Number(value) : value;

    if (parentKey && this.content[parentKey].nested?.[key]) {
      if (
        isOtherContext &&
        this.content[parentKey].nested?.[key].otherContext
      ) {
        // @ts-expect-error This scope's if-clause guarantees the below left-hand side assignment expression is defined
        this.content[parentKey].nested[key].otherContext.value = value ?? null;
        return;
      }

      // @ts-expect-error This scope's if-clause guarantees the below left-hand side assignment expression is defined
      this.content[parentKey].nested[key].value = value ?? null;
      return;
    }

    if (isOtherContext && this.content[key].otherContext) {
      // @ts-expect-error This scope's if-clause guarantees the below left-hand side assignment expression is defined
      this.content[key].otherContext.value = value ?? null;
      return;
    }
    this.content[key].value = value ?? null;
  }

  updateFormError(hasError: boolean) {
    this.hasError = hasError;
  }

  getFormValue(key: keyof Case, parentKey?: string) {
    if (parentKey) {
      return this.content[parentKey].nested?.[key]?.value;
    }
    return this.content[key]?.value;
  }

  resetUpdates() {
    this.content = this.createForm(this.caseAttributes);
  }
}
