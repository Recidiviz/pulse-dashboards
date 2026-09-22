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
  background: ${palette.marble2};
  border-bottom: 1px solid ${palette.slate20};
  margin-top: -${rem(PAGE_LAYOUT_HEADER_GAP)};
`;

export const Content = styled(PageContainer)`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.md)};
  padding-bottom: ${rem(spacing.md)};
  padding-top: ${rem(spacing.md)};
`;

export const SectionLabel = styled.span`
  ${typography.Sans16}

  color: ${palette.pine1};
  font-weight: 600;
`;

export const Divider = styled.span`
  align-self: stretch;
  background: ${palette.slate20};
  width: 1px;
`;

export const Links = styled.div`
  display: flex;
  gap: ${rem(spacing.md)};
  margin-left: auto;

  & > a {
    ${typography.Sans14}

    border-bottom: 2px solid transparent;
    color: ${palette.slate85};
    padding-bottom: ${rem(spacing.xs)};
    text-decoration: none;

    &.active {
      border-bottom-color: ${palette.pine4};
      color: ${palette.pine1};
      font-weight: 600;
    }
  }
`;
