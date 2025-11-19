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

import { rem } from "polished";
import styled from "styled-components";

const Container = styled.div`
  display: grid;
  grid-template-columns: 3% 85% auto;
  margin: 0.5rem 0;
  width: 95%;

  & th {
    font-weight: 600;
    font-size: ${rem(10)};
    letter-spacing: -0.01rem;
  }
`;

const Header = styled.div`
  font-weight: 600;
  font-size: ${rem(10)};
  letter-spacing: -0.01rem;
`;

const ChoiceContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-right: 1rem;
  line-height: 0.7rem;
`;

const ChoiceConnector = styled.div`
  flex-grow: 1;
  border-bottom: 1px solid black;
`;

type ChoiceOption = { label: string; value: number };

function ChoiceRow({
  label,
  value,
  lastChoice = false,
}: ChoiceOption & { lastChoice?: boolean }) {
  return (
    <>
      <div />
      <ChoiceContainer>
        <div>{label}</div>
        <ChoiceConnector />
        <div>{value}</div>
      </ChoiceContainer>
      <div>{lastChoice ? "SCORE: 6" : null}</div>
    </>
  );
}

export function MultichoiceScore({
  questionNumber,
  title,
  choices,
}: {
  title: string;
  questionNumber: number;
  choices: Array<ChoiceOption>;
}) {
  return (
    <Container>
      <Header>{questionNumber}.</Header>
      <Header>{title}</Header>
      <div />
      {choices.map((choice, index) => (
        <ChoiceRow
          key={choice.label}
          {...choice}
          lastChoice={index === choices.length - 1}
        />
      ))}
    </Container>
  );
}
