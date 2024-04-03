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
import * as React from "react";
import styled from "styled-components/macro";

import { BLUE_BACKGROUND, FormDataType } from "./constants";
import FormCheckbox from "./FormCheckbox";

const ContentContainer = styled.div<CriteriaCheckboxProps>`
  grid-area: ${({ row }) => row} / ${({ column }) => column} /
    ${({ span }) => (span ? `span 2 / span 2` : `span 1 / span 1`)};
  display: flex;
  padding-top: ${({ span }) => (span ? "7px" : "1px")};
  justify-content: center;
  width: 100%;
  height: 100%;
  border-bottom: 0.5px solid black;
  border-right: 0.5px solid black;
  ${({ span }) => span && `background-color: ${BLUE_BACKGROUND}`}
`;

type CriteriaCheckboxProps = {
  row: number;
  column: number;
  span?: number;
  field: keyof FormDataType;
};

const CriteriaChecklistCheckbox = (props: CriteriaCheckboxProps) => {
  return (
    <ContentContainer {...props}>
      <FormCheckbox toggleable name={props.field} />
      YES
      <FormCheckbox
        toggleable
        invert
        name={props.field}
        style={{ marginLeft: "7px" }}
      />
      NO
    </ContentContainer>
  );
};

export default CriteriaChecklistCheckbox;
