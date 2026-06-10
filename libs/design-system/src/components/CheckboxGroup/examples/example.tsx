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

import { useState } from "react";

import { Checkbox } from "../Checkbox";
import { CheckboxGroup, type CheckboxGroupProps } from "../CheckboxGroup";

export type CheckboxGroupExampleArgs = Omit<
  CheckboxGroupProps,
  "value" | "children"
>;

export default function CheckboxGroupExample({
  onChange,
  orientation,
  disabled,
  ariaLabel,
}: CheckboxGroupExampleArgs) {
  const [value, setValue] = useState<string[]>(["option-a"]);

  return (
    <CheckboxGroup
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      orientation={orientation}
      disabled={disabled}
      ariaLabel={ariaLabel ?? "Example options"}
    >
      <Checkbox value="option-a">Option A</Checkbox>
      <Checkbox value="option-b">Option B</Checkbox>
      <Checkbox value="option-c">Option C</Checkbox>
    </CheckboxGroup>
  );
}
