/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2024 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import pdocLogo from "./assets/pdocLogo.png";
import { FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY } from "./constants";

const Logo = styled.img`
  width: 175px;
  height: auto;
`;

const ContentContainer = styled.div`
  display: flex;
  align-items: flex-end;
  margin-bottom: 10px;
`;

const HeadingText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 800px;
  font-size: ${rem(15)};
  font-family: ${FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY};
  letter-spacing: -0.01em;
  border: 0.5px solid black;
  margin-bottom: 5px;
`;

const FormHeading: React.FC = () => {
  return (
    <ContentContainer>
      <Logo src={pdocLogo} alt="PDOC Logo" />
      <HeadingText>Administrative Parole Eligibility</HeadingText>
    </ContentContainer>
  );
};

export default observer(FormHeading);
