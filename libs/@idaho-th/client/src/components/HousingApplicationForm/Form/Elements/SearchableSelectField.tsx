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

import { SearchableSelect } from "~@idaho-th/client/components/common/inputs";

import { palette } from "../../../../styles";
import { useFormContext } from "../../FormContext/FormContext";
import type { Field, HousingApplicationForm } from "../../types";
import { FormField } from "./FormField";

type SearchableSelectFieldProps = {
  name: DeepKeys<HousingApplicationForm>;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export const SearchableSelectField: React.FC<SearchableSelectFieldProps> = ({
  name,
  label,
  options,
  placeholder = "Select…",
}) => {
  const { form } = useFormContext();

  return (
    <form.Field name={name} mode="value">
      {(field: Field) => (
        <FormField field={field} label={label}>
          {({ variant, error, field: f }) => {
            const selectedValue = (f.state.value ?? "") as string;

            return (
              <SearchableSelect
                id={f.name}
                value={selectedValue}
                onChange={(value) => f.handleChange(value)}
                options={options}
                onBlur={f.handleBlur}
                placeholder={placeholder}
                hasError={Boolean(error)}
                hasWarning={variant === "warning"}
                defaultBorderColor={palette.foreground.brand}
                backgroundColor={palette.background.secondary}
                clearable
              />
            );
          }}
        </FormField>
      )}
    </form.Field>
  );
};
