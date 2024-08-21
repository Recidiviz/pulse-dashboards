// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { ExternalPropsContext } from "@recidiviz/design-system";
import React, { useContext } from "react";

export function IconGoSvg(): React.ReactElement {
  const { color, ...iconProps } = useContext(ExternalPropsContext);

  return (
    <svg
      {...iconProps}
      viewBox="0 0 16 16"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8 12V9H4V7H8V4L12 8L8 12Z" />
    </svg>
  );
}

export function IconPeopleSvg(): React.ReactElement {
  const { color, ...iconProps } = useContext(ExternalPropsContext);

  return (
    <svg
      {...iconProps}
      viewBox="0 0 16 16"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.2 11.4044L7.5 9.40445C8.4 8.70445 9 7.70445 9 6.50445V5.70445C9 3.80445 7.6 2.10445 5.7 2.00445C3.7 1.90445 2 3.50445 2 5.50445V6.50445C2 7.70445 2.6 8.70445 3.5 9.40445L0.8 11.5044C0.3 11.9044 0 12.5044 0 13.1044V15.0044C0 15.6044 0.4 16.0044 1 16.0044H10C10.6 16.0044 11 15.6044 11 15.0044V13.0044C11 12.4044 10.7 11.8044 10.2 11.4044Z" />
      <path d="M15.0992 6.40311L13.2992 5.20311C13.6992 4.80311 13.9992 4.20311 13.9992 3.50311V2.60311C13.9992 1.40311 13.0992 0.203112 11.8992 0.00311178C10.6992 -0.196888 9.69922 0.503112 9.19922 1.40311C10.2992 2.40311 10.9992 3.80311 10.9992 5.40311V6.40311C10.9992 7.30311 10.7992 8.20311 10.3992 8.90311C10.3992 8.90311 11.5992 9.80311 11.5992 9.90311H14.9992C15.5992 9.90311 15.9992 9.50311 15.9992 8.90311V8.10311C15.9992 7.40311 15.6992 6.80311 15.0992 6.40311Z" />
    </svg>
  );
}
