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

import {
  HEADER_HEIGHT,
  HIDDEN_HEADER_OFFSET,
  PageContainer,
  STICKY_HEADER_ZINDEX,
  stickyHeader,
} from "~@jii/common-ui";
import { PAGE_LAYOUT_HEADER_GAP } from "~@jii/layout";
import { palette, typography } from "~design-system";

export const PROGRAMS_NAV_BAR_HEIGHT = 56;

// sticks and hides with the app header, like LastUpdatedBanner below it
export const Wrapper = styled.nav<{ $hideHeader: boolean }>`
  background: ${palette.marble3};
  border-bottom: 1px solid ${palette.slate20};
  box-sizing: border-box;
  height: ${rem(PROGRAMS_NAV_BAR_HEIGHT)};
  ${stickyHeader}
  margin-bottom: ${rem(PAGE_LAYOUT_HEADER_GAP)};
  top: ${({ $hideHeader }) =>
    $hideHeader ? `-${rem(HIDDEN_HEADER_OFFSET)}` : rem(HEADER_HEIGHT)};
  z-index: ${STICKY_HEADER_ZINDEX - 1};
`;

export const Tabs = styled(PageContainer)`
  display: flex;
  height: 100%;

  & > a {
    ${typography.Sans14}

    align-items: center;
    border-bottom: ${rem(4)} solid transparent;
    color: ${palette.slate85};
    display: flex;
    flex: 1;
    justify-content: center;
    text-decoration: none;

    outline-offset: -${rem(2)};

    &:focus:not(:focus-visible) {
      outline: none;
    }

    &.active {
      border-bottom-color: ${palette.pine4};
      color: ${palette.pine1};
      font-weight: 600;
    }
  }
`;
