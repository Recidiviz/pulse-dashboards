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
import { debounce } from "lodash";
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";

import { useRootStore } from "../../../components/StoreProvider";
import {
  CombinedUserRecord,
  updateCompliantReportingDraft,
} from "../../../firestore";
import type { Client } from "../../../PracticesStore/Client";
import { useAnimatedValue } from "../utils";
import { Input } from "./styles";
import { FormDataType } from "./types";

export type FormInputValueGetter = (value: any) => any;

export type FormInputValueBuilder = (
  data: any,
  value: string
) => string | string[];

interface FormInputWrapperProps extends React.InputHTMLAttributes<HTMLElement> {
  name: keyof FormDataType;
  getValue?: FormInputValueGetter;
  buildValue?: FormInputValueBuilder;
}

interface FormInputProps extends FormInputWrapperProps {
  client: Client;
  user: CombinedUserRecord;
}

const createDefaultValueGetter = (): FormInputValueGetter => {
  return (data) => data;
};

const createDefaultValueBuilder = (name: string): FormInputValueBuilder => {
  return (data, value) => value;
};

const FormInput: React.FC<FormInputProps> = ({
  client,
  user,
  name,
  getValue = createDefaultValueGetter(),
  buildValue = createDefaultValueBuilder(name),
  ...props
}) => {
  const [value, setValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(
    null
  ) as MutableRefObject<HTMLInputElement>;

  useAnimatedValue(inputRef, value);

  useEffect(() => {
    return autorun(() => {
      setValue(
        getValue(client.getCompliantReportingReferralDataField(name)) || ""
      );
    });
  });

  const updateFirestoreRef = useRef(
    debounce((key, builtValue) => {
      updateCompliantReportingDraft(
        client.currentUserName || "user",
        client.id,
        {
          [key]: builtValue,
        }
      );
    }, 2000)
  );

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);

    const builtValue = buildValue(
      client.getCompliantReportingReferralDataField(name),
      event.target.value
    );

    client.setCompliantReportingReferralDataField(name, builtValue);

    if (updateFirestoreRef.current) {
      updateFirestoreRef.current(name, builtValue);
    }
  };

  return (
    <Input
      {...props}
      value={value}
      ref={inputRef}
      id={name}
      name={name}
      type="text"
      onChange={onChange}
    />
  );
};

const FormInputWrapper: React.FC<FormInputWrapperProps> = (props) => {
  const { practicesStore } = useRootStore();
  if (!practicesStore.selectedClient || !practicesStore.user) {
    return null;
  }

  return (
    <FormInput
      client={practicesStore.selectedClient}
      user={practicesStore.user}
      {...props}
    />
  );
};

// Only re-render changed inputs
export default observer(FormInputWrapper);
