// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { find } from "lodash";
import React from "react";
import styled from "styled-components/macro";

import { rangeString } from "../../../../utils";
import AssessmentItem, { SubItem } from "./AssessmentItem";
import { TextWithLeader } from "./styles";

const OptionScore = styled.div`
  flex-grow: 0;
  width: 4rem;
  text-align: right;
`;

type Level = {
  text: string;
  min?: number;
  max?: number;
};

type AssessmentScoreProps = {
  score?: number;
  title: string;
  levels: Level[];
  scoreText?: string;
};

const isInRange =
  (score?: number) =>
  ({ min, max }: Level) => {
    if (score === undefined) return false;
    if (min !== undefined && score < min) return false;
    if (max !== undefined && score > max) return false;
    return true;
  };

const AssessmentScore: React.FC<AssessmentScoreProps> = ({
  score,
  title,
  levels,
  scoreText,
}) => (
  <AssessmentItem
    title={title}
    score={score}
    scoreText={scoreText || find(levels, isInRange(score))?.text || ""}
  >
    {levels.map((l) => (
      <SubItem key={l.text}>
        <TextWithLeader>{l.text}</TextWithLeader>
        <OptionScore>{rangeString(l)}</OptionScore>
      </SubItem>
    ))}
  </AssessmentItem>
);

export default AssessmentScore;