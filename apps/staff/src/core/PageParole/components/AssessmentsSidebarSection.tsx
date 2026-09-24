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
import { Fragment } from "react";
import styled from "styled-components";

import { ParoleRiskAssessment, ParoleRiskTool } from "~datatypes";
import { palette } from "~design-system";

import { PaletteKey, statusStyles } from "../../BadgePill/BadgePill";
import {
  getRiskLevelForAssessment,
  latestAssessmentsByTool,
} from "./RiskAssessmentSection.utils";
import {
  FactLabel,
  FactRow,
  FactRowStack,
  FactStack,
  formatDate,
  Hr,
  SectionStack,
  SubsectionTitle,
} from "./shared";

// SectionStack's gap already spaces this from the first AssessmentRow, so
// SubsectionTitle's own margin-bottom would double that spacing here.
const AssessmentsTitle = styled(SubsectionTitle)`
  margin-bottom: 0;
`;

// Groups one tool's fact row with its score line -- a tighter version of
// SectionStack's gap, sized for facts within a single assessment rather than
// the larger groups (a fact grid, a divider, a labeled subsection, ...)
// SectionStack itself stacks.
const AssessmentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

const AssessmentFactRow = styled(FactRow)`
  > * {
    flex: 0 0 auto;
  }
`;

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
  margin-top: 0.5rem;
`;

const ScoreValueGroup = styled.div`
  display: flex;
  align-items: center;
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
 * The risk level's colour as plain text. Each badge palette's foreground is
 * meant to sit on its own tinted background; only SLATE_DARK inverts, white
 * on dark slate, so unbacked it takes the dark slate instead.
 *
 * @param key - The palette the risk level maps to.
 */
function riskTextColor(key: PaletteKey): string {
  const { color, backgroundColor } = statusStyles[key];
  return key === "SLATE_DARK" ? backgroundColor : color;
}

const RiskLevel = styled.span<{ $color: string }>`
  ${typography.Sans14}
  color: ${({ $color }) => $color};
  font-weight: 500;
`;

const NotOnFileList = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

// FactStack's default gap (0.25em) is sized for a label sitting directly
// above its value; the label here sits above a whole list, so it gets more
// breathing room.
const NotOnFileGroup = styled(FactStack)`
  gap: 0.5rem;
`;

/**
 * Sidebar (left column) block on the parole case profile page showing the
 * most recent result per assessment tool this tenant tracks, plus which of
 * those tools have no result on file. US_ID-specific (OBT-45410) -- see
 * ParoleConfig.riskAssessmentConfig, which supplies `tools`. Deliberately
 * omits any change-over-time detail; the main Risk Score Trajectory section
 * (RiskAssessmentSection) still covers that.
 */
export function AssessmentsSidebarSection({
  riskAssessments,
  tools,
}: {
  riskAssessments: Array<ParoleRiskAssessment>;
  // Tools this tenant tracks, in display order. A tool with no matching
  // entry in `riskAssessments` still renders, under "Non Applicable/Not on
  // File".
  tools: Array<ParoleRiskTool>;
}) {
  if (tools.length === 0) return null;

  const latestByTool = new Map(
    latestAssessmentsByTool(riskAssessments).map((a) => [a.tool, a]),
  );
  const onFileAssessments = tools
    .map((tool) => latestByTool.get(tool))
    .filter((a): a is ParoleRiskAssessment => a !== undefined);
  const notOnFileTools = tools.filter((tool) => !latestByTool.has(tool));

  return (
    <SectionStack>
      <AssessmentsTitle>Assessments</AssessmentsTitle>

      {onFileAssessments.map((assessment, index) => {
        const risk = getRiskLevelForAssessment(assessment);
        return (
          <Fragment key={assessment.tool}>
            {index > 0 && <Hr />}
            <AssessmentRow>
              <AssessmentFactRow>
                <FactRowStack>
                  <div>Type</div>
                  <FactLabel>{assessment.tool}</FactLabel>
                </FactRowStack>
                <FactRowStack>
                  <div>Date</div>
                  <FactLabel>{formatDate(assessment.date)}</FactLabel>
                </FactRowStack>
              </AssessmentFactRow>
              <ScoreRow>
                <ScoreValueGroup>
                  <ScoreValue>{assessment.score}</ScoreValue>
                  {/* US_ID records no max score, so this shows the score
                      alone there and "out of N" for tenants that do. */}
                  {assessment.maxScore !== undefined && (
                    <ScoreOutOf>out of {assessment.maxScore}</ScoreOutOf>
                  )}
                </ScoreValueGroup>
                {risk && (
                  <RiskLevel $color={riskTextColor(risk.palette)}>
                    {risk.label} Risk
                  </RiskLevel>
                )}
              </ScoreRow>
            </AssessmentRow>
          </Fragment>
        );
      })}

      {notOnFileTools.length > 0 && (
        <>
          {onFileAssessments.length > 0 && <Hr />}
          <NotOnFileGroup>
            <div>Non Applicable/ Not on File</div>
            <NotOnFileList>
              {notOnFileTools.map((tool) => (
                <FactLabel as="li" key={tool}>
                  {tool}
                </FactLabel>
              ))}
            </NotOnFileList>
          </NotOnFileGroup>
        </>
      )}
    </SectionStack>
  );
}
