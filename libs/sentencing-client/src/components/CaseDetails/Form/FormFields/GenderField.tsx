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

import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import { CLIENT_GENDER_KEY, GenderToDisplayName } from "../../constants";
import { UNKNOWN_OPTION } from "../constants";
import { Dropdown } from "../Elements/Dropdown";
import { form } from "../FormStore";
import { FormFieldProps, SelectOption } from "../types";
import { useFormField } from "../useFormFields";
import { parseClientGenderValue } from "../utils";

const genderOptions = Object.values(GenderToDisplayName).filter(
  (gender) => gender !== UNKNOWN_OPTION,
);

function GenderField({ isRequired }: FormFieldProps) {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;
  const options = genderOptions.map((selection) => ({
    label: selection,
    value: selection,
  }));

  const { selectValue, setSelectValue } = useFormField({
    initialSelectValue: {
      label: parseClientGenderValue(caseAttributes?.clientGender),
      value: caseAttributes?.clientGender,
    },
  });

  const updateDropdownInput = (option?: SelectOption | null) => {
    if (!option) return;

    setSelectValue(option);
    form.updateForm(CLIENT_GENDER_KEY, option.value, isRequired);
  };

  return (
    <>
      <Styled.InputLabel>
        Gender {isRequired && <span>Required*</span>}
      </Styled.InputLabel>

      <Dropdown
        value={selectValue?.value ? selectValue : null}
        options={options}
        onChange={(value) => updateDropdownInput(value as SelectOption)}
        styles={Styled.dropdownStyles}
        isDisabled={caseAttributes.client?.isGenderLocked}
      />

      {caseAttributes.client?.isGenderLocked && (
        <Styled.InputDescription>
          This score has been pulled in from Atlas and is unable to be edited.
        </Styled.InputDescription>
      )}
    </>
  );
}

export default observer(GenderField);
