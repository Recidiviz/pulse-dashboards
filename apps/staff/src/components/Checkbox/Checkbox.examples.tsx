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

import Checkbox from "./Checkbox";

// Required by Storybook's CSF indexer. Title is auto-derived from the file path.
export default {};

export const Unchecked = () => (
  <Checkbox value="option" name="unchecked" checked={false}>
    Unchecked option
  </Checkbox>
);

export const Checked = () => (
  <Checkbox value="option" name="checked" checked>
    Checked option
  </Checkbox>
);

export const Disabled = () => (
  <Checkbox value="option" name="disabled" checked disabled>
    Disabled (checked)
  </Checkbox>
);

export const Interactive = () => {
  const [checked, setChecked] = useState(false);
  return (
    <Checkbox
      value="option"
      name="interactive"
      checked={checked}
      onChange={() => setChecked((c) => !c)}
    >
      Click to toggle — currently {checked ? "checked" : "unchecked"}
    </Checkbox>
  );
};

export const Group = () => {
  const [picks, setPicks] = useState<Record<string, boolean>>({
    apple: true,
    banana: false,
    cherry: false,
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.keys(picks).map((fruit) => (
        <Checkbox
          key={fruit}
          value={fruit}
          name={fruit}
          checked={picks[fruit]}
          onChange={() => setPicks((p) => ({ ...p, [fruit]: !p[fruit] }))}
        >
          {fruit}
        </Checkbox>
      ))}
    </div>
  );
};
