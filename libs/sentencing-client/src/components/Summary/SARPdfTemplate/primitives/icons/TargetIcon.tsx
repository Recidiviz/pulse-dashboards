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

import { Path, Svg } from "@react-pdf/renderer";
import React from "react";

import { color } from "../../tokens";

export const TargetIcon = ({
  height = 10,
  width = 10,
}: {
  height?: number;
  width?: number;
}) => (
  <Svg width={width} height={height} viewBox="0 0 22 22">
    <Path
      d="M14.4736 7.40188L18.0086 3.86688"
      stroke={color.text.default}
      strokeWidth={1.875}
      fill="none"
    />
    <Path
      d="M14.4736 14.4727L18.0086 18.0077"
      stroke={color.text.default}
      strokeWidth={1.875}
      fill="none"
    />
    <Path
      d="M7.40219 14.4727L3.86719 18.0077"
      stroke={color.text.default}
      strokeWidth={1.875}
      fill="none"
    />
    <Path
      d="M7.40219 7.40188L3.86719 3.86688"
      stroke={color.text.default}
      strokeWidth={1.875}
      fill="none"
    />
    <Path
      d="M10.9375 20.9375C16.4603 20.9375 20.9375 16.4603 20.9375 10.9375C20.9375 5.41465 16.4603 0.9375 10.9375 0.9375C5.41465 0.9375 0.9375 5.41465 0.9375 10.9375C0.9375 16.4603 5.41465 20.9375 10.9375 20.9375Z"
      stroke={color.text.default}
      strokeWidth={1.875}
      strokeLinecap="square"
      fill="none"
    />
    <Path
      d="M10.9395 15.937C13.7009 15.937 15.9395 13.6985 15.9395 10.937C15.9395 8.17562 13.7009 5.93704 10.9395 5.93704C8.17803 5.93704 5.93945 8.17562 5.93945 10.937C5.93945 13.6985 8.17803 15.937 10.9395 15.937Z"
      stroke={color.text.default}
      strokeWidth={1.875}
      strokeLinecap="square"
      fill="none"
    />
  </Svg>
);
