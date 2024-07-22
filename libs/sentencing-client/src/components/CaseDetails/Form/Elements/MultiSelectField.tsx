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

import CheckIcon from "../../../assets/green-check-icon.svg?react";
import * as Styled from "../../CaseDetails.styles";
import { NOT_SURE_YET_OPTION } from "../../constants";
import { InputFieldProps } from "../types";
import { OtherContextInputField } from "./OtherContextField";

export const MultiSelectField: React.FC<InputFieldProps> = ({
  element,
  parentKey,
  prevValue,
  updateForm,
}) => {
  const [currentValue, setCurrentValue] = useState(prevValue as string[]);

  const updateMultiSelect = (option: string | null) => {
    if (option === null) return;
    if (option === NOT_SURE_YET_OPTION) {
      setCurrentValue([]);
      updateForm(element.key, null, parentKey);
      return;
    }

    const updatedValue = currentValue?.includes(option)
      ? currentValue.filter((val) => val !== option)
      : [...(currentValue ?? []), option];

    setCurrentValue(updatedValue);
    updateForm(element.key, updatedValue, parentKey);
  };

  return (
    <>
      <Styled.MultiSelectContainer>
        {element.options?.map((option) => {
          const isDefaultNotSureYetSelected =
            option === NOT_SURE_YET_OPTION && currentValue?.length === 0;
          return (
            <Styled.MultiSelectChip
              key={option}
              selected={
                isDefaultNotSureYetSelected || currentValue?.includes(option)
              }
              onClick={() => updateMultiSelect(option)}
              isNotSureYetOption={option === NOT_SURE_YET_OPTION}
            >
              {((option === NOT_SURE_YET_OPTION &&
                currentValue?.length === 0) ||
                currentValue?.includes(option)) && <CheckIcon />}
              {option}
            </Styled.MultiSelectChip>
          );
        })}
      </Styled.MultiSelectContainer>
      <OtherContextInputField
        {...{ element, parentKey, prevValue, updateForm }}
      />
    </>
  );
};
