// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import styled from "styled-components";

import { Bold } from "./styles";

const Container = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RequirementLead = styled.span`
  text-decoration: underline;
`;

const ScoreBox = styled.div`
  margin-top: 1rem;
  border: 2px solid black;
  padding: ${rem(8)} ${rem(10)};
  display: flex;
  justify-content: space-between;
  gap: ${rem(16)};
`;

const ScoreColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(6)};
`;

const ScaleColumn = styled.div`
  flex: 0 0 auto;
`;

/** Fixed label width, so the ranges line up in a column. */
const ScaleRow = styled.div`
  display: flex;
  gap: ${rem(12)};

  & > span:first-child {
    width: ${rem(96)};
  }
`;

const RequirementLine = styled.div`
  margin-top: ${rem(6)};
`;

const ContinueNote = styled.div`
  margin-top: ${rem(6)};
  text-align: right;
  font-style: italic;
`;

export const CONTINUE_TO_TRUSTEE_COPY =
  "Continue to the next page to complete the Trustee Assessment";

export function TotalScore({
  score,
  lowUpper,
  mediumUpper,
  trusteeAssessmentRequired = false,
  reworkEnabled = false,
  custodyLevel,
}: {
  score: number | undefined;
  lowUpper: number;
  mediumUpper: number;
  /** The DCAF has no Trustee Assessment, so this is passed in rather than derived. */
  trusteeAssessmentRequired?: boolean;
  /** Off, the box keeps the pilot's layout, which is live in the field. */
  reworkEnabled?: boolean;
  /** The scored custody level, which is empty until the CAF has a total. */
  custodyLevel?: string;
}) {
  const scale = (
    <>
      <ScaleRow>
        <span>Low/Trustee</span> <span>0-{lowUpper}</span>
      </ScaleRow>
      <ScaleRow>
        <span>Medium</span>{" "}
        <span>
          {lowUpper + 1}-{mediumUpper}
        </span>
      </ScaleRow>
      <ScaleRow>
        <span>Close</span> <span>{mediumUpper + 1}-44</span>
      </ScaleRow>
      <ScaleRow>
        <span>Maximum</span> <span>45+</span>
      </ScaleRow>
    </>
  );

  const requirementLine = (
    <Bold>
      <RequirementLead>Trustee Assessment is required</RequirementLead> because
      the final custody level is Low.
    </Bold>
  );

  if (reworkEnabled) {
    return (
      <div>
        <ScoreBox>
          <ScoreColumn>
            <div>
              <Bold>TOTAL SCORE (CAPPED AT 45): {score}</Bold>
            </div>
            {custodyLevel && (
              <div>
                <Bold>RECOMMENDED CUSTODY LEVEL: {custodyLevel}</Bold>
              </div>
            )}
            {trusteeAssessmentRequired && (
              <RequirementLine>{requirementLine}</RequirementLine>
            )}
          </ScoreColumn>
          <ScaleColumn>
            <ScaleRow>
              <Bold>Custody level scale for total</Bold>
            </ScaleRow>
            {scale}
          </ScaleColumn>
        </ScoreBox>
        {trusteeAssessmentRequired && (
          <ContinueNote>{CONTINUE_TO_TRUSTEE_COPY} &darr;</ContinueNote>
        )}
      </div>
    );
  }

  return (
    <Container>
      <div>
        <Bold>TOTAL SCORE (CAPPED AT 45):</Bold> {score}
      </div>
      {trusteeAssessmentRequired && <div>{requirementLine}</div>}
      <div>
        <div>
          <Bold>CUSTODY LEVEL SCALE FOR TOTAL:</Bold>
        </div>
        <div>
          <Bold>Low/Trustee:</Bold> 0-{lowUpper}
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
