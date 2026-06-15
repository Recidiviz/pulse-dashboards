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

import Slider from "./Slider";

// Required by Storybook's CSF indexer. Title is auto-derived from the file path.
export default {};

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 320, padding: 24 }}>{children}</div>
);

export const Default = () => {
  const [value, setValue] = useState(3);
  return (
    <Frame>
      <Slider max={10} value={value} onChange={setValue} />
    </Frame>
  );
};

export const WithPercentLabel = () => {
  const [value, setValue] = useState(50);
  return (
    <Frame>
      <Slider
        max={100}
        value={value}
        onChange={setValue}
        tooltipLabelFormatter={(v) => `${v}%`}
      />
    </Frame>
  );
};

export const SteppedRange = () => {
  const [value, setValue] = useState(20);
  return (
    <Frame>
      <Slider max={100} step={5} value={value} onChange={setValue} />
    </Frame>
  );
};

const noop = () => {
  // intentionally empty for the static example
};

export const Disabled = () => (
  <Frame>
    <Slider max={10} value={4} disabled onChange={noop} />
  </Frame>
);
