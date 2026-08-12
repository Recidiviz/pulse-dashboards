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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { ParoleRiskAssessment } from "~datatypes";
import { palette } from "~design-system";

import { WorkflowsBadgePill } from "../../BadgePill/BadgePill";
import { RiskLevel } from "./RiskAssessmentSection.utils";
import { formatDate } from "./shared";

const ChartDetailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(spacing.lg)};
  margin-top: 1rem;
  min-height: ${rem(32)};
  font-size: 14px;
`;

const ChartDetailMetric = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${rem(spacing.sm)};
`;

const SelectedMetric = styled(ChartDetailMetric)`
  color: black;
`;

const ScoreDisplay = styled.span`
  font-size: 20px;
`;

const AssessedDate = styled.span`
  color: #72777a;
`;

const AllAssessmentsMetric = styled(ChartDetailMetric)`
  gap: 1.5rem;
`;

const AllAssessmentsLabel = styled.span`
  font-size: 16px;
  color: black;
`;

const ChartDetailBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
`;

const StaleWarning = styled.span`
  display: flex;
  align-items: center;
  gap: ${rem(4)};
  color: ${palette.signal.error};
  font-size: 12px;
`;

export function RiskAssessmentDetailHeader({
  selectedAssessment,
  selectedRisk,
  selectedRawPct,
  selectedStale,
  hasCustomConfig,
  aggregateHeaderLabel,
  aggregateAssessmentCount,
}: {
  selectedAssessment: ParoleRiskAssessment | null;
  selectedRisk: RiskLevel | null;
  selectedRawPct: number | null;
  selectedStale: boolean;
  hasCustomConfig: boolean;
  aggregateHeaderLabel: string;
  aggregateAssessmentCount: number;
}) {
  return (
    <ChartDetailHeader>
      {selectedAssessment && selectedRisk && selectedRawPct !== null ? (
        <>
          <SelectedMetric>
            <span>{selectedAssessment.tool}</span>
            <ScoreDisplay>
              {selectedAssessment.score} / {selectedAssessment.maxScore}
            </ScoreDisplay>
            <AssessedDate>
              Assessed {formatDate(selectedAssessment.date)}
            </AssessedDate>
          </SelectedMetric>
          <ChartDetailBadgeRow>
            <WorkflowsBadgePill
              text={
                hasCustomConfig
                  ? `${selectedRisk.label} Risk`
                  : `${selectedRisk.label} Risk — ${Math.round(selectedRawPct)}%`
              }
              palette={selectedRisk.palette}
            />
            {selectedStale && (
              <StaleWarning>Last assessment over 12 months ago</StaleWarning>
            )}
          </ChartDetailBadgeRow>
        </>
      ) : (
        <AllAssessmentsMetric>
          <AllAssessmentsLabel>{aggregateHeaderLabel}</AllAssessmentsLabel>
          <span>{aggregateAssessmentCount} assessment types selected</span>
        </AllAssessmentsMetric>
      )}
    </ChartDetailHeader>
  );
}
