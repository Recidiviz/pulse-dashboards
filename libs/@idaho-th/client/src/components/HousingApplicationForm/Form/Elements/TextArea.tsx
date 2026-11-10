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

import type { DeepKeys } from "@tanstack/react-form";
import React from "react";

import { useFormContext } from "../../FormContext/FormContext";
import * as Styled from "../../HousingApplicationForm.styles";
import type { Field, HousingApplicationForm } from "../../types";
import { FormField } from "./FormField";

const DEFAULT_ROWS = 4;

export type TextAreaProps = {
  name: DeepKeys<HousingApplicationForm>;
  label: string;
  rows?: number;
};

export const TextArea: React.FC<TextAreaProps> = ({
  name,
  label,
  rows = DEFAULT_ROWS,
}) => {
  const { form, handleInputChange } = useFormContext();

  return (
    <form.Field name={name} mode="value">
      {(field: Field) => (
        <FormField field={field} label={label}>
          {({ variant, error, field: f }) => (
            <Styled.Textarea
              id={f.name}
              name={f.name}
              value={(f.state.value ?? "") as string}
              onChange={handleInputChange(f, { type: "text" })}
              onBlur={f.handleBlur}
              $variant={variant}
              aria-invalid={Boolean(error)}
              autoComplete="off"
              rows={rows}
            />
          )}
        </FormField>
      )}
    </form.Field>
  );
};
