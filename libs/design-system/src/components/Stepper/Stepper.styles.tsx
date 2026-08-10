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

import styled, { css } from "styled-components";

import { palette, typography } from "../../styles";

const DOT_SIZE_PX = 24;
const COMPACT_DOT_SIZE_PX = 8;
const COMPACT_GAP_PX = 8;

export const StepperWrapper = styled.ol<{ $compact: boolean }>`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;

  ${({ $compact }) =>
    $compact &&
    css`
      display: inline-flex;
      gap: ${COMPACT_GAP_PX}px;
      width: auto;
    `}
`;

export const StepWrapper = styled.li<{
  $isConnectorActive: boolean;
  $compact: boolean;
  $accentColor: string;
}>`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  position: relative;

  &:not(:first-child)::before {
    background: ${palette.marble5};
    content: "";
    height: 2px;
    left: -50%;
    position: absolute;
    top: ${DOT_SIZE_PX / 2}px;
    width: 100%;
    z-index: 0;
  }

  ${({ $isConnectorActive, $accentColor }) =>
    $isConnectorActive &&
    css`
      &:not(:first-child)::before {
        background: ${$accentColor};
      }
    `}

  ${({ $compact }) =>
    $compact &&
    css`
      flex: none;

      &:not(:first-child)::before {
        left: -${COMPACT_GAP_PX}px;
        top: ${COMPACT_DOT_SIZE_PX / 2}px;
        width: ${COMPACT_GAP_PX}px;
      }
    `}
`;

export const StepDot = styled.div<{
  $isCompleted: boolean;
  $isCurrent: boolean;
  $compact: boolean;
  $accentColor: string;
}>`
  align-items: center;
  background: ${palette.marble2};
  border: 1px solid ${palette.marble5};
  border-radius: 50%;
  color: ${palette.slate30Opaque};
  display: flex;
  height: ${DOT_SIZE_PX}px;
  justify-content: center;
  position: relative;
  width: ${DOT_SIZE_PX}px;
  z-index: 1;
  ${typography.Sans12}

  ${({ $isCompleted, $isCurrent, $accentColor }) =>
    ($isCompleted || $isCurrent) &&
    css`
      background: ${$accentColor};
      border-color: ${$accentColor};
      color: ${palette.white};
    `}

  ${({ $isCurrent }) =>
    $isCurrent &&
    css`
      box-shadow: 0 0 0 3px ${palette.slate10};
    `}

  ${({ $compact }) =>
    $compact &&
    css`
      height: ${COMPACT_DOT_SIZE_PX}px;
      width: ${COMPACT_DOT_SIZE_PX}px;
    `}
`;

export const StepLabel = styled.span<{ $isCurrent: boolean }>`
  color: ${palette.slate30Opaque};
  margin-top: 8px;
  text-align: center;
  ${typography.Sans12}

  ${({ $isCurrent }) =>
    $isCurrent &&
    css`
      color: ${palette.pine1};
      font-weight: 600;
    `}
`;
