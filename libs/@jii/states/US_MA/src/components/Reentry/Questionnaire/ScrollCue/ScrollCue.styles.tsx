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

import { palette, spacing } from "~design-system";

const CHEVRON_BUTTON_SIZE = spacing.xl + spacing.sm;

export const Wrapper = styled.div`
  align-items: center;
  bottom: 100%;
  display: flex;
  flex-direction: column;
  height: ${rem(spacing.xxl + spacing.xl)};
  justify-content: flex-end;
  left: 0;
  padding-bottom: ${rem(spacing.sm)};
  pointer-events: none;
  position: absolute;
  right: 0;
`;

export const Fade = styled.div`
  background: linear-gradient(to bottom, transparent, ${palette.marble1} 72%);
  inset: 1px;
  position: absolute;
`;

export const ChevronButton = styled.button`
  align-items: center;
  background: ${palette.marble1};
  border: 1px solid ${palette.slate20};
  border-radius: 50%;
  box-shadow: 0 ${rem(spacing.xs)} ${rem(spacing.md)}
    ${rgba(palette.pine1, 0.12)};
  color: ${palette.pine2};
  cursor: pointer;
  display: flex;
  height: ${rem(CHEVRON_BUTTON_SIZE)};
  justify-content: center;
  padding: 0;
  pointer-events: auto;
  position: relative;
  width: ${rem(CHEVRON_BUTTON_SIZE)};
`;
