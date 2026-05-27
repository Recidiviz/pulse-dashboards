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

import { Selector } from "../Selector";

export type SelectorExampleArgs = {
  options: { label: string; value: string }[];
  placeholder: string;
  menuAlign: "left" | "right";
  onChange: (value: string) => void;
};

export default function SelectorExample({
  options,
  placeholder,
  menuAlign,
  onChange,
}: SelectorExampleArgs) {
  const [value, setValue] = useState<string | undefined>(undefined);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ width: 190 }}>
        <Selector
          labelId="selector-example"
          placeholder={placeholder}
          options={options}
          value={options.find((o) => o.value === value) ?? null}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
          menuAlign={menuAlign}
        />
      </div>
    </div>
  );
}
