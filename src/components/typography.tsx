// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

// TODO(https://github.com/Recidiviz/web-libraries/issues/98): add this style to the design system
import "@fontsource/public-sans/600.css";

import { rem } from "polished";
import styled, { css } from "styled-components/macro";

// TODO(#1917): move these components/styles to design system
export const typeStyles = {
  uiSans14: css`
    font-family: ${(props) => props.theme.fonts.body};
    font-size: ${rem(14)};
    font-weight: 500;
    line-height: ${rem(24)};
    letter-spacing: -0.01em;
  `,
};

export const UiSans12 = styled.div`
  font-family: ${(props) => props.theme.fonts.body};
  font-size: ${rem(12)};
  font-weight: 500;
  line-height: ${rem(24)};
  letter-spacing: -0.01em;
`;

export const UiSans14 = styled.div`
  ${typeStyles.uiSans14}
`;

export const UiSans16 = styled.div`
  font-family: ${(props) => props.theme.fonts.body};
  font-size: ${rem(16)};
  font-weight: 500;
  line-height: ${rem(24)};
  letter-spacing: -0.01em;
`;

export const UiSans18 = styled.div`
  font-family: ${(props) => props.theme.fonts.body};
  font-size: ${rem(18)};
  font-weight: 500;
  line-height: ${rem(24)};
  letter-spacing: -0.02em;
`;

export const UiSans24 = styled.div`
  font-family: ${(props) => props.theme.fonts.body};
  font-size: ${rem(24)};
  font-weight: 400;
  line-height: ${rem(40)};
  letter-spacing: -0.02em;
`;
