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

import { BoldWeight } from "./styles";

const Container = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Bold = styled.span`
  ${BoldWeight}
`;

export function TotalScore({ score }: { score: number }) {
  return (
    <Container>
      <div>
        <Bold>TOTAL SCORE (IF GREATER THAN 40, WRITE 40):</Bold> {score}
      </div>
      <div>
        <div>
          <Bold>CUSTODY LEVEL SCALE FOR TOTAL:</Bold>
        </div>
        <div>
          <Bold>Low:</Bold> 0-12
        </div>
        <div>
          <Bold>Medium:</Bold> 13-27
        </div>
        <div>
          <Bold>Close:</Bold> 28-40
        </div>
        <div>
          <Bold>Maximum:</Bold> 3+ violent Class A or B disciplinaries in last 6
          months OR homicide disciplinary while incarcerated
        </div>
      </div>
      <div>
        <Bold>
          Date of Final Approval and Entry in OMS/Recidiviz Tool: __________
        </Bold>
      </div>
    </Container>
  );
}
