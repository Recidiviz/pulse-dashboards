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
import { FormFieldList } from "../../types";
import { CaseDetailsForm } from "../CaseDetailsForm";
import { FormField } from "./FormField";

type FormProps = {
  form: CaseDetailsForm;
  formFields: FormFieldList;
};

export const Form: React.FC<FormProps> = ({ form, formFields }) => {
  return (
    <Styled.Form>
      {formFields.map((element) => {
        if (!element) return;
        const showNestedFields = Array.isArray(element.value)
          ? element.value.some((val) =>
              element.showNestedValuesMatch?.includes(val),
            )
          : element.showNestedValuesMatch?.includes(String(element.value));

        return (
          <Styled.InputWrapper key={element.key}>
            <FormField element={element} form={form} />

            {element.nested &&
              showNestedFields &&
              element.nested.map((nestedElement) => (
                <Styled.NestedWrapper key={nestedElement.key}>
                  <FormField
                    element={nestedElement}
                    form={form}
                    parentKey={element.key}
                  />
                </Styled.NestedWrapper>
              ))}
          </Styled.InputWrapper>
        );
      })}
    </Styled.Form>
  );
};
