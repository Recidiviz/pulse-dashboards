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
import React from "react";

import { useRootStore } from "../../../components/StoreProvider";
import { updateCompliantReportingDraft } from "../../../firestore";
import { Checkbox } from "./styles";
import { FormDataType } from "./types";

export interface FormCheckboxProps
  extends React.InputHTMLAttributes<HTMLElement> {
  name: keyof FormDataType;
}

const FormCheckbox: React.FC<FormCheckboxProps> = ({ name, ...props }) => {
  const { practicesStore } = useRootStore();

  if (!practicesStore.selectedClient) {
    return null;
  }

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const client = practicesStore.selectedClient;
    if (!client || !practicesStore.user) {
      event.preventDefault();
      return;
    }

    client.setCompliantReportingReferralDataField(name, event.target.checked);

    updateCompliantReportingDraft(client.currentUserName || "user", client.id, {
      [name]: event.target.checked,
    });
  };

  return (
    <Checkbox
      {...props}
      checked={
        !!practicesStore.selectedClient.getCompliantReportingReferralDataField(
          name
        )
      }
      id={name}
      name={name}
      onChange={onChange}
      type="checkbox"
    />
  );
};

export default observer(FormCheckbox);