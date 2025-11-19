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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { css } from "styled-components";

import { palette } from "../../styles";
import { Button } from "../Button";

export const MenuItemElement = styled.button<{ isLink?: boolean }>`
  ${typography.Sans14}
  color: ${palette.pine3};
  list-style: none;
  height: ${rem(32)};
  line-height: ${rem(32)};
  padding: 0 ${rem(spacing.md)};
  transition-property: color, background-color;
  transition-timing-function: ease-in-out;
  transition-duration: 0.1s;
  background-color: ${palette.white};
  border: none;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  outline: 1px solid transparent; /* Use outline for focus, reserve space */
  outline-offset: -1px;

  &:last-child {
    margin-bottom: ${rem(spacing.sm)};
  }

  &:first-child:last-child {
    margin-top: 0;
    margin-bottom: 0;
    border-radius: 8px;
  }

  &:first-child {
    margin-top: ${rem(spacing.sm)};
  }

  ${({ isLink }) =>
    isLink &&
    css`
      &:focus-visible {
        /* Bring the focused item to the front to show its full border */
        position: relative;
        z-index: 1;
        outline-color: ${palette.signal.links};
        border-radius: 8px;
      }
    `}

  ${({ isLink }) =>
    !isLink &&
    css`
      &:focus {
        outline: none;
        color: ${palette.white};
        background-color: ${palette.signal.links};
        cursor: pointer;
      }

      &:active {
        background-color: ${palette.pine4};
      }
    `}
`;

export const MenuLabelElement = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  height: ${rem(32)};
  line-height: ${rem(32)};
  padding: 0 ${rem(spacing.md)};
  white-space: nowrap;

  &:first-child {
    margin-top: ${rem(spacing.sm)};
  }

  &:last-child {
    margin-bottom: ${rem(spacing.sm)};
  }

  &:first-child:last-child {
    margin-top: 0;
    margin-bottom: 0;
    border-radius: 8px;
  }
`;

export interface MenuElementProps {
  alignment?: "left" | "right";
  shown: boolean;
}

export const MenuElement = styled.div.attrs({
  role: "menu",
})<MenuElementProps>`
  ${typography.Sans14}
  display: flex;
  flex-direction: column;
  position: absolute;
  min-width: 193px;
  padding: 0;
  margin-top: ${rem(spacing.xs)};
  ${(props: MenuElementProps) => props.alignment || "left"}: 0;

  background: ${palette.marble1};
  box-shadow:
    0px 15px 40px rgba(53, 83, 98, 0.3),
    inset 0px -1px 1px rgba(19, 44, 82, 0.2);
  border-radius: 8px;

  transition: 0.15s ease-in-out;
  transition-property: opacity, transform;

  z-index: 0;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-25%);

  ${(props: MenuElementProps) =>
    props.shown &&
    css`
      z-index: 1;
      opacity: 1;
      pointer-events: all;
      transform: translateY(0);
    `}
`;

export const ToggleElement = styled(Button)``;

export const CaretWrapper = styled.span`
  display: inline-flex;
  padding-left: ${rem(spacing.sm)};
  vertical-align: middle;
`;

export const DropdownElement = styled.div`
  display: inline-block;
  position: relative;
`;
