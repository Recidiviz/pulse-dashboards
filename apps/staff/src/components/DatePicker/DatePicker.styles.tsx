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

import { typography } from "@recidiviz/design-system";
import styled from "styled-components";

import { palette } from "~design-system";

// Wraps `react-datepicker` and styles its native classes directly. The popper
// is rendered inline (not portaled) by default, so it ends up as a descendant
// of this div and the nested selectors below reach it without an extra
// `popperClassName` scoping hook.
export const DatePickerWrapper = styled.div`
  .react-datepicker__input-container {
    position: relative;
  }

  .react-datepicker__input-container input {
    ${typography.Sans14};
    padding: 12px 16px;
    border: 1px solid ${palette.slate20};
    border-radius: 6px;
    color: ${palette.pine3};
    font-weight: 500;
    width: 100%;

    &:focus {
      outline: 2px solid ${palette.signal.links};
      outline-offset: 1px;
      border-color: transparent;
    }
  }

  .react-datepicker__calendar-icon {
    color: ${palette.pine4};
    padding: 0;
  }

  .react-datepicker {
    ${typography.Sans14};
    background: ${palette.marble1};
    color: ${palette.pine3};
    border-radius: 8px;
    border: 1px solid ${palette.slate20};
    box-shadow: 8px 10px 7px ${palette.slate05};
    z-index: 1000;
  }

  .react-datepicker__month {
    display: block;
  }

  .react-datepicker__week {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .react-datepicker__day,
  .react-datepicker__day-name {
    width: 1.4rem;
    height: 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    margin: 0.5rem;
  }

  .react-datepicker__day {
    cursor: pointer;
  }

  .react-datepicker__day:hover {
    background: ${palette.pine4};
    color: ${palette.marble1};
    border-radius: 3px;
  }

  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background: ${palette.pine4};
    color: ${palette.marble1};
    border-radius: 3px;
  }

  .react-datepicker__day--outside-month {
    color: ${palette.slate30};
    pointer-events: none;
  }

  .react-datepicker__day--disabled {
    color: ${palette.slate60};
    cursor: not-allowed;
    pointer-events: none;
  }

  .react-datepicker__aria-live {
    display: none;
  }

  .react-datepicker__day-name {
    display: none;
  }

  /* Month/year picker tiles (active when showMonthYearPicker={true}) */
  .react-datepicker__month-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .react-datepicker__month-text {
    width: auto;
    padding: 0.1rem 0.25rem;
    margin: 0.75rem;
    border: 1px solid transparent;
    border-radius: 6px;

    &:hover {
      background: none;
      border-color: ${palette.pine4};
      color: ${palette.pine4};
    }
  }

  .react-datepicker__month-text--selected,
  .react-datepicker__month-text--keyboard-selected {
    background: none;
    border-color: ${palette.pine4};
    color: ${palette.pine4};
  }
`;

export const CalendarHeader = styled.div`
  ${typography.Sans14};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding: 0 8px 10px 8px;
  border-bottom: 1px solid ${palette.slate05};
  background: ${palette.marble1};
`;

export const CalendarCenter = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const CalendarYearStack = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
`;

export const CalendarYearIconButton = styled.button.attrs({ type: "button" })`
  background: ${palette.marble1};
  border: none;
  padding: 2px 4px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  cursor: pointer;
  transition:
    background-color 0.1s ease-in-out,
    transform 0.05s ease-in-out;

  &:hover {
    background: ${palette.slate10};
  }

  &:active {
    background: ${palette.slate20};
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 1px;
  }

  svg {
    width: 10px;
    height: 10px;
    display: block;
  }
`;

export const CalendarMonthIconButton = styled.button.attrs({ type: "button" })`
  background: ${palette.marble1};
  border: none;
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.1s ease-in-out,
    transform 0.05s ease-in-out;

  &:hover {
    background: ${palette.slate10};
  }

  &:active {
    background: ${palette.slate20};
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 1px;
  }

  svg {
    width: 12px;
    height: 10px;
    display: block;
  }
`;
