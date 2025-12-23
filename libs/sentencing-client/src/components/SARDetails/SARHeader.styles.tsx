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

import { typography } from "@recidiviz/design-system";
import styled from "styled-components";

import { palette } from "~design-system";

import { customPalette } from "../styles/palette";

export { BackLink } from "../styles/shared";

export const NAV_BAR_HEIGHT = 64;

export const SARHeaderContainer = styled.div`
  position: fixed;
  top: 1rem;
  left: 0;
  right: 0;
  width: 100%;
  padding-top: 6rem;
  padding-left: 2rem;
  padding-bottom: 2.2rem;
  z-index: 100;
  background-color: ${palette.white};
  border-bottom: 1px solid ${palette.slate20};
  display: flex;
  flex-direction: column;
`;

export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TopRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 24px;
`;

export const ClientName = styled.div`
  ${typography.Serif34}
  color: ${palette.pine2};
`;

export const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const DocID = styled.div`
  ${typography.Sans14}
`;

export const DueDateBadge = styled.div`
  ${typography.Sans14}
  height: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${customPalette.blue.light1};
  border-radius: 10px;
  padding: 0 8px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 400;
  color: ${customPalette.black};
`;

export const MetadataRow = styled.div`
  ${typography.Sans14}
  display: flex;
  gap: 24px;
  color: ${palette.slate70};
`;

export const MetadataItem = styled.div`
  display: flex;
  gap: 4px;
  min-width: 0; /* Allow flex item to shrink below content size */
`;

export const MetadataLabel = styled.span`
  color: ${palette.slate70};
  white-space: nowrap;
  flex-shrink: 0; /* Prevent label from being truncated */
`;

export const MetadataValue = styled.span`
  color: ${palette.pine2};
  font-weight: 500;
  white-space: nowrap;
`;

export const OffenseValue = styled.span`
  color: ${palette.slate70};
  white-space: nowrap;
  overflow: hidden;
`;
