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

import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

interface FormHeaderProps {
  titleLineOne: string;
  titleLineTwo: string;
  subTitle: string;
}

const FormHeaderContainer = styled.div`
  margin-bottom: ${rem(10)};
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const FormHeaderHeading = styled.h1`
  margin-left: ${rem(50)};
  font-family: "Arial", sans-serif;
  font-size: 9px;
  margin-bottom: 0;
  margin-top: 0;
  letter-spacing: unset;
`;

const FormHeader: React.FC<FormHeaderProps> = ({
  titleLineOne,
  titleLineTwo,
  subTitle,
}) => (
  <FormHeaderContainer>
    <FormHeaderHeading>
      <strong>{titleLineOne}</strong>
      <br /> <strong>{titleLineTwo}</strong>
      <br />
      <em>{subTitle}</em>
    </FormHeaderHeading>
  </FormHeaderContainer>
);

export default FormHeader;
