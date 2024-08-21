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
import * as React from "react";
import styled, {
  DefaultTheme,
  StyledComponentProps,
} from "styled-components/macro";

import { UsTnReclassificationReviewForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassificationReviewForm";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { FormDataType } from "./types";

export const SquareInputSelector = styled.input`
  height: 1em;
`;

type FormRadioButtonProps = StyledComponentProps<
  typeof SquareInputSelector,
  DefaultTheme,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  never
> & {
  name: keyof FormDataType;
  targetValue: string | boolean;
  label: string;
};

const FormRadioButton: React.FC<FormRadioButtonProps> =
  function FormRadioButton({
    name,
    targetValue,
    label,
    ...props
  }: FormRadioButtonProps) {
    const opportunityForm =
      useOpportunityFormContext() as UsTnReclassificationReviewForm;

    const { formData } = opportunityForm;

    const onChange =
      (field: keyof FormDataType) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        opportunityForm.updateDraftData(field, targetValue);
      };

    return (
      // eslint-disable-next-line jsx-a11y/label-has-for
      <label>
        {label}
        <SquareInputSelector
          type="radio"
          onChange={onChange(name)}
          checked={formData[name] === targetValue}
          {...props}
        />
      </label>
    );
  };

export default observer(FormRadioButton);
