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
import { LSIR_SCORE_KEY } from "../../constants";
import { InputFieldProps } from "../types";
import { isValidLsirScore } from "../utils";

export const TextInputField: React.FC<InputFieldProps> = ({
  element,
  parentKey,
  prevValue,
  updateForm,
  updateFormError,
  placeholder,
  isOtherContext,
}) => {
  const initialValue = prevValue === null ? "" : String(prevValue);
  const prevLsirScoreHasError =
    element.key === LSIR_SCORE_KEY &&
    !isValidLsirScore(initialValue) &&
    initialValue !== "";

  const [currentValue, setCurrentValue] = useState(initialValue);
  const [hasValidationError, setHasValidationError] = useState<boolean>(
    prevLsirScoreHasError,
  );

  const handleValidationError = (hasError: boolean) => {
    setHasValidationError(hasError);
    if (updateFormError) updateFormError(hasError);
  };

  const updateTextInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setCurrentValue(e.target.value);

    if (element.key === LSIR_SCORE_KEY) {
      if (!isValidLsirScore(e.target.value)) {
        handleValidationError(true);
        return;
      }
      handleValidationError(false);
    }

    updateForm(element.key, e.target.value || null, parentKey, isOtherContext);
  };

  return !isOtherContext ? (
    <>
      <Styled.Input
        id={element.key}
        name={element.key}
        type={element.inputType}
        value={currentValue ?? ""}
        onChange={updateTextInput}
        disabled={element.isDisabled}
      />
      {hasValidationError && (
        <Styled.ErrorMessage>
          {element.validationErrorMessage}
        </Styled.ErrorMessage>
      )}
    </>
  ) : (
    <Styled.TextArea
      placeholder={placeholder}
      value={currentValue ?? ""}
      onChange={updateTextInput}
    />
  );
};
