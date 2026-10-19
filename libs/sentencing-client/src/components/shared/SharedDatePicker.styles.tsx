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

import { palette, typography } from "~design-system";

export const CalendarHeader = styled.div`
  ${typography.Sans14};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding: 0 8px 10px 8px;
  border-bottom: 1px solid ${palette.slate05};
  background: ${palette.white};
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
  background: ${palette.white};
  border: none;
  padding: 0;
  justify-content: center;
  line-height: 0;

  svg {
    width: 10px;
    height: 10px;
    display: block;
  }
`;

export const CalendarMonthIconButton = styled.button.attrs({ type: "button" })`
  background: ${palette.white};
  border: none;
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: ${palette.slate10};
  }

  svg {
    width: 18px;
    height: 18px;
    display: block;
  }
`;

const dateInputCss = css`
  ${typography.Sans14};
  padding: 12px 16px;
  border: 1px solid ${palette.slate20};
  border-radius: 6px;
  color: ${palette.pine3};
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  width: 150px;
  z-index: 1;

  &:disabled {
    cursor: not-allowed;
  }
`;

const dateCalendarIconCss = css`
  position: absolute;
  z-index: 2;
  left: 80%;
  margin-top: 20px;
  svg {
    width: 18px;
    height: 18px;
  }
`;

const calendarContainerCss = css`
  ${typography.Sans14};
  background: ${palette.white};
  color: ${palette.pine3};
  z-index: 1000;
  border-radius: 8px;
  border: 1px solid ${palette.slate20};
  box-shadow: 8px 10px 7px ${palette.slate05};
`;

const calendarDayCss = css`
  width: 1.4rem;
  height: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0.5rem;

  &:hover {
    background: ${palette.pine4};
    color: ${palette.white};
    border-radius: 3px;
  }
`;

const calendarWeekCSS = css`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 8px, 8px;
`;

export const DatePickerWrapper = styled.div`
  /* anchor the icon inside the input container */
  .react-datepicker__input-container {
    position: relative;
  }

  /* style the actual input element react-datepicker renders */
  .react-datepicker__input-container input {
    ${dateInputCss};
  }

  /* style the icon container (built-in class) OR your custom class */
  .react-datepicker__calendar-icon {
    ${dateCalendarIconCss};
  }

  .rcd-cal {
    ${calendarContainerCss}
  }

  .rcd-cal .react-datepicker__month {
    display: block;
  }

  /* Each week is a single row of 7 days */
  .rcd-cal .react-datepicker__week {
    ${calendarWeekCSS}
  }

  .rcd-cal .react-datepicker__day,
  .rcd-cal .react-datepicker__day-name {
    ${calendarDayCss}
  }

  .rcd-cal .react-datepicker__day--outside-month {
    color: ${palette.slate30};
    pointer-events: none;
  }

  .rcd-cal .react-datepicker__aria-live {
    display: none;
  }

  .rcd-cal .react-datepicker__day-name {
    display: none;
  }

  /* Month/year picker tiles */
  .rcd-cal .react-datepicker__month-wrapper {
    ${calendarWeekCSS}
  }

  .rcd-cal .react-datepicker__month-text {
    ${calendarDayCss}
    width: auto;
    padding: 0.1rem 0.25rem;
    margin: 0.75rem;
    border: 1px solid transparent;
    border-radius: 6px;

    &:hover {
      background: none;
      border-color: ${palette.pine4};
      color: ${palette.pine4};
      border-radius: 6px;
    }
  }

  .rcd-cal .react-datepicker__month-text--selected,
  .rcd-cal .react-datepicker__month-text--keyboard-selected {
    background: none;
    border-color: ${palette.pine4};
    color: ${palette.pine4};
  }
`;
