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

import { typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { css } from "styled-components";

import { CopyWrapper } from "~@jii/common-ui";
import { palette, spacing } from "~design-system";

const dateInfoSubheadStyles = css`
  ${typography.Body16}
  font-weight: 700;
  color: ${palette.pine1};
  margin-top: ${rem(spacing.lg)};
  margin-bottom: ${rem(spacing.xs)};
`;

/**
 * Includes some unique formatting for explaining many types of dates on one page
 */
export const ImportantDatesCopyWrapper = styled(CopyWrapper)`
  section.tpr {
    h3 {
      ${typography.Sans18}
      color: ${palette.pine1};
      margin: ${rem(spacing.lg)} 0;
    }

    h4 {
      ${dateInfoSubheadStyles}
    }
  }

  .callout {
    background: ${palette.slate05};
    padding: ${rem(spacing.md)};
    margin: ${rem(spacing.lg)} 0;

    :first-child {
      margin-top: 0;
    }
    
    :last-child {
      margin-bottom: 0;
    }
    
  }

  h3 {
  ${dateInfoSubheadStyles}
`;
