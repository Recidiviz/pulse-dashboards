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

import { animation } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { transparentize } from "polished";
import * as React from "react";
import { MutableRefObject, useRef } from "react";
import AutosizeInput from "react-input-autosize";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useOpportunityFormContext } from "./OpportunityFormContext";
import { useAnimatedValue, useReactiveInput } from "./utils";

export interface DOCXFormInputProps<DraftData> {
  name: Extract<keyof DraftData, string>;
  placeholder?: string;
  style?: React.InputHTMLAttributes<HTMLInputElement>["style"];
  readOnly?: boolean;
}

const StyledAutosizeInput = styled.span`
  input {
    display: inline-block;
    min-height: 1.1em;
    background-color: ${transparentize(0.9, palette.signal.highlight)};
    border-width: 0;
    border-bottom: 1px solid ${palette.signal.links};
    color: black;
    position: relative;
    max-width: 515px;
    background-color: ${transparentize(0.9, palette.signal.highlight)};
    transition: background-color ease-in ${animation.defaultDurationMs}ms;

    &:disabled {
      background-color: ${palette.slate10};
      border-bottom-color: ${palette.slate20};
      cursor: not-allowed;
    }

    &:hover,
    &:focus {
      background-color: ${transparentize(0.7, palette.signal.highlight)};
    }

    &::placeholder {
      color: ${palette.slate85};
    }
  }
`;

const DOCXFormInput = observer(function FormInput<DraftData>({
  name,
  style,
  ...props
}: DOCXFormInputProps<DraftData>) {
  /*
   On mount, the autosize input has its value set, which causes it to resize to fit its content. During animation,
   we modify the element's value attribute in place which does not trigger resize.
   */
  const opportunityForm = useOpportunityFormContext();
  const [value, onChange] = useReactiveInput<HTMLInputElement>(
    name,
    opportunityForm,
  );

  const inputRef = useRef<HTMLInputElement>(
    null,
  ) as MutableRefObject<HTMLInputElement>;

  const setInputRef = React.useCallback(
    (inputElement: HTMLInputElement | null) => {
      if (inputElement) {
        inputRef.current = inputElement;
      }
    },
    [],
  );

  useAnimatedValue(inputRef, value);

  return (
    <StyledAutosizeInput>
      <AutosizeInput
        inputRef={setInputRef}
        value={value}
        onChange={onChange}
        name={name}
        className="fs-exclude"
        inputStyle={style}
        autoComplete="off"
        {...props}
      />
    </StyledAutosizeInput>
  );
});

export default DOCXFormInput;
