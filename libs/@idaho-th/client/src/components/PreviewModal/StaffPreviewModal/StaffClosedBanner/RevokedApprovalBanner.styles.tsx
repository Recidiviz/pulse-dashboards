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

import styled from "styled-components";

import { palette, spacing } from "../../../../styles";

export const BannerContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

export const BannerActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${spacing[2]};
`;

export const TextButton = styled.button`
  background: none;
  border: none;
  color: ${palette.foreground.brand};
  cursor: pointer;
  padding: ${spacing[2]};

  &:hover:not(:disabled) {
    opacity: 0.8;
  }

  /* Muted but readable against the banner's light background. */
  &:disabled {
    color: ${palette.foreground.secondary};
    cursor: default;
  }
`;
