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
import Select, { MultiValue } from "react-select";

import * as Styled from "../../CaseDetails.styles";
import { InputFieldProps, SelectOption } from "../types";
import { OtherContextInputField } from "./OtherContextField";

export const DropdownMultiSelectField: React.FC<InputFieldProps> = ({
  element,
  parentKey,
  prevValue,
  updateForm,
}) => {
  const [currentValue, setCurrentValue] = useState<MultiValue<unknown>>(
    (prevValue as string[])?.map((selection) => ({
      label: selection,
      value: selection,
    })),
  );

  const updateDropdownInput = (options: MultiValue<SelectOption>) => {
    if (!options) return;

    /**
     * Note: there is special handling when selecting the "None" option.
     *  - If there are existing non-"None" selections, and a user selects "None",
     *    then all other selections are cleared except for "None".
     *  - If "None" is the existing selection and a user selects another option,
     *    then the "None" selection is removed.
     */

    const hasNoneOption = options.find(
      (option: SelectOption) => option.value === "None",
    );
    /**
     * "None" as the first option means that the "None" selection already existed
     * before an attempt to add a new item to the list.
     */
    const hasNoneAsFirstOption =
      options.length > 1 && options[0]?.value === "None";

    if (hasNoneOption && !hasNoneAsFirstOption) {
      // Clears out all other pre-selected options except for "None"
      setCurrentValue([{ label: "None", value: "None" }]);
      updateForm(element.key, ["None"], parentKey);
      return;
    }

    // Filter out the "None" option
    const filteredOptions = options.filter((item) => item.value !== "None");
    setCurrentValue(filteredOptions);
    updateForm(
      element.key,
      (filteredOptions as { label: string; value: string }[]).map(
        (selection) => selection.value,
      ),
      parentKey,
    );
  };

  return (
    <>
      <Select
        value={currentValue}
        options={element.options?.map((selection) => ({
          label: selection,
          value: selection,
        }))}
        isMulti
        styles={Styled.dropdownStyles}
        onChange={(value) => {
          updateDropdownInput(value as MultiValue<SelectOption>);
          element.onChange && element.onChange();
        }}
      />
      <OtherContextInputField
        {...{ element, parentKey, prevValue, updateForm }}
      />
    </>
  );
};
