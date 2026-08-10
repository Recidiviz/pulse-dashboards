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
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownToggle,
  spacing,
} from "~design-system";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";

export const DownloadToggle = styled(DropdownToggle)`
  ${publicPathwaysTypography.Sans14}
  min-width: 110px;
  min-height: 38px;
  padding: 8px 16px;
  border-radius: 50px;
  border: 1px solid ${publicPathwaysPalette.signal.links};
  background-color: ${publicPathwaysPalette.signal.links};
  color: white;

  &:hover,
  &:focus-visible,
  &[aria-expanded="true"] {
    background-color: ${publicPathwaysPalette.signal.links};
    border-color: ${publicPathwaysPalette.signal.links};
  }

  &:focus-visible {
    outline: 2px solid ${publicPathwaysPalette.focusColor};
    outline-offset: 2px;
  }
`;

export const DownloadMenuPanel = styled(DropdownMenu)`
  min-width: ${rem(320)};
  padding: 1.5rem;
  display: flex;
  gap: 0.5rem;
  margin: 0;
  margin-top: 0.5rem;
`;

export const DownloadMenuLabel = styled(DropdownMenuLabel)`
  ${publicPathwaysTypography.Sans14}
  height: auto;
  line-height: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  font-size: 10px;
  color: ${publicPathwaysPalette.slate60};
  padding: 0;
  margin: 0;

  &:first-child {
    margin: 0;
  }
`;

export const DownloadMenuItem = styled(DropdownMenuItem)`
  height: auto;
  line-height: normal;
  padding: 0.5rem 0;
  white-space: normal;

  &:first-child {
    margin-top: ${rem(spacing.xs)};
  }

  &:last-child {
    margin-bottom: 0;
  }

  &:focus {
    color: inherit;
    background-color: rgba(0, 0, 0, 0.03);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.06);
  }
`;

export const DownloadMenuItemDivider = styled.div`
  height: 1px;
  margin: 0;
  background-color: rgba(0, 0, 0, 0.1);
`;

export const DownloadMenuItemHeading = styled.p`
  ${publicPathwaysTypography.Sans16}
  font-weight: 700;
  margin: 0;
  color: ${publicPathwaysPalette.pine1};
`;

export const DownloadMenuItemSubheading = styled.p`
  ${publicPathwaysTypography.Sans14}
  margin: 0.15rem 0 0;
  color: ${publicPathwaysPalette.slate70};
`;
