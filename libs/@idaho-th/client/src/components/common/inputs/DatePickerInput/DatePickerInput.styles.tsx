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

import styled, { createGlobalStyle } from "styled-components";

import { borderRadius, palette, spacing } from "../../../../styles";

export const DatePickerGlobalStyle = createGlobalStyle`
  .idaho-th-datepicker {
    z-index: 9999;
  }

  /*
   * The calendar renders into a portal, so wrapper styles never reach it and
   * the library's stock disabled grey has to be overridden globally.
   */
  .react-datepicker__day--disabled,
  .react-datepicker__day--disabled:hover {
    background-color: transparent;
    color: ${palette.foreground.disabled};
    cursor: not-allowed;
  }
`;

export const Shell = styled.div`
  width: 100%;

  .react-datepicker-wrapper,
  .react-datepicker__input-container {
    display: block;
    position: relative;
    width: 100%;
  }

  .react-datepicker__calendar-icon {
    cursor: pointer;
    height: 1rem;
    left: auto;
    margin: 0;
    padding: 0;
    position: absolute;
    right: ${spacing[3]};
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    z-index: 1;
  }

  .react-datepicker__view-calendar-icon input {
    padding-left: ${spacing[3]};
    padding-right: ${spacing[8]};
  }
`;

export const CalendarIconWrapper = styled.span`
  align-items: center;
  color: ${palette.foreground.tertiary};
  display: flex;
  justify-content: center;

  & svg {
    display: block;
    height: 1rem;
    width: 1rem;
  }
`;

export type DatePickerVariant = "default" | "valid" | "warning" | "error";

const variantBorderColor: Record<DatePickerVariant, string> = {
  default: palette.border.subtle,
  error: palette.foreground.attention,
  valid: palette.foreground.brand,
  warning: palette.misc.strongAmber,
};

export const Input = styled.input<{
  $hasError?: boolean;
  $variant?: DatePickerVariant;
}>`
  align-self: stretch;
  background: ${palette.background.secondary};
  border: 0.0625rem solid
    ${({ $hasError, $variant }) =>
      variantBorderColor[$variant ?? ($hasError ? "error" : "default")]};
  border-radius: ${borderRadius[8]};
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  font-size: 0.875rem;
  font-weight: 400;
  height: 2.5rem;
  line-height: 1.25rem;
  padding: ${spacing[3]};
  width: 100%;
`;
