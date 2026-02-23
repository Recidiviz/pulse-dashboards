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

import { Link } from "react-router-dom";
import styled from "styled-components";

import {
  baseButtonStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
} from "~design-system";

import { jiiButtonStyles } from "./shared";

/**
 * It's a React Router Link but it looks like a button
 */
export const ButtonLink = styled(Link)<{ kind?: "primary" | "secondary" }>`
  ${baseButtonStyles};

  ${(props) => {
    switch (props.kind) {
      case "primary":
        return primaryButtonStyles;
      case "secondary":
      default:
        return secondaryButtonStyles;
    }
  }}

  display: inline-flex;
  text-decoration: none;

  ${jiiButtonStyles}
`;
