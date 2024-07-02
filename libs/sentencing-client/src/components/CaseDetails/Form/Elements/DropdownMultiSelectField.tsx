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
import { InputFieldProps } from "../types";
import { OtherContextInputField } from "./OtherContextField";

export const DropdownMultiSelectField: React.FC<InputFieldProps> = ({
  element,
  parentKey,
  prevValue,
  updateForm,
}) => {
  const [, setCurrentValue] = useState<MultiValue<unknown>>(
    (prevValue as string[])?.map((selection) => ({
      label: selection,
      value: selection,
    })),
  );

  const updateDropdownInput = (option: MultiValue<unknown>) => {
    if (!option) return;

    setCurrentValue(option);
    updateForm(
      element.key,
      (option as { label: string; value: string }[]).map(
        (selection) => selection.value,
      ),
      parentKey,
    );
  };

  return (
    <>
      <Select
        options={element.options?.map((selection) => ({
          label: selection,
          value: selection,
        }))}
        isMulti
        styles={Styled.dropdownStyles}
        onChange={(value) => updateDropdownInput(value)}
      />
      <OtherContextInputField
        {...{ element, parentKey, prevValue, updateForm }}
      />
    </>
  );
};
