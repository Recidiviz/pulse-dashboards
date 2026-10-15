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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { ParoleRiskAssessment } from "~datatypes";
import { palette } from "~design-system";

const ScoreValueGroup = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${rem(spacing.xs)};
`;

const ScoreValue = styled.span`
  ${typography.Serif24}
  color: ${palette.signal.links};
`;

const ScoreOutOf = styled.span`
  ${typography.Sans14}
  color: ${palette.slate70};
`;

/**
 * An assessment's score in large type, with "out of N" beside it when the
 * assessment has a max score.
 * @param assessment - The assessment whose score to show.
 */
export function AssessmentScore({
  assessment,
}: {
  assessment: ParoleRiskAssessment;
}) {
  return (
    <ScoreValueGroup>
      <ScoreValue>{assessment.score}</ScoreValue>
      {assessment.maxScore !== undefined && (
        <ScoreOutOf>out of {assessment.maxScore}</ScoreOutOf>
      )}
    </ScoreValueGroup>
  );
}
