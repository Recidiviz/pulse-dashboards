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

import React from "react";

import { DatePickerInput } from "../../../common/inputs/DatePickerInput";
import { useFormContext } from "../../FormContext/FormContext";
import type { Field, HousingApplicationForm } from "../../types";
import { FieldArgs, FormField } from "./FormField";

const DateInput: React.FC<FieldArgs<string | null>> = ({
  variant,
  error,
  field: f,
}) => (
  <DatePickerInput
    id={f.name}
    name={f.name}
    value={f.state.value}
    onChange={f.handleChange}
    onBlur={f.handleBlur}
    variant={variant}
    hasError={Boolean(error)}
  />
);

export type DateFieldProps = {
  name: keyof HousingApplicationForm;
  label: string;
  tooltip?: string;
};

export const DateField: React.FC<DateFieldProps> = ({
  name,
  label,
  tooltip,
}) => {
  const { form } = useFormContext();

  return (
    <form.Field name={name} mode="value">
      {(field: Field<string | null>) => (
        <FormField field={field} label={label} tooltip={tooltip}>
          {(args) => <DateInput {...args} />}
        </FormField>
      )}
    </form.Field>
  );
};
