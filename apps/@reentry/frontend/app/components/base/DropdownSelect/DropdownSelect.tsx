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

"use client";

import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import styles from "./DropdownSelect.module.css";

interface DropdownSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownSelectProps {
  label: string;
  value: string;
  options: DropdownSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const DropdownSelect = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
}: DropdownSelectProps) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles["wrapper"]}>
      <label className={styles["label"]}>{label}</label>
      <Select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        displayEmpty
        fullWidth
        size="small"
        className={styles["select"]}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            <span className={styles["placeholder"]}>{placeholder}</span>
          </MenuItem>
        )}
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
};

export default DropdownSelect;
