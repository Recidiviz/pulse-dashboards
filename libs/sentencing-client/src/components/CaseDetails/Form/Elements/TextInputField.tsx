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

import * as Styled from "../../CaseDetails.styles";
import { InputFieldProps } from "../types";

export const TextInputField: React.FC<InputFieldProps> = ({
  element,
  parentKey,
  prevValue,
  updateForm,
  placeholder,
  isTextArea,
}) => {
  const [currentValue, setCurrentValue] = useState(prevValue);

  const updateTextInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setCurrentValue(e.target.value);
    updateForm(element.key, e.target.value, parentKey, isTextArea);
  };

  return !isTextArea ? (
    <Styled.Input
      id={element.key}
      name={element.key}
      type="text"
      value={currentValue ?? ""}
      onChange={updateTextInput}
    />
  ) : (
    <Styled.TextArea
      placeholder={placeholder}
      value={currentValue ?? ""}
      onChange={updateTextInput}
    />
  );
};
