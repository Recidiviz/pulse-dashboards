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
import { DefaultTheme, StyledComponentProps } from "styled-components/macro";

import { UsCaSupervisionLevelDowngradeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsCaSupervisionLevelDowngradeForm";
import { UsCaSupervisionLevelDowngradeDraftData } from "../../../../WorkflowsStore/Opportunity/UsCa";
import { useOpportunityFormContext } from "../../OpportunityFormContext";

type FormCheckboxProps = StyledComponentProps<
  "input",
  DefaultTheme,
  object,
  never
> & {
  name: keyof UsCaSupervisionLevelDowngradeDraftData;
  invert?: boolean;
  disabled?: boolean;
  value?: string;
  label: string;
};

const FormCheckbox: React.FC<FormCheckboxProps> = ({
  name,
  label,
  value,
  invert,
  disabled,
  ...props
}) => {
  const opportunityForm =
    useOpportunityFormContext() as UsCaSupervisionLevelDowngradeForm;

  const { formData } = opportunityForm;

  const onCheckField = (event: React.ChangeEvent<HTMLInputElement>) => {
    opportunityForm.updateDraftData(
      name,
      value || event.target.checked !== !!invert,
    );
  };

  return value ? (
    <label>
      <input
        {...props}
        value={value}
        type="radio"
        onChange={onCheckField}
        disabled={disabled}
        checked={disabled ? false : formData[name] === value}
      />
      {label}
    </label>
  ) : (
    <label>
      <input
        {...props}
        type="checkbox"
        onChange={onCheckField}
        disabled={disabled}
        checked={disabled ? false : !!formData[name] !== !!invert}
      />
      {label}
    </label>
  );
};

export default observer(FormCheckbox);
