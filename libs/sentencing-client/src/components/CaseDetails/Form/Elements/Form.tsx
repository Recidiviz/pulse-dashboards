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

import { observer } from "mobx-react-lite";

import * as Styled from "../../CaseDetails.styles";
import { LSIR_SCORE_KEY } from "../../constants";
import { FormFieldList } from "../../types";
import { CaseDetailsForm } from "../CaseDetailsForm";
import { FormField } from "./FormField";

type FormProps = {
  form: CaseDetailsForm;
  formFields: FormFieldList;
};

// eslint-disable-next-line react/display-name
export const Form: React.FC<FormProps> = observer(({ form, formFields }) => {
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

            {element.key === LSIR_SCORE_KEY && form.insight && (
              <Styled.RollupOffenseCategory>
                <Styled.InputLabel>Recidivism Cohort</Styled.InputLabel>
                <span>{form.insight?.rollupOffense}</span>
                <Styled.InputDescription>
                  In order to provide recidivism rates based on a sufficient
                  sample size, we need to broaden the group of similar cases we
                  use to compare this case to. The new cohort may include all
                  genders, risk scores, and/or a more general category of
                  offense. A description of the cohort is listed above. If you
                  think this categorization is inaccurate, reach out to
                  Recidiviz.
                </Styled.InputDescription>
              </Styled.RollupOffenseCategory>
            )}
          </Styled.InputWrapper>
        );
      })}
    </Styled.Form>
  );
});
