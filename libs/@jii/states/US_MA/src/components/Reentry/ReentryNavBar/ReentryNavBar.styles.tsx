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

import { FullBleedContainer, PageContainer } from "~@jii/common-ui";
import { PAGE_LAYOUT_HEADER_GAP } from "~@jii/layout";
import { palette, spacing, typography } from "~design-system";

export const Wrapper = styled(FullBleedContainer).attrs({ as: "nav" })`
  background: ${palette.slate05};
  border-bottom: 1px solid ${palette.slate20};
  margin-top: -${rem(PAGE_LAYOUT_HEADER_GAP)};
`;

export const Links = styled(PageContainer)`
  display: flex;
  gap: ${rem(spacing.xl)};

  & > a {
    ${typography.Sans16}

    align-items: center;
    border-bottom: 3px solid transparent;
    box-sizing: border-box;
    color: ${palette.pine2};
    display: flex;
    font-weight: 400;
    height: ${rem(56)};
    text-decoration: none;

    &.active {
      border-bottom-color: ${palette.pine4};
    }
  }
`;
