// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useState } from "react";

import DropdownContainer from "./DropdownContainer";
import DropdownOptionList from "./DropdownOptionList";

type DropdownProps = {
  className?: string;
  variant?: "text" | "outline";
  value?: string | null;
  options: string[];
  onSelect?: (value: string) => void;
  label?: string;
  placeholder?: string;
  defaultEmptyValue?: boolean;
  errorMessage?: string | null;
  hasFreeTextOption?: boolean;
};

const Dropdown = ({
  className,
  variant = "text",
  value,
  options,
  onSelect,
  label,
  placeholder,
  defaultEmptyValue = false,
  errorMessage,
  hasFreeTextOption = false,
}: DropdownProps) => {
  const [selected, setSelected] = useState(() => {
    if (value) return value;
    if (defaultEmptyValue) return null;
    return options[0];
  });

  const handleSelect = (opt: string) => {
    setSelected(opt);
    if (onSelect) onSelect(opt);
  };

  return (
    <DropdownContainer
      className={className}
      variant={variant}
      label={label}
      buttonText={selected}
      placeholder={placeholder}
      errorMessage={errorMessage}
    >
      {({ close }) => (
        <DropdownOptionList
          options={options}
          value={selected}
          onSelect={handleSelect}
          close={close}
          hasFreeTextOption={hasFreeTextOption}
        />
      )}
    </DropdownContainer>
  );
};

export default Dropdown;
