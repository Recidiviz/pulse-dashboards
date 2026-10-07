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

const CARD_RADIUS = rem(8);

export const Header = styled.div<{ $isOpen: boolean }>`
  border: 1px solid ${palette.slate20};
  border-radius: ${({ $isOpen }) =>
    $isOpen ? `${CARD_RADIUS} ${CARD_RADIUS} 0 0` : CARD_RADIUS};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.lg)} 0;
  position: relative;

  /* Outlines the whole header, following its rounded corners, while its
     toggle button has focus. */
  &:focus-within {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 0;
  }
`;

export const Heading = styled.h2`
  margin: 0;
`;

export const Toggle = styled.button`
  ${typography.Sans18}

  align-items: center;
  background: none;
  border: none;
  color: ${palette.pine2};
  cursor: pointer;
  display: flex;
  font-weight: 700;
  gap: ${rem(spacing.sm)};
  min-height: ${rem(48)};
  padding: 0 ${rem(spacing.md)};
  text-align: left;
  width: 100%;
  -webkit-tap-highlight-color: transparent;

  /* Stretches the button over the whole header, description included, so all
     of it toggles the section. */
  &::after {
    content: "";
    inset: 0;
    position: absolute;
  }

  &:focus {
    outline: none;
  }
`;

export const ChevronArea = styled.span`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  height: ${rem(24)};
  justify-content: center;
  width: ${rem(24)};
`;

export const Title = styled.span`
  flex: 1;
`;

export const Description = styled.p`
  ${typography.Sans16}

  color: ${palette.pine2};
  font-weight: 500;
  margin: 0;
  padding: 0 ${rem(spacing.md)} 0 ${rem(spacing.xxl)};
`;

export const Items = styled.div`
  border: 1px solid ${palette.slate20};
  border-radius: 0 0 ${CARD_RADIUS} ${CARD_RADIUS};
  border-top: none;
  padding: ${rem(spacing.lg)} 0;
`;
