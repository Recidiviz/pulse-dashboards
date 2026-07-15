// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components";

import { useOpportunityFormContext } from "./OpportunityFormContext";

export type DOCXFormRadioButtonProps<DraftData> =
  React.InputHTMLAttributes<HTMLInputElement> & {
    name: Extract<keyof DraftData, string>;
    targetValue: string | boolean;
    label: string;
  };

const Label = styled.label`
  margin-bottom: 0;
  display: flex;
  align-items: center;
  div {
    padding-top: ${rem(spacing.xxs)};
  }
`;

const InputSelector = styled.input`
  height: 1em;
`;

const DOCXFormRadioButton = observer(function DOCXFormRadioButton<DraftData>({
  name,
  targetValue,
  label,
  ...props
}: DOCXFormRadioButtonProps<DraftData>) {
  const opportunityForm = useOpportunityFormContext();

  const { formData } = opportunityForm;

  const handleOnClick = (_: React.MouseEvent<HTMLInputElement>) => {
    if (formData[name] === targetValue) {
      // To allow users to fully deselect this field, we set to the empty
      // string rather than clearing the field value. Clearing would delete user
      // updates to the button value, but would not override default
      // field data from the opportunity record.
      opportunityForm.updateDraftData(name, "");
    } else {
      opportunityForm.updateDraftData(name, targetValue);
    }
  };

  return (
    <Label>
      <div>{label}</div>
      <InputSelector
        type="radio"
        onClick={handleOnClick}
        checked={formData[name] === targetValue}
        {...props}
      />
    </Label>
  );
});

export default DOCXFormRadioButton;
