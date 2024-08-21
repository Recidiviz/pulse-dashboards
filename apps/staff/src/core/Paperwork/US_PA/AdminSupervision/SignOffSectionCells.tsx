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
import styled from "styled-components/macro";

import { BLUE_BACKGROUND } from "./constants";

export const EligibilityCell = styled.div`
  grid-area: 1 / 1 / span 2 / end;
  border: 2px solid black;
  border-top: 1.5px solid black;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 2em;
`;
export const DispositionCell = styled.div`
  grid-area: 6 / 1 / span 2 / end;
  border: 0.5px solid black;
  border-top: 0;
  display: flex;
  background-color: ${BLUE_BACKGROUND};
  padding-left: 6px;
  padding-top: 1px;
  font-size: ${rem(8)};
`;

const SignatureCell = styled.div<{ column: number }>`
  grid-area: 3 / ${({ column }) => column} / span 2 / span 1;
  border: 0.5px solid black;
  border-top: 0;
`;
const LabelCell = styled.div<{ column: number }>`
  grid-area: 5 / ${({ column }) => column} / span 1 / span 1;
  border: 0.5px solid black;
  border-top: 0;
  display: flex;
  justify-content: center;
  font-style: italic;
  font-size: ${rem(7)};
`;

type SignOffCellProps = {
  column: number;
  label: string;
};

export const SignOffCell = ({ column, label }: SignOffCellProps) => {
  return (
    <>
      <SignatureCell column={column} />
      <LabelCell column={column}>{label}</LabelCell>
    </>
  );
};
