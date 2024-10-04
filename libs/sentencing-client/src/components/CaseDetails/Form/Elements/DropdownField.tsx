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

import { useState } from "react";
import Select from "react-select";

import { InputFieldProps, SelectOption } from "../types";
import { fuzzyMatch } from "../utils";
import { OtherContextInputField } from "./OtherContextField";

export const DropdownField: React.FC<InputFieldProps> = ({
  element,
  parentKey,
  prevValue,
  updateForm,
}) => {
  const [currentValue, setCurrentValue] = useState<SelectOption | null>({
    label: String(prevValue),
    value: prevValue,
  });

  const updateDropdownInput = (option?: SelectOption | null) => {
    if (!option) return;

    setCurrentValue(option);
    updateForm(element.key, option.value, parentKey);
  };

  const customFilter = (option: SelectOption, inputValue: string) => {
    if (!inputValue) return true;
    return fuzzyMatch(inputValue, option);
  };

  return (
    <>
      <Select
        placeholder={element.placeholder}
        value={currentValue?.value ? currentValue : null}
        options={element.options?.map((selection) => ({
          label: selection,
          value: selection,
        }))}
        onChange={(value) => {
          updateDropdownInput(value);
          element.onChange && element.onChange();
        }}
        isDisabled={element.isDisabled}
        filterOption={customFilter}
      />
      <OtherContextInputField
        {...{ element, parentKey, prevValue, updateForm }}
      />
    </>
  );
};
