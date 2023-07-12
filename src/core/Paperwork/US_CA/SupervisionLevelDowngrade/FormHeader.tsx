// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import styled from "styled-components/macro";

import { SmallTextStyle, TextStyle, TinyTextStyle } from "./styles";

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const LeftHeader = styled.div`
  display: flex;
  flex-direction: column;

  & > div:first-child {
    ${TinyTextStyle};
  }

  & > div:nth-child(2) {
    ${TextStyle};
  }

  & > div:nth-child(3) {
    ${SmallTextStyle};
  }
`;

const RightHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  & > div {
    ${TinyTextStyle};
  }
`;

const FormHeader = () => {
  return (
    <HeaderContainer>
      <LeftHeader>
        <div>STATE OF CALIFORNIA</div>
        <div>CASE CONFERENCE REVIEW/ DISCHARGE CONSIDERATION COMMITTEE</div>
        <div>CDCR 1657 (Rev. 03/13)</div>
      </LeftHeader>
      <RightHeader>
        <div>DEPARTMENT OF CORRECTIONS AND REHABILITATION</div>
        <div>DIVISION OF ADULT PAROLE OPERATIONS</div>
      </RightHeader>
    </HeaderContainer>
  );
};

export default FormHeader;
