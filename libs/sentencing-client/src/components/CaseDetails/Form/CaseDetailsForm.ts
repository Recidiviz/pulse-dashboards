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

import { LSIR_SCORE_KEY } from "../constants";
import {
  Attributes,
  FormField,
  FormFieldList,
  FormUpdates,
  FormValue,
  MutableCaseAttributes,
} from "../types";
import { caseDetailsFormTemplate } from "./CaseDetailsFormTemplate";
import { parseFormValue, transformUpdates } from "./utils";

export class CaseDetailsForm {
  content: { [key: string]: FormField };

  updates: FormUpdates;

  hasError: boolean;

  constructor(private readonly caseAttributes: Attributes) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.content = this.createForm(caseAttributes);
    this.updates = {} as FormUpdates;
    this.hasError = false;
  }

  get contentList() {
    return Object.values(this.content).map((field) => {
      if (!field.nested) return field;
      return { ...field, nested: Object.values(field.nested) };
    }) as FormFieldList;
  }

  get transformedUpdates(): MutableCaseAttributes {
    return transformUpdates(this.updates);
  }

  createForm(caseAttributes: Attributes) {
    const withPreviousUpdates = caseDetailsFormTemplate.map((field) => {
      const attributeValue = caseAttributes[field.key];
      if (attributeValue === undefined) {
        return field;
      }
      return {
        ...field,
        value: parseFormValue(field.key, attributeValue),
        nested: field.nested?.map((nestedField) => {
          const nestedAttributeValue = caseAttributes[nestedField.key];
          if (nestedAttributeValue === undefined) {
            return nestedField;
          }
          return {
            ...nestedField,
            value: parseFormValue(nestedField.key, nestedAttributeValue),
          };
        }),
        otherContext: {
          ...field.otherContext,
          value: field.otherContext?.key
            ? parseFormValue(
                field.otherContext.key,
                caseAttributes[field.otherContext.key],
              )
            : field.otherContext?.value,
        },
        isDisabled:
          // TODO(Recidiviz/recidiviz-data#31228) Determine this from the new to-be-added `lsirScoreLocked` field
          field.key === LSIR_SCORE_KEY && caseAttributes.lsirScore !== null,
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
    key: keyof Attributes,
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

  getFormValue(key: keyof Attributes, parentKey?: string) {
    if (parentKey) {
      return this.content[parentKey].nested?.[key]?.value;
    }
    return this.content[key]?.value;
  }

  resetUpdates() {
    this.content = this.createForm(this.caseAttributes);
  }
}
