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

import { NONE_OPTION } from "~@idaho-th/shared";

import { useFormContext } from "../../FormContext/FormContext";
import * as Styled from "../../HousingApplicationForm.styles";
import type { Field, HousingApplicationForm } from "../../types";
import { FormField } from "./FormField";

type MultiToggleSelectProps = {
  name: DeepKeys<HousingApplicationForm>;
  label: string;
  options: readonly string[];
  placeholder?: string;
};

export const MultiToggleSelect: React.FC<MultiToggleSelectProps> = ({
  name,
  label,
  options,
  placeholder = "Select…",
}) => {
  const { form } = useFormContext();
  const hasNoneOption = options.includes(NONE_OPTION);

  return (
    <form.Field name={name} mode="value">
      {(field: Field<string[]>) => (
        <FormField field={field} label={label}>
          {({ variant, error, field: f }) => {
            const value = f.state.value ?? [];
            const selectedLabel =
              value.length > 0 ? value.join(", ") : placeholder;

            const handleMultiToggleChange = (
              e: React.ChangeEvent<HTMLSelectElement>,
            ) => {
              const selected = e.target.value;
              if (!selected) return;
              const next = value.includes(selected)
                ? value.filter((v) => v !== selected)
                : [...value, selected];

              if (hasNoneOption) {
                if (selected === NONE_OPTION) {
                  f.handleChange(
                    next.includes(NONE_OPTION) ? [NONE_OPTION] : [],
                  );
                  return;
                }
                f.handleChange(next.filter((v) => v !== NONE_OPTION));
                return;
              }
              f.handleChange(next);
            };

            return (
              <Styled.Select
                id={f.name}
                name={f.name}
                value=""
                onChange={handleMultiToggleChange}
                onBlur={f.handleBlur}
                $variant={variant}
                aria-invalid={Boolean(error)}
              >
                <option value="" disabled hidden>
                  {selectedLabel}
                </option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Styled.Select>
            );
          }}
        </FormField>
      )}
    </form.Field>
  );
};
