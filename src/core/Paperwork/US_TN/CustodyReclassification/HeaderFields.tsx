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

import React from "react";
import styled from "styled-components/macro";

import FormInput from "./FormInput";
import { Label } from "./styles";

const Container = styled.div`
  width: 95%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 1rem;

  ${Label} {
    width: 49%;

    > input {
      flex-grow: 1;
      border-bottom: 0.5px solid black;
      margin-left: 0.5em;
    }
  }
`;

const HeaderFields: React.FC = () => (
  <Container>
    <Label>
      Name:
      <FormInput name="residentFullName" />
    </Label>
    <Label>
      OMS ID:
      <FormInput name="omsId" />
    </Label>

    <Label>
      Date:
      <FormInput name="date" />
    </Label>
    <Label>
      Level of Care:
      <FormInput name="levelOfCare" />
    </Label>

    <Label>
      Last CAF Score:
      <FormInput name="lastCafTotal" />
    </Label>
    <Label>
      Last CAF Date:
      <FormInput name="lastCafDate" />
    </Label>
  </Container>
);

export default HeaderFields;
