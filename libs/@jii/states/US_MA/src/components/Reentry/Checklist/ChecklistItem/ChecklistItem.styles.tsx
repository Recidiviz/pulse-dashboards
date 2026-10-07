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

import { palette, spacing, typography } from "~design-system";

export const Row = styled.div`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.md)};
  min-height: ${rem(64)};
  padding: ${rem(spacing.md)};
  position: relative;
`;

export const Label = styled.label`
  ${typography.Sans16}

  align-items: flex-start;
  color: ${palette.pine2};
  cursor: pointer;
  display: flex;
  flex: 1;
  font-weight: 500;
  gap: ${rem(spacing.md)};

  /* Stretches the label over the whole row so all of it is clickable. */
  &::after {
    content: "";
    inset: 0;
    position: absolute;
  }
`;

// Sits above the label's clickable area, so a badge can have its own click
// behavior without also toggling the checkbox.
// TODO(OBT-53977): Open the "Based on your profile" popover from this badge.
export const BadgeSlot = styled.div`
  align-self: flex-start;
  flex-shrink: 0;
  position: relative;
`;
