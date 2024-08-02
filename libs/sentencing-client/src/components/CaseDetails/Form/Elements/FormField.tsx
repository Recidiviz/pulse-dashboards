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

import * as Styled from "../../CaseDetails.styles";
import { FormAttributes, FormFieldWithNestedList } from "../../types";
import { CaseDetailsForm } from "../CaseDetailsForm";
import { DropdownField } from "./DropdownField";
import { DropdownMultiSelectField } from "./DropdownMultiSelectField";
import { MultiSelectField } from "./MultiSelectField";
import { RadioSelectField } from "./RadioSelectField";
import { TextInputField } from "./TextInputField";

export const FormField = ({
  element,
  parentKey,
  form,
}: {
  element: FormFieldWithNestedList;
  parentKey?: keyof FormAttributes;
  form: CaseDetailsForm;
}) => {
  const prevValue = form.getFormValue(element.key, parentKey);
  const fieldProps = {
    element,
    parentKey,
    prevValue,
    updateForm: form.updateForm,
    updateFormError: form.updateFormError,
  };

  return (
    <>
      <Styled.InputLabel htmlFor={element.key}>
        {element.label}
      </Styled.InputLabel>

      {(element.inputType === "text" || element.inputType === "number") && (
        <TextInputField {...fieldProps} />
      )}
      {element.inputType === "multi-select" && (
        <MultiSelectField {...fieldProps} />
      )}
      {element.inputType === "radio" && <RadioSelectField {...fieldProps} />}
      {element.inputType === "dropdown" && <DropdownField {...fieldProps} />}
      {element.inputType === "dropdown-multi-select" && (
        <DropdownMultiSelectField {...fieldProps} />
      )}

      {element.description && (
        <Styled.InputDescription>{element.description}</Styled.InputDescription>
      )}
      {element.isDisabled && (
        <Styled.InputDescription>
          {element.disabledMessage}
        </Styled.InputDescription>
      )}
    </>
  );
};
