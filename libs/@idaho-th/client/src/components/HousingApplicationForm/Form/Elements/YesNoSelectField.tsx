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

import { useFormContext } from "../../FormContext/FormContext";
import * as Styled from "../../HousingApplicationForm.styles";
import type { Field, HousingApplicationForm } from "../../types";
import { FormField } from "./FormField";

type YesNoSelectFieldProps = {
  name: keyof HousingApplicationForm;
  label: string;
  maxWidth?: string;
};

export const YesNoSelectField: React.FC<YesNoSelectFieldProps> = ({
  name,
  label,
  maxWidth,
}) => {
  const { form } = useFormContext();

  return (
    <form.Field name={name} mode="value">
      {(field: Field<boolean | null>) => (
        <FormField field={field} label={label} maxWidth={maxWidth}>
          {({ variant, error, field: f }) => {
            let value = "";
            if (f.state.value === true) {
              value = "true";
            } else if (f.state.value === false) {
              value = "false";
            }

            const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
              const v = e.target.value;
              let nextValue: boolean | null = null;
              if (v === "true") {
                nextValue = true;
              } else if (v === "false") {
                nextValue = false;
              }
              f.handleChange(nextValue);
            };

            return (
              <Styled.Select
                id={f.name}
                name={f.name}
                value={value}
                onChange={handleChange}
                onBlur={f.handleBlur}
                $variant={variant}
                aria-invalid={Boolean(error)}
              >
                <option value="" />
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Styled.Select>
            );
          }}
        </FormField>
      )}
    </form.Field>
  );
};
