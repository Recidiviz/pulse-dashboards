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

// TODO(#4108): Consider and apply refactoring `UsTnAnnualReclassificationReview...` and `UsTnCustodyLevelDowngrade...` files to remove duplicated logic.
import { observer } from "mobx-react-lite";
import React, {
  InputHTMLAttributes,
  useContext,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

import { parseUsTnFormDate } from "~datatypes";
import { palette } from "~design-system";

import { FormViewerContext } from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { useAnimatedValue } from "../../useAnimatedValue";
import { useReactiveInput } from "../../utils";
import { Input } from "./styles";
import { FormDataType } from "./types";

export type FormInputValueGetter = (value: any) => any;

export type FormInputValueBuilder = (data: any, value: string) => string;

const DATE_FORMAT_HINT = "Enter a date like MM/DD/YYYY";

const DateInput = styled(Input)`
  &[aria-invalid="true"] {
    border-bottom: 1px solid ${palette.signal.error};
  }
`;

const DateField = styled.span`
  position: relative;
  display: inline-block;
`;

// Positioned below the input so showing it does not shift the form text
const DateHint = styled.span`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1;
  padding: 1px 3px;
  background: ${palette.white};
  color: ${palette.signal.error};
  font-size: 8px;
  font-weight: normal;
  white-space: nowrap;
`;

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  name: keyof FormDataType;
  hideValue?: boolean;
  /** Flags a value parseUsTnFormDate rejects once the user leaves the field. */
  isDate?: boolean;
};

const FormInput: React.FC<FormInputProps> = ({
  name,
  hideValue,
  isDate,
  ...props
}) => {
  const form = useOpportunityFormContext();
  const { isDownloading } = useContext(FormViewerContext);
  const [value, onChange] = useReactiveInput<HTMLInputElement>(name, form);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const valueForDisplay = hideValue ? "" : value;

  const hasAnimated = useAnimatedValue(inputRef, value);

  // Waits for blur so a date is not flagged while it is still being typed
  const isInvalidDate =
    isDate &&
    !isFocused &&
    !isDownloading &&
    typeof value === "string" &&
    value.trim() !== "" &&
    parseUsTnFormDate(value) === undefined;

  const InputComponent = isDate ? DateInput : Input;
  const hintId = `${name}-date-hint`;

  const input = (
    <InputComponent
      {...props}
      onFocus={(event) => {
        setIsFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        props.onBlur?.(event);
      }}
      aria-invalid={isInvalidDate || undefined}
      aria-describedby={isInvalidDate ? hintId : props["aria-describedby"]}
      value={hasAnimated ? valueForDisplay : ""}
      ref={inputRef}
      id={name}
      name={name}
      type="text"
      onChange={onChange}
      className="fs-exclude"
      autoComplete="off"
    />
  );

  if (!isDate) return input;

  return (
    <DateField>
      {input}
      {isInvalidDate && <DateHint id={hintId}>{DATE_FORMAT_HINT}</DateHint>}
    </DateField>
  );
};

// Only re-render changed inputs
export default observer(FormInput);
