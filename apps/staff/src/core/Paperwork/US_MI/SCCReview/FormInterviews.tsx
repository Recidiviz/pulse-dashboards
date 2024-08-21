// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import * as React from "react";
import styled from "styled-components/macro";

import { FormCheckbox } from "./FormUtils";

const ContentContainer = styled.div`
  display: grid;
  grid-template: 1fr 1fr 1fr / 45% 40% 15%;
  height: 45px;
  border: 1px solid black;
`;

const HeaderRow = styled.div`
  grid-area: 1 / 1 / span 1 / end;
  background-color: #a4cbfa;
  border-bottom: 0.5px solid black;
  padding-left: 2px;
`;

type CellProps = {
  row: number;
  col: number;
  rowSpan?: number | string;
  colSpan?: number | string;
};

const Cell = styled.div<CellProps>`
  grid-area: ${({ row }) => row} / ${({ col }) => col} / span
    ${({ rowSpan }) => rowSpan ?? 1} / span ${({ colSpan }) => colSpan ?? 1};
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 2px;
  line-height: 0.95;
  border-style: solid;
  border-color: black;
  border-width: 0 0 ${({ row }) => (row === 3 ? 0 : 0.5)}px
    ${({ col }) => (col === 1 ? 0 : 0.5)}px;
`;

const FormInterviews: React.FC = () => {
  return (
    <ContentContainer>
      <HeaderRow>
        <b>REQUIRED INTERVIEWS</b>
      </HeaderRow>
      <Cell row={2} col={1}>
        <div style={{ display: "flex" }}>
          <div style={{ paddingLeft: "4px" }}>
            <FormCheckbox name="wardenInterview" label="Warden (6 months)" />
          </div>
        </div>
      </Cell>
      <Cell row={2} col={2}>
        Signature:
      </Cell>
      <Cell row={2} col={3}>
        Date:
      </Cell>

      <Cell row={3} col={1}>
        <div style={{ display: "flex" }}>
          <div style={{ paddingLeft: "4px" }}>
            <FormCheckbox name="addInterview" />
            ADD (Annual)
          </div>
        </div>
      </Cell>
      <Cell row={3} col={2}>
        Signature:
      </Cell>
      <Cell row={3} col={3}>
        Date:
      </Cell>
    </ContentContainer>
  );
};

export default FormInterviews;
