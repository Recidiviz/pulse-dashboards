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

import { Radio } from "../Radio";
import { RadioGroup, type RadioGroupProps } from "../RadioGroup";

export type RadioGroupExampleArgs = Omit<RadioGroupProps, "value" | "children">;

export default function RadioGroupExample({
  onChange,
  orientation,
  disabled,
  ariaLabel,
  ariaLabelledBy,
  name,
  className,
}: RadioGroupExampleArgs) {
  const [value, setValue] = useState<string | undefined>("option-a");

  return (
    <RadioGroup
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      orientation={orientation}
      disabled={disabled}
      ariaLabel={ariaLabel ?? "Example options"}
      ariaLabelledBy={ariaLabelledBy}
      name={name}
      className={className}
    >
      <Radio value="option-a">Option A</Radio>
      <Radio value="option-b">Option B</Radio>
      <Radio value="option-c">Option C</Radio>
    </RadioGroup>
  );
}
