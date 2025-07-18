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

import { animation } from "@recidiviz/design-system";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

/**
 * It's a React Router Link but it looks like a button
 */
export const ButtonLink = styled(Link)`
  // many of these styles are borrowed from the design system, which does not export them
  align-items: center;
  background-color: transparent;
  border-radius: ${rem(21)};
  border: 1px solid ${palette.signal.links};
  color: ${palette.signal.links};
  display: inline-flex;
  gap: 1em;
  justify-content: space-between;
  min-height: ${rem(42)};
  min-width: ${rem(129)};
  padding: ${rem(10)} ${rem(18)};
  text-decoration: none;
  transition-duration: ${animation.defaultDurationMs}ms;
  transition-property: color, background-color, border-color;

  &:hover,
  &:focus {
    background-color: ${palette.pine4};
    color: ${palette.white};
  }

  &:active,
  &[aria-expanded="true"] {
    border-color: ${palette.signal.highlight};
    color: ${palette.signal.highlight};
  }

  & > * {
    flex: 0 1 auto;
  }

  /* expect this to be an icon */
  & > svg {
    flex: 0 0 auto;
  }
`;
