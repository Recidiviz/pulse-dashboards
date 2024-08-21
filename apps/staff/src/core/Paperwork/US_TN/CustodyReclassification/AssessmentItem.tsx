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

// TODO(#4108): Consider and apply refactoring `UsTnAnnualReclassificationReview...` and `UsTnCustodyLevelDowngrade...` files to remove duplicated logic.
import styled from "styled-components/macro";

const Item = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const LeftColumn = styled.div`
  width: 27rem;
`;

const ScoreContainer = styled.div`
  margin-left: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BigNumber = styled.div`
  font-size: 2em;
  text-align: center;
  width: 2rem;
  border-bottom: 0.5px solid black;
`;

const ScoreText = styled.div`
  text-align: center;
  width: 3rem;
`;

export const SubItem = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-left: 2rem;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  align-items: flex-start;
`;

type AssessmentItemProps = {
  title: string;
  score?: number;
  scoreText: string;
  children?: React.ReactNode;
};

const AssessmentItem: React.FC<AssessmentItemProps> = ({
  title,
  score,
  scoreText,
  children,
}) => (
  <Item>
    <LeftColumn>
      <div>{title}</div>
      <div>{children}</div>
    </LeftColumn>
    <ScoreContainer>
      <BigNumber>{score}</BigNumber>
      <ScoreText>{scoreText}</ScoreText>
    </ScoreContainer>
  </Item>
);

export default AssessmentItem;
