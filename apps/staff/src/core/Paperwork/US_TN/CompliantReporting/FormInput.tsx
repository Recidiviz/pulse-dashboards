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

import { observer } from "mobx-react-lite";
import React, { MutableRefObject, useRef } from "react";
import { DefaultTheme, StyledComponentProps } from "styled-components/macro";

import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { useAnimatedValue, useReactiveInput } from "../../utils";
import { Input } from "./styles";
import { FormDataType } from "./types";

export type FormInputValueGetter = (value: any) => any;

export type FormInputValueBuilder = (data: any, value: string) => string;

type FormInputProps = StyledComponentProps<
  "input",
  DefaultTheme,
  object,
  never
> & {
  name: keyof FormDataType;
};

const FormInput: React.FC<FormInputProps> = ({ name, ...props }) => {
  const form = useOpportunityFormContext();
  const [value, onChange] = useReactiveInput<HTMLInputElement>(name, form);
  const inputRef = useRef<HTMLInputElement>(
    null,
  ) as MutableRefObject<HTMLInputElement>;

  const hasAnimated = useAnimatedValue(inputRef, value);

  return (
    <Input
      {...props}
      value={hasAnimated ? value : ""}
      ref={inputRef}
      id={name}
      name={name}
      type="text"
      onChange={onChange}
      className="fs-exclude"
      autoComplete="off"
    />
  );
};

// Only re-render changed inputs
export default observer(FormInput);
