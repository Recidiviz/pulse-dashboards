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

import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

type HeaderCellProps = {
  columnStart: number;
};

export const HeaderCell = styled.div<HeaderCellProps>`
  grid-area: 1 / ${({ columnStart }) => columnStart} / span 1 / span 2;
  border: 0.5px solid black;
  font-weight: bold;
  font-size: ${rem(8.5)};
  display: flex;
  background-color: #353535;
  color: white;
  justify-content: center;
  align-items: flex-end;
  padding-top: 1px;
`;

export const ColumnSubheaders = ({ columnStart }: HeaderCellProps) => {
  return (
    <>
      <BasicCell
        column={columnStart}
        row={2}
        leftBorder={true}
        style={{ fontSize: rem(8.5), paddingTop: 2 }}
      >
        CRIME
      </BasicCell>
      <BasicCell
        column={columnStart + 1}
        row={2}
        style={{ fontSize: rem(8.5), paddingTop: 2 }}
      >
        CON./ADJUD.*
      </BasicCell>
    </>
  );
};

type CellProps = {
  column: number;
  row: number;
  leftBorder?: boolean;
  rowSpan?: number;
};

export const BasicCell = styled.div<CellProps>`
  grid-area: ${({ row }) => row} / ${({ column }) => column} / span
    ${({ rowSpan }) => rowSpan ?? 1} / span 1;
  border: 0.5px solid black;
  ${({ leftBorder }) => !leftBorder && "border-left: 0;"}
  border-top: 0;
  display: flex;
  align-items: center;
  padding-top: 1px;
  ${({ row }) => row === 2 && "justify-content: center;"}
  ${({ row }) => row !== 2 && `padding-left: 6px;  padding-right: 6px;`}
`;
