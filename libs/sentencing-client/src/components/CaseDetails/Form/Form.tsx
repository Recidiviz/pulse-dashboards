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

import { filterExcludedAttributes } from "../../../../src/geoConfigs/utils";
import { useStore } from "../../StoreProvider/StoreProvider";
import * as Styled from "../CaseDetails.styles";
import { COUNTIES_KEY, PROTECTIVE_FACTORS_KEY } from "../constants";
import { FormFieldWithNestedFields } from "./types";

function Form({
  formFields,
}: {
  formFields: FormFieldWithNestedFields[];
}): JSX.Element {
  const { caseStore, activeFeatureVariants } = useStore();
  const stateCode = caseStore.stateCode;
  const filteredFormFields = formFields
    .map((field) => {
      if (field.nestedFields) {
        field.nestedFields = field.nestedFields.filter(
          filterExcludedAttributes(stateCode),
        );
      }
      return field;
    })
    .filter(filterExcludedAttributes(stateCode))
    .filter((field) => {
      if (
        (!activeFeatureVariants["protectiveFactors"] &&
          field.key === PROTECTIVE_FACTORS_KEY) ||
        (!activeFeatureVariants["editCountyFields"] &&
          field.key === COUNTIES_KEY)
      ) {
        return false;
      }
      return true;
    });

  return (
    <Styled.Form>
      {filteredFormFields.map(
        ({ key, FieldComponent, nestedFields, isRequired }) => {
          return (
            <Styled.InputWrapper key={key}>
              <FieldComponent
                nestedFields={nestedFields}
                isRequired={isRequired}
              />
            </Styled.InputWrapper>
          );
        },
      )}
    </Styled.Form>
  );
}

export default observer(Form);
