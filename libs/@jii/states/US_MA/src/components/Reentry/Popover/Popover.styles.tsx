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

import { rem, rgba } from "polished";
import styled from "styled-components";

import { palette, spacing, typography, zindex } from "~design-system";

const CLOSE_BUTTON_SIZE = 44;

export const TriggerButton = styled.button`
  background: none;
  border: none;
  border-radius: ${rem(spacing.xs)};
  cursor: pointer;
  display: flex;
  padding: 0;
`;

export const Surface = styled.div`
  background: ${palette.marble1};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(spacing.sm)};
  box-shadow:
    0 ${rem(6)} ${rem(spacing.md)} ${rem(-2)} ${rgba(palette.pine1, 0.16)},
    0 ${rem(2)} ${rem(spacing.xs)} ${rem(-1)} ${rgba(palette.pine1, 0.1)};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.md)} ${rem(spacing.md)} ${rem(spacing.lg)}
    ${rem(spacing.md)};
  width: ${rem(300)};
  z-index: ${zindex.tooltip};
`;

export const Heading = styled.h2`
  ${typography.Sans16}

  color: ${palette.pine2};
  font-weight: 700;
  margin: 0;
  padding-right: ${rem(CLOSE_BUTTON_SIZE - spacing.md)};

  &:focus {
    outline: none;
  }
`;

export const CloseButton = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${palette.pine2};
  cursor: pointer;
  display: flex;
  height: ${rem(CLOSE_BUTTON_SIZE)};
  justify-content: center;
  padding: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: ${rem(CLOSE_BUTTON_SIZE)};
`;
