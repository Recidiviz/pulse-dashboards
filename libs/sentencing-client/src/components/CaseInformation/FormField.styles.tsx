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

import { rgba } from "polished";
import styled from "styled-components";

import { Icon, IconSVG, iconToDataURI, palette } from "~design-system";

import * as Styled from "../CaseDetails/CaseDetails.styles";

export const EDIT_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG["Edit"]} color={palette.signal.links} />,
);

export const CALENDAR_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG["CalendarSimple"]} color={palette.signal.links} />,
);

export const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: 0rem;
`;

export const InlineRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.65rem;
`;

export const Label = styled.label`
  color: rgba(53, 83, 98, 0.85);
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  white-space: nowrap;
`;

export const InputWrapper = styled.div<{ $inline?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
`;

export const InputBase = styled.input<{ $inline?: boolean }>`
  border: 1px solid white;
  font-weight: inherit;
  padding: 2px 9px 2px 1.5em;
  margin: -5px 0 0 -5px;
  font-size: 0.8rem;
  width: 100%;
  min-width: 1px;
  background-repeat: no-repeat;
  background-position: left 4px center;
  background-size: 0.75em;
  background-image: ${EDIT_BACKGROUND};
  &:focus {
    border: 1px solid ${rgba(palette.pine4, 0.15)};
    border-radius: 4px;
  }
  &::placeholder {
    color: ${palette.pine4};
  }
`;

export const HelperText = styled.div`
  color: rgba(53, 83, 98, 0.6);
  font-family: "Public Sans";
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 120%;
  font-style: italic;
`;

export const CustomDatePickerWrapper = styled(Styled.DatePickerWrapper)`
  /* Override the input styles to match InputBase but with calendar icon */
  .react-datepicker__input-container input {
    border: 1px solid white;
    font-weight: inherit;
    padding: 5px 9px 5px 1.5em;
    margin: -5px 0 0 -5px;
    font-size: 0.8rem;
    width: 100%;
    min-width: 1px;
    background-repeat: no-repeat;
    background-position: left 4px center;
    background-size: 0.85rem;
    background-image: ${CALENDAR_BACKGROUND};

    &:focus {
      border: 1px solid ${rgba(palette.pine4, 0.15)};
      border-radius: 4px;
    }

    &::placeholder {
      color: ${palette.pine4};
    }
  }

  /* Hide the default calendar icon since we're using background image */
  .react-datepicker__calendar-icon {
    display: none;
  }
`;
