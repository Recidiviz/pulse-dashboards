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
 *
 * Various cell components for use in the form criteria checklist.
 */
import styled from "styled-components/macro";

import { BLUE_BACKGROUND, GRAY_BACKGROUND } from "./constants";

export const GreyCell = styled.div`
  grid-area: 1 / 1 / span 1 / end;
  border: 0.5px solid black;
  border-top: 0;
  font-weight: bold;
  display: flex;
  background-color: ${GRAY_BACKGROUND};
  color: white;
  justify-content: center;
  padding-top: 1px;
`;

export const BlueCell = styled.div`
  grid-area: 2 / 1 / span 2 / span 5;
  border: 0.5px solid black;
  border-top: 0;
  display: flex;
  background-color: ${BLUE_BACKGROUND};
  padding-left: 6px;
  padding-top: 1px;
`;

export const WhiteCell = styled.div<{ column: number; row: number }>`
  grid-area: ${({ row }) => row} / ${({ column }) => column} / span 1 / span 2;
  border: 0.5px solid black;
  border-top: 0;
  display: flex;
  padding-left: 6px;
  padding-top: 1px;
`;
