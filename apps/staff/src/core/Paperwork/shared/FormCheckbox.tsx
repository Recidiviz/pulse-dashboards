// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { deleteField, FieldValue } from "firebase/firestore";
import { observer } from "mobx-react-lite";
import React, { InputHTMLAttributes } from "react";

import { useOpportunityFormContext } from "../OpportunityFormContext";
import { FormDataFieldName } from "./../US_TX/types";
import { Checkbox } from "./styles";

export type FormCheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  name: FormDataFieldName;
  invert?: boolean;
  toggleable?: boolean;
  manualInvert?: string;
};

const FormCheckbox: React.FC<FormCheckboxProps> = ({
  id,
  name,
  invert,
  toggleable,
  manualInvert,
  ...props
}) => {
  const opportunityForm = useOpportunityFormContext();
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newVal: boolean | FieldValue = event.target.checked !== !!invert;
    if (toggleable && !event.target.checked) newVal = deleteField();
    opportunityForm.updateDraftData(name, newVal);
    if (manualInvert) {
      opportunityForm.updateDraftData(manualInvert, !newVal);
    }
  };

  const value = opportunityForm.formData[name];

  return (
    <Checkbox
      {...props}
      checked={value !== undefined && value !== !!invert}
      id={id}
      name={name}
      onChange={onChange}
      type="checkbox"
      className="fs-exclude"
    />
  );
};

export default observer(FormCheckbox);
