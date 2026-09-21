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

import { rem } from "polished";
import styled from "styled-components";

import { CopyWrapper } from "~@jii/common-ui";
import { palette, spacing } from "~design-system";

/**
 * Extends the common-ui CopyWrapper component to add support
 * for displaying images interspersed with blocks of text.
 */
export const IONInfoPageCopyWrapper = styled(CopyWrapper)`
  // this is the first use case for displaying images in a page like this,
  // so the styles are not yet shared across the app
  img {
    max-width: 100%;
    display: block;
    margin: ${rem(spacing.xl)} 0;
    border: ${rem(1)} solid ${palette.slate40};
  }
`;
