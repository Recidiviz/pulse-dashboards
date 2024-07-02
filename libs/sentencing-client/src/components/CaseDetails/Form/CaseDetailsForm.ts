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

import { Attributes, FormField, FormFieldList } from "../types";
import { caseDetailsFormTemplate } from "./CaseDetailsFormTemplate";

export class CaseDetailsForm {
  content: { [key: string]: FormField };

  constructor(caseAttributes: Attributes) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.content = this.createForm(caseAttributes);
  }

  get contentList() {
    return Object.values(this.content).map((field) => {
      if (!field.nested) return field;
      return { ...field, nested: Object.values(field.nested) };
    }) as FormFieldList;
  }

  createForm(caseAttributes: Attributes) {
    const previousUpdates = caseDetailsFormTemplate.map((field) => {
      if (caseAttributes[field.key]) {
        const prevValue = caseAttributes[field.key];
        return {
          ...field,
          value: prevValue,
          nested: field.nested?.map((nestedField) => {
            const prevNestedValue = caseAttributes[nestedField.key];
            return prevNestedValue
              ? { ...nestedField, value: prevNestedValue }
              : nestedField;
          }),
        };
      }
      return field;
    });

    return keyBy(
      previousUpdates.map((field) => {
        if (!field.nested) return field;
        return { ...field, nested: keyBy(field.nested, "key") };
      }) as FormField[],
      "key",
    );
  }

  updateForm(
    key: keyof Attributes,
    value?: string | string[] | null,
    parentKey?: string,
    isOtherContext?: boolean,
  ) {
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

  getFormValue(key: keyof Attributes, parentKey?: string) {
    if (parentKey) {
      return this.content[parentKey].nested?.[key]?.value;
    }
    return this.content[key]?.value;
  }
}
