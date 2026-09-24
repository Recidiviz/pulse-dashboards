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

import {
  ParoleRiskAssessment,
  ParoleRiskNeedFactor,
  ParoleRiskTool,
} from "~datatypes";
import { palette } from "~design-system";

import { statusStyles } from "../../../BadgePill/BadgePill";
import {
  getRiskLevelForAssessment,
  latestAssessmentsByTool,
} from "../RiskAssessmentSection.utils";
import {
  FactRow,
  FactRowStack,
  FactValue,
  formatDate,
  MutedText,
  SectionStack,
  SubsectionTitle,
} from "../shared";
import { SubcategoryBreakdownChart } from "../SubcategoryBreakdownChart";

const MENTAL_HEALTH_FACTOR = "Mental Health";
const NOT_REPORTED = "None reported";
const CARD_CHART_HEIGHT = 240;

const CardRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};
`;

const AssessmentCard = styled.div`
  flex: 0 1 ${rem(320)};
  display: flex;
  flex-direction: column;
  background: ${palette.marble1};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  padding: ${rem(spacing.lg)};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${rem(spacing.sm)};
`;

const ToolName = styled.div`
  ${typography.Sans18}
  color: ${palette.pine1};
`;

const RiskLabel = styled.div<{ $color: string }>`
  ${typography.Sans14}
  color: ${({ $color }) => $color};
`;

const RiskLevelName = styled.span`
  text-transform: uppercase;
`;

const AssessedOn = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin-bottom: ${rem(spacing.md)};
`;

const ChartCaption = styled.div`
  ${typography.Sans14}
  color: ${palette.slate60};
`;

/** Returns the resident's mental health level of care, or undefined. */
function mentalHealthLevelOfCare(
  riskAndNeedsFactors: Array<ParoleRiskNeedFactor>,
): string | undefined {
  const factor = riskAndNeedsFactors.find(
    (f) => f.factor === MENTAL_HEALTH_FACTOR,
  );
  return factor && [factor.score, factor.scale].filter(Boolean).join(" — ");
}

/**
 * One tool's latest assessment, as a compact card with its subcategory
 * breakdown charted beneath.
 *
 * @param assessment - The assessment to show.
 */
function AssessmentSummaryCard({
  assessment,
}: {
  assessment: ParoleRiskAssessment;
}) {
  const risk = getRiskLevelForAssessment(assessment);

  return (
    <AssessmentCard>
      <CardHeader>
        <ToolName>{assessment.tool}</ToolName>
        {risk && (
          <RiskLabel $color={statusStyles[risk.palette].color}>
            <RiskLevelName>{risk.label}</RiskLevelName> Risk
          </RiskLabel>
        )}
      </CardHeader>
      <AssessedOn>Assessed {formatDate(assessment.date)}</AssessedOn>
      {assessment.subcategories && (
        <>
          <ChartCaption>Subcategory breakdown</ChartCaption>
          <SubcategoryBreakdownChart
            assessment={assessment}
            showCarasComponentList={false}
            title=""
            height={CARD_CHART_HEIGHT}
          />
        </>
      )}
    </AssessmentCard>
  );
}

/**
 * US_ID's Health and Assessments subsection: the mental health level of care,
 * then one compact card per assessment tool the tenant tracks.
 *
 * @param riskAssessments - Every assessment on the resident, across tools.
 * @param riskAndNeedsFactors - The resident's latest health classifications.
 * @param tools - Tools this tenant tracks, in display order.
 */
export function UsIdHealthAndAssessmentsSection({
  riskAssessments,
  riskAndNeedsFactors,
  tools,
}: {
  riskAssessments: Array<ParoleRiskAssessment>;
  riskAndNeedsFactors: Array<ParoleRiskNeedFactor>;
  tools: Array<ParoleRiskTool>;
}) {
  const latestByTool = new Map(
    latestAssessmentsByTool(riskAssessments).map((a) => [a.tool, a]),
  );
  const onFileAssessments = tools
    .map((tool) => latestByTool.get(tool))
    .filter((a): a is ParoleRiskAssessment => a !== undefined);

  return (
    <div>
      <SubsectionTitle>Health and Assessments</SubsectionTitle>

      <SectionStack>
        <FactRow>
          <FactRowStack>
            <MutedText>Mental health level of care</MutedText>
            <FactValue>
              {mentalHealthLevelOfCare(riskAndNeedsFactors) ?? NOT_REPORTED}
            </FactValue>
          </FactRowStack>
        </FactRow>

        <CardRow>
          {onFileAssessments.map((assessment) => (
            <AssessmentSummaryCard
              key={assessment.tool}
              assessment={assessment}
            />
          ))}
        </CardRow>
      </SectionStack>
    </div>
  );
}
