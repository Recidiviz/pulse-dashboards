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
// TODO(#4108): Consider and apply refactoring `UsTnAnnualReclassificationReview...` and `UsTnCustodyLevelDowngrade...` files to remove duplicated logic.
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
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  never
> & {
  name: keyof FormDataType;
  hideValue?: boolean;
};

const FormInput: React.FC<FormInputProps> = ({ name, hideValue, ...props }) => {
  const form = useOpportunityFormContext();
  const [value, onChange] = useReactiveInput<HTMLInputElement>(name, form);
  const inputRef = useRef<HTMLInputElement>(
    null
  ) as MutableRefObject<HTMLInputElement>;

  const valueForDisplay = hideValue ? "" : value;

  const hasAnimated = useAnimatedValue(inputRef, value);

  return (
    <Input
      {...props}
      value={hasAnimated ? valueForDisplay : ""}
      ref={inputRef}
      id={name}
      name={name}
      type="text"
      onChange={onChange}
      className="fs-exclude"
    />
  );
};

// Only re-render changed inputs
export default observer(FormInput);
