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

import React, { useEffect, useRef, useState } from "react";

import { NONE_OPTION } from "~@idaho-th/shared";

import { useFormContext } from "../../FormContext/FormContext";
import * as Styled from "../../HousingApplicationForm.styles";
import type { Field, HousingApplicationForm } from "../../types";
import { FormField } from "./FormField";

export type MultiSelectDropdownProps = {
  name: keyof HousingApplicationForm;
  label: string;
  options: readonly string[];
};

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  name,
  label,
  options,
}) => {
  const { form } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        e.target instanceof Node &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [isOpen]);

  return (
    <form.Field name={name} mode="value">
      {(field: Field<string[]>) => (
        <FormField
          field={field}
          label={label}
          fieldStyle={{ position: "relative" }}
        >
          {({ variant, field: f }) => {
            const selectedValues: string[] = Array.isArray(f.state.value)
              ? f.state.value
              : [];
            const selectedLabel =
              selectedValues.length > 0 ? selectedValues.join(", ") : "Select…";

            // "None" means no selection, so it can never coexist with another option.
            const toggleOption = (option: string) => {
              if (selectedValues.includes(option)) {
                f.handleChange(selectedValues.filter((v) => v !== option));
                return;
              }
              if (option === NONE_OPTION) {
                f.handleChange([NONE_OPTION]);
                return;
              }
              f.handleChange([
                ...selectedValues.filter((v) => v !== NONE_OPTION),
                option,
              ]);
            };

            return (
              <Styled.DropdownWrapper ref={dropdownRef}>
                <Styled.DropdownInput
                  id={f.name}
                  name={f.name}
                  readOnly
                  role="combobox"
                  aria-expanded={isOpen}
                  aria-haspopup="listbox"
                  value={selectedLabel}
                  onClick={() => setIsOpen((v) => !v)}
                  onBlur={f.handleBlur}
                  $variant={variant}
                />
                {isOpen && (
                  <Styled.MultiSelectDropdownMenu>
                    <Styled.MultiSelectDropdownOptions role="listbox">
                      {options.map((opt) => {
                        const checked = selectedValues.includes(opt);
                        return (
                          <Styled.DropdownMenuItem
                            key={opt}
                            type="button"
                            role="option"
                            aria-selected={checked}
                            onClick={() => toggleOption(opt)}
                          >
                            <Styled.DropdownCheckbox $checked={checked} />
                            <Styled.DropdownMenuItemLabel $checked={checked}>
                              {opt}
                            </Styled.DropdownMenuItemLabel>
                          </Styled.DropdownMenuItem>
                        );
                      })}
                    </Styled.MultiSelectDropdownOptions>
                    <Styled.MultiSelectDropdownFooter>
                      <Styled.MultiSelectDropdownClearButton
                        type="button"
                        onClick={() => {
                          f.handleChange?.([]);
                        }}
                      >
                        Clear
                      </Styled.MultiSelectDropdownClearButton>
                      <Styled.MultiSelectDropdownCloseButton
                        type="button"
                        onClick={() => setIsOpen(false)}
                      >
                        Close
                      </Styled.MultiSelectDropdownCloseButton>
                    </Styled.MultiSelectDropdownFooter>
                  </Styled.MultiSelectDropdownMenu>
                )}
              </Styled.DropdownWrapper>
            );
          }}
        </FormField>
      )}
    </form.Field>
  );
};
