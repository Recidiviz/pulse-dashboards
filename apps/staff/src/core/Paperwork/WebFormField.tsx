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

import "@material/textfield/dist/mdc.textfield.css";

import type { MDCTextFieldFoundation } from "@material/textfield";
import { Icon, IconSVG, palette, Sans16 } from "@recidiviz/design-system";
import {
  TextField,
  TextFieldHelperTextProps,
  TextFieldHTMLProps,
  TextFieldProps,
} from "@rmwc/textfield";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
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

  .mdc-text-field {
    padding: 0 16px;
  }

  .mdc-text-field--textarea {
    flex-direction: row;
  }

  .mdc-text-field__input {
    padding: 0;
  }

  .mdc-text-field__icon--trailing {
    padding: 0 0 0 16px;
    cursor: default;
  }

  > label {
    width: 100%;
  }
`;

const SuccessIndicatorWrapper = styled(Sans16)`
  display: inline-flex;
  gap: 6px;
`;

const SuccessIndicatorText = styled(Sans16)`
  color: ${palette.pine4};
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

  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const [intermediateValue, setIntermediateValue] = useState(value);

  const handleBlur = () => {
    if (intermediateValue !== value) {
      setShowSuccessIndicator(true);
      setIntermediateValue(value);
      setTimeout(() => {
        setShowSuccessIndicator(false);
      }, 3000);
    }
  };

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
        onBlur={handleBlur}
        foundationRef={foundationRef}
        inputRef={inputRef}
        className="fs-exclude"
        id={name}
        trailingIcon={
          showSuccessIndicator ? (
            <SuccessIndicatorWrapper>
              <Icon
                kind={IconSVG.Success}
                width={16}
                color={palette.signal.highlight}
              />
              <SuccessIndicatorText>Saved</SuccessIndicatorText>
            </SuccessIndicatorWrapper>
          ) : null
        }
      />
    </ThemeContainer>
  );
};

export default observer(WebFormField);
