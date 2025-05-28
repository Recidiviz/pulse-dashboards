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

import { deleteField, FieldValue } from "firebase/firestore";
import { observer } from "mobx-react-lite";
import React from "react";
import styled from "styled-components/macro";

import { useOpportunityFormContext } from "./OpportunityFormContext";

const Checkbox = styled.input.attrs({
  type: "checkbox",
})`
  height: 9px;
  width: 9px;
  vertical-align: middle;
  margin: 0 0.25em 0 0;
`;

export interface DOCXFormCheckboxProps<DraftData>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: Extract<keyof DraftData, string>;
  invert?: boolean;
  toggleable?: boolean;
}

const DOCXFormCheckbox = observer(function FormInput<DraftData>({
  name,
  invert,
  toggleable,
  ...props
}: DOCXFormCheckboxProps<DraftData>) {
  const opportunityForm = useOpportunityFormContext();
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newVal: boolean | FieldValue = event.target.checked !== !!invert;
    if (toggleable && !event.target.checked) newVal = deleteField();
    opportunityForm.updateDraftData(name, newVal);
  };

  const value = opportunityForm.formData[name];
  return (
    <Checkbox
      {...props}
      checked={value !== undefined && value !== !!invert}
      id={name}
      name={name}
      onChange={onChange}
      type="checkbox"
      className="fs-exclude"
    />
  );
});

export default DOCXFormCheckbox;
