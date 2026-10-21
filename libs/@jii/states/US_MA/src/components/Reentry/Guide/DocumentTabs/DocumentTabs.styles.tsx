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

import { Tab, TabList, TabPanel } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { palette, spacing, typography } from "~design-system";

const CORNER_RADIUS = 8;

export const DocumentTabList = styled(TabList)`
  border-bottom: none;
  display: flex;
  flex-wrap: nowrap;
  margin: 0;
  padding: 0;
`;

export const DocumentTab = styled(Tab)`
  ${typography.Sans16}

  background-color: ${palette.white};
  border: 1px solid ${palette.slate20};
  border-bottom: none;
  border-radius: ${rem(CORNER_RADIUS)} ${rem(CORNER_RADIUS)} 0 0;
  color: ${palette.pine2};
  flex: 1 1 0;
  font-weight: 500;
  margin: 0;
  min-width: 0;
  padding: ${rem(12)} ${rem(spacing.md)};

  & + & {
    margin-left: -1px;
  }

  &.Tab--selected {
    background-color: ${palette.pine3};
    border-color: ${palette.pine4};
    color: ${palette.white};
    font-weight: 700;
    position: relative;
    z-index: 1;
  }
`;

export const DocumentTabPanel = styled(TabPanel)`
  background-color: ${palette.white};
  border: 1px solid ${palette.slate20};
  border-radius: 0 0 ${rem(CORNER_RADIUS)} ${rem(CORNER_RADIUS)};
  padding: ${rem(spacing.lg)};

  &.TabPanel--selected {
    display: flex;
    flex-direction: column;
    gap: ${rem(spacing.lg)};
  }
`;

export const PanelHeading = styled.h3`
  ${typography.Sans18}

  color: ${palette.pine2};
  font-weight: 700;
  margin: 0;
`;
