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

import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

/**
 * A React Router link styled with Recidiviz brand colors
 */
export const BrandedLink = styled(Link)`
  color: ${palette.signal.links};

  &:hover,
  &:focus {
    color: ${palette.signal.highlight};
  }
`;
