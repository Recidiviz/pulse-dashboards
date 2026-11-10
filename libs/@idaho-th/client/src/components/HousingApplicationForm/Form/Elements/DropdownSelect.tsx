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
import React, { useEffect, useRef, useState } from "react";

import { palette } from "../../../../styles";
import { useFormContext } from "../../FormContext/FormContext";
import * as Styled from "../../HousingApplicationForm.styles";
import type { Field, HousingApplicationForm } from "../../types";
import { FormField } from "./FormField";
import { SelectOptionList } from "./SelectOptionList";

type DropdownSelectProps = {
  name: DeepKeys<HousingApplicationForm>;
  label: string;
  options: readonly string[];
  placeholder?: string;
};

export const DropdownSelect: React.FC<DropdownSelectProps> = ({
  name,
  label,
  options,
  placeholder = "Select…",
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
      {(field: Field) => (
        <FormField
          field={field}
          label={label}
          fieldStyle={{ position: "relative" }}
        >
          {({ variant, error, field: f }) => {
            const selectedValue = (f.state.value ?? "") as string;
            const displayValue = selectedValue || placeholder;
            const listboxId = `${f.name}-options`;
            return (
              <Styled.DropdownWrapper ref={dropdownRef}>
                <Styled.DropdownInput
                  id={f.name}
                  name={f.name}
                  readOnly
                  role="combobox"
                  aria-label={label}
                  aria-expanded={isOpen}
                  aria-haspopup="listbox"
                  aria-controls={listboxId}
                  aria-invalid={Boolean(error)}
                  value={displayValue}
                  onClick={() => setIsOpen((open) => !open)}
                  onBlur={f.handleBlur}
                  $variant={variant}
                  style={{
                    color: selectedValue
                      ? undefined
                      : palette.misc.primaryMuted,
                  }}
                />
                <Styled.DropdownMenu
                  role="listbox"
                  id={listboxId}
                  aria-label={label}
                  hidden={!isOpen}
                >
                  {isOpen && (
                    <SelectOptionList
                      options={options}
                      selectedValue={selectedValue}
                      onSelect={(value) => {
                        f.handleChange(value);
                        setIsOpen(false);
                      }}
                    />
                  )}
                </Styled.DropdownMenu>
              </Styled.DropdownWrapper>
            );
          }}
        </FormField>
      )}
    </form.Field>
  );
};
