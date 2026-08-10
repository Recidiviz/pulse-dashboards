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

import { spacing } from "~design-system";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";

// Matches the selected-state colors of SectionNavigation's SectionPill
// ($active: a light color-mix tint, accent-colored border/text) for a
// consistent accent treatment across the app.
export const InfoBannerWrapper = styled.div`
  background: color-mix(in srgb, ${publicPathwaysPalette.focusColor} 5%, white);
  border-radius: 8px;
  padding: ${rem(spacing.md)};
  display: flex;
  gap: ${rem(spacing.md)};
`;

export const InfoBannerText = styled.p`
  ${publicPathwaysTypography.Sans14}
  margin: 0;
  color: ${publicPathwaysPalette.focusColor};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    flex-shrink: 0;
    fill: currentColor;
  }
`;
