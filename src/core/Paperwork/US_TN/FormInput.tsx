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
import { observer } from "mobx-react-lite";
import React, { MutableRefObject, useRef } from "react";
import { DefaultTheme, StyledComponentProps } from "styled-components/macro";

import { useRootStore } from "../../../components/StoreProvider";
import { Client } from "../../../WorkflowsStore";
import { useAnimatedValue, useReactiveInput } from "../utils";
import { Input } from "./styles";
import { FormDataType } from "./types";
import { updateCompliantReportingFormFieldData } from "./utils";

export type FormInputValueGetter = (value: any) => any;

export type FormInputValueBuilder = (data: any, value: string) => string;

type FormInputWrapperProps = StyledComponentProps<
  "input",
  DefaultTheme,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  never
> & {
  name: keyof FormDataType;
};

interface FormInputProps extends FormInputWrapperProps {
  client: Client;
}

const FormInput: React.FC<FormInputProps> = ({ client, name, ...props }) => {
  const [value, onChange] = useReactiveInput({
    name,
    fetchFromStore: () =>
      client.getCompliantReportingReferralDataField(name) as string,
    persistToStore: (valueToStore: string) =>
      client.setEarlyTerminationReferralDataField(name, valueToStore),
    persistToFirestore: (valueToStore: string) =>
      updateCompliantReportingFormFieldData(
        client.currentUserName || "user",
        client,
        { [name]: valueToStore }
      ),
  });

  const inputRef = useRef<HTMLInputElement>(
    null
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
    />
  );
};

const FormInputWrapper: React.FC<FormInputWrapperProps> = (props) => {
  const { workflowsStore } = useRootStore();
  if (!workflowsStore?.selectedClient?.opportunityUpdates.compliantReporting) {
    return <Input {...props} disabled />;
  }

  return <FormInput client={workflowsStore.selectedClient} {...props} />;
};

// Only re-render changed inputs
export default observer(FormInputWrapper);
