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
import { InputFieldProps } from "../types";

export const RadioSelectField: React.FC<InputFieldProps> = ({
  element,
  parentKey,
  prevValue,
  updateForm,
}) => {
  const [currentValue, setCurrentValue] = useState(prevValue);

  const updateRadioSelect = (option: string | null) => {
    if (option === null) return;
    setCurrentValue(option);
    updateForm(element.key, option, parentKey);
  };

  return (
    <Styled.MultiSelectContainer>
      {element.options?.map((option) => {
        const isDefaultNotSureYetSelected =
          option === "Not sure yet" && currentValue === null;
        return (
          <Styled.MultiSelectChip
            key={option}
            selected={isDefaultNotSureYetSelected || currentValue === option}
            onClick={() => updateRadioSelect(option)}
            isNotSureYetOption={option === "Not sure yet"}
          >
            {(isDefaultNotSureYetSelected || currentValue === option) && (
              <CheckIcon />
            )}
            {option}
          </Styled.MultiSelectChip>
        );
      })}
    </Styled.MultiSelectContainer>
  );
};
