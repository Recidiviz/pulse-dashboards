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

import styled from "styled-components";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";

// Wraps `react-datepicker` in `inline` + `showMonthYearPicker` mode and
// styles its native classes directly.
export const MonthYearPickerWrapper = styled.div`
  .react-datepicker {
    ${publicPathwaysTypography.Sans14};
    display: block;
    background: none;
    border: none;
    color: ${publicPathwaysPalette.pine3};
    width: 100%;
  }

  .react-datepicker__aria-live {
    display: none;
  }

  .react-datepicker__month-container {
    width: 100%;
  }

  .react-datepicker__month {
    margin: 0;
  }

  .react-datepicker__month-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 8px;
  }

  .react-datepicker__month-text {
    ${publicPathwaysTypography.Sans16};
    flex: 1;
    width: auto;
    padding: 0.75rem 0.5rem;
    margin: 0.5rem 0;
    border: 1px solid ${publicPathwaysPalette.slate20};
    border-radius: 6px;
    text-align: center;
    cursor: pointer;

    &:hover {
      background: none;
      border-color: ${publicPathwaysPalette.pine4};
      color: ${publicPathwaysPalette.pine4};
    }
  }

  /* Only an actual selection gets the solid fill. react-datepicker also
   * applies a "keyboard-selected" class to the current month by default
   * (its keyboard-navigation cursor) even when nothing has been chosen --
   * that gets the same subtle treatment as :hover, not the fill, so the
   * calendar doesn't look pre-selected. */
  .react-datepicker__month-text--selected {
    background: ${publicPathwaysPalette.focusColor};
    border-color: ${publicPathwaysPalette.focusColor};
    color: white;
    font-weight: 700;
  }

  .react-datepicker__month-text--keyboard-selected:not(
      .react-datepicker__month-text--selected
    ) {
    background: none;
    border-color: ${publicPathwaysPalette.pine4};
    color: ${publicPathwaysPalette.pine4};
  }

  .react-datepicker__month-text--disabled {
    border-color: ${publicPathwaysPalette.slate10};
    color: ${publicPathwaysPalette.slate30};
    cursor: not-allowed;
    pointer-events: none;

    &:hover {
      border-color: ${publicPathwaysPalette.slate10};
      color: ${publicPathwaysPalette.slate30};
    }
  }
`;

export const CalendarHeader = styled.div`
  ${publicPathwaysTypography.Sans16};
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 0.75rem;
`;

export const CalendarYearIconButton = styled.button.attrs({ type: "button" })`
  background: none;
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

  &:hover:not(:disabled) {
    background: ${publicPathwaysPalette.slate10};
  }

  &:active:not(:disabled) {
    background: ${publicPathwaysPalette.slate20};
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid ${publicPathwaysPalette.signal.links};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  svg {
    width: 12px;
    height: 10px;
    display: block;
  }
`;
