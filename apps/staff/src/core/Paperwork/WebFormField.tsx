// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import "@material/textfield/dist/mdc.textfield.css";

import type { MDCTextFieldFoundation } from "@material/textfield";
import { palette } from "@recidiviz/design-system";
import {
  TextField,
  TextFieldHelperTextProps,
  TextFieldHTMLProps,
  TextFieldProps,
} from "@rmwc/textfield";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useEffect, useRef } from "react";
import styled from "styled-components/macro";

import { useOpportunityFormContext } from "./OpportunityFormContext";
import {
  DEFAULT_ANIMATION_DURATION,
  useAnimatedValue,
  useReactiveInput,
} from "./utils";

const ThemeContainer = styled.div`
  --mdc-typography-subtitle1-font-family: "Public Sans";
  --mdc-typography-caption-font-family: "Public Sans";
  --mdc-shape-small: 0;
  --mdc-theme-primary: ${palette.signal.links};

  &
    .mdc-text-field--focused:not(.mdc-text-field--disabled)
    .mdc-floating-label {
    color: ${palette.signal.links};
  }

  > label {
    width: 100%;
  }
`;

type BaseProps = TextFieldProps & TextFieldHTMLProps;

export interface WebFormFieldProps extends BaseProps {
  name: string;
  errorMessage?: string;
}

const WebFormField: React.FC<WebFormFieldProps> = ({
  name,
  errorMessage,
  ...props
}) => {
  const opportunityForm = useOpportunityFormContext();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const foundationRef = useRef<MDCTextFieldFoundation>(null);

  const [value, onChange] = useReactiveInput<
    HTMLInputElement | HTMLTextAreaElement
  >(name, opportunityForm);

  // Type at standard speed if the value is less than 100 chars. Otherwise
  // speed up so no field takes longer than DEFAULT_ANIMATION_DURATION.
  const duration =
    DEFAULT_ANIMATION_DURATION * Math.min(1, (value?.length ?? 0) / 100);

  useAnimatedValue(inputRef, value, duration);

  useEffect(() => {
    if (!inputRef.current) return;
    const { current: element } = inputRef;

    const offset = element.offsetHeight - element.clientHeight;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight + offset}px`;
  }, [inputRef, value]);

  let {
    persistent,
    children,
    validationMsg = false,
  } = (props.helpText || {}) as TextFieldHelperTextProps;

  const isValidTextarea = (
    pattern: string | undefined,
    textareaValue: string | undefined,
  ) => {
    if (pattern && textareaValue) {
      const re = new RegExp(pattern);
      return re.test(textareaValue);
    }
    return true;
  };

  if (foundationRef.current) {
    if (
      (!props.textarea && !foundationRef.current.isValid()) ||
      (props.textarea &&
        !isValidTextarea(props.pattern, foundationRef.current?.getValue()))
    ) {
      validationMsg = true;
      persistent = true;
      children = errorMessage;
    }
  }

  const isInvalid = () => {
    // If the field is an input, rely on the invalid property. Otherwise, determine the validity manually.
    return !props.textarea
      ? props.invalid
      : !isValidTextarea(props.pattern, foundationRef.current?.getValue());
  };

  return (
    <ThemeContainer>
      <TextField
        {...props}
        invalid={isInvalid()}
        helpText={{ validationMsg, persistent, children }}
        value={value}
        onChange={onChange}
        foundationRef={foundationRef}
        inputRef={inputRef}
        className="fs-exclude"
        id={name}
      />
    </ThemeContainer>
  );
};

export default observer(WebFormField);
