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
import React, { InputHTMLAttributes } from "react";

import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { Checkbox } from "./styles";
import { FormDataType } from "./types";

export type FormCheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  name: keyof FormDataType;
};

const FormCheckbox: React.FC<FormCheckboxProps> = ({ name, ...props }) => {
  const opportunityForm = useOpportunityFormContext();
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    opportunityForm.updateDraftData(name, event.target.checked);
  };

  return (
    <Checkbox
      {...props}
      checked={!!opportunityForm.formData[name]}
      id={name}
      name={name}
      onChange={onChange}
      type="checkbox"
      className="fs-exclude"
    />
  );
};

export default observer(FormCheckbox);
