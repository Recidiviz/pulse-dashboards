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

import styled from "styled-components";

import { Bold } from "./styles";

const Container = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export function TotalScore({
  score,
  lowUpper,
  mediumUpper,
}: {
  score: number | undefined;
  lowUpper: number;
  mediumUpper: number;
}) {
  return (
    <Container>
      <div>
        <Bold>TOTAL SCORE (IF GREATER THAN 45, WRITE 45):</Bold> {score}
      </div>
      <div>
        <div>
          <Bold>CUSTODY LEVEL SCALE FOR TOTAL:</Bold>
        </div>
        <div>
          <Bold>Low:</Bold> 0-{lowUpper}
        </div>
        <div>
          <Bold>Medium:</Bold> {lowUpper + 1}-{mediumUpper}
        </div>
        <div>
          <Bold>Close:</Bold> {mediumUpper + 1}-44
        </div>
        <div>
          <Bold>Maximum:</Bold> 45+
        </div>
      </div>
    </Container>
  );
}
