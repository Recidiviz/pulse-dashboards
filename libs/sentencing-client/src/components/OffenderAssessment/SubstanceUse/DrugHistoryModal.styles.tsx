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

import styled from "styled-components";

import { Icon, IconSVG, iconToDataURI, palette } from "~design-system";

import * as CaseDetailsStyled from "../../CaseDetails/CaseDetails.styles";

export const CALENDAR_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG["CalendarSimple"]} color={palette.pine4} />,
);

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow: visible;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 2rem;
`;

export const Title = styled.h2`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1.5rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 1.8rem */
  letter-spacing: -0.03rem;
  padding: 2.5rem 2.5rem 0rem 2.5rem;
`;

export const Description = styled.p`
  color: ${palette.slate70};
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 1.05rem */
  letter-spacing: -0.00875rem;
  padding: 0rem 2.5rem 0rem 2.5rem;
`;

export const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0rem 2.5rem 2.5rem 2.5rem;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Label = styled.label`
  color: ${palette.pine1};

  font-family: "Public Sans";
  font-size: 1rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 1.2rem */
  letter-spacing: -0.01rem;
`;

export const DatePickerWrapper = styled(CaseDetailsStyled.DatePickerWrapper)`
  .react-datepicker__input-container input {
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1rem;
    background-image: ${CALENDAR_BACKGROUND};
    padding-right: 2.5rem;
  }
`;

export const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.62rem 2.5rem;
  border-top: 1px solid ${palette.slate20};
`;

export const ErrorMessage = styled.div`
  color: ${palette.signal.error};
  font-family: "Public Sans";
  font-size: 0.875rem;
  line-height: 1.5;
`;
