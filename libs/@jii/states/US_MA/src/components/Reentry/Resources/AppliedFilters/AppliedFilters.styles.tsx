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

import { Button, palette, spacing, typography } from "~design-system";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(spacing.md)};
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

export const ExpandToggle = styled.button`
  ${typography.Sans12}

  display: inline-flex;
  align-items: center;
  min-height: ${rem(24)};
  padding: ${rem(spacing.xs)} ${rem(spacing.md)};
  border-radius: 50%;
  border: 1px solid ${palette.pine4};
  background: ${palette.white};
  color: ${palette.pine4};
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${palette.slate10};
  }

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
  }
`;

export const ClearAllButton = styled(Button)`
  ${typography.Sans12}

  color: ${palette.pine4};
  font-weight: 600;
  text-decoration: underline;
`;
