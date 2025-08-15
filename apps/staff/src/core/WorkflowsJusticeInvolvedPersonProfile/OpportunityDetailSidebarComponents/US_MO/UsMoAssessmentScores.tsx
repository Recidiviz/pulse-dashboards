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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { DetailsHeading, DetailsSection } from "../../styles";
import { ResidentProfileProps } from "../../types";

const ScoresTable = styled.table`
  ${typography.Sans14};
  color: ${palette.slate80};
  border-spacing: 0;
  border-collapse: separate;
  margin-top: ${rem(spacing.md)};
  margin-bottom: ${rem(spacing.lg)};
  width: 100%;
`;

const ScoresTableCell = styled.td`
  border: 1px ${palette.slate20};

  border-top-style: solid;
  border-left-style: solid;
  padding: ${rem(spacing.sm)};
`;

const ShadedScoresTableCell = styled(ScoresTableCell)`
  background-color: ${palette.marble3};
  white-space: nowrap;
  width: 70%;
`;

const ScoresTableRow = styled.tr`
  /* last column: right border */
  & ${ScoresTableCell}:last-child {
    border-right-style: solid;
  }

  /* first row: round corners */
  &:first-child {
    & ${ScoresTableCell} {
      &:first-child {
        border-top-left-radius: 4px;
      }
      &:last-child {
        border-top-right-radius: 4px;
        border-right-style: solid;
      }
    }
  }

  /* last row: bottom border, round corners */
  &:last-child {
    & ${ScoresTableCell} {
      border-bottom-style: solid;

      &:first-child {
        border-bottom-left-radius: 4px;
      }
      &:last-child {
        border-bottom-right-radius: 4px;
      }
    }
  }
`;

const Row: React.FC<{ label: string; score?: number | null }> = ({
  label,
  score,
}) => {
  return (
    <ScoresTableRow>
      <ShadedScoresTableCell>{label}</ShadedScoresTableCell>
      <ScoresTableCell>{score ?? "N/A"}</ScoresTableCell>
    </ScoresTableRow>
  );
};

const UsMoAssessmentScores: React.FC<ResidentProfileProps> = ({ resident }) => {
  const metadata = resident.metadata;
  if (metadata.stateCode !== "US_MO") return null;

  return (
    <DetailsSection>
      <DetailsHeading>Assessment Scores</DetailsHeading>
      <ScoresTable className="fs-exclude">
        <tbody>
          <Row label="Medical" score={metadata.medicalScore} />
          <Row label="Public Risk" score={metadata.publicRiskScore} />
          <Row
            label="Institutional Risk"
            score={metadata.institutionalRiskScore}
          />
          <Row label="Education" score={metadata.educationScore} />
          <Row label="Mental Health" score={metadata.mentalHealthScore} />
        </tbody>
      </ScoresTable>
    </DetailsSection>
  );
};

export default UsMoAssessmentScores;
