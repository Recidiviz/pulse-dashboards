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

import { ParoleRiskNeedFactor } from "~datatypes";
import { palette } from "~design-system";

import { PaletteKey, WorkflowsBadgePill } from "../../BadgePill/BadgePill";
import { SectionCardHeader } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import { EmptyState, SectionCard } from "./shared";

// Scale is free text, not a fixed enum, so this colors by substring
// (checked most-severe-first) rather than exact match.
// TODO(XXXX): revisit once product has weighed in on how a compound scale
// label should display.
const SCALE_COLOR_BY_SUBSTRING: ReadonlyArray<[string, PaletteKey]> = [
  ["high", "RED"],
  ["moderate", "ORANGE"],
  ["low", "GREEN"],
];

function paletteForScale(scale: string): PaletteKey {
  const lowerScale = scale.toLowerCase();
  const match = SCALE_COLOR_BY_SUBSTRING.find(([substring]) =>
    lowerScale.includes(substring),
  );
  return match ? match[1] : "SLATE";
}

const RiskNeedTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    ${typography.Sans12}
    text-transform: uppercase;
    color: ${palette.slate70};
    text-align: left;
    font-weight: 600;
    padding-bottom: ${rem(spacing.sm)};
  }

  td {
    ${typography.Sans14}
    padding: ${rem(spacing.sm)} 0;
    border-top: 1px solid ${palette.slate10};
  }

  tbody tr:last-child td {
    padding-bottom: 0;
  }
`;

export function RiskAndNeedsAssessmentSection({
  riskAndNeedsFactors,
}: {
  riskAndNeedsFactors: Array<ParoleRiskNeedFactor>;
}) {
  if (riskAndNeedsFactors.length === 0) {
    return (
      <SectionCard>
        <SectionCardHeader>Latest Risk and Needs Assessment</SectionCardHeader>
        <PaddedSectionCardBody>
          <EmptyState>
            No risk and needs assessment available for this resident.
          </EmptyState>
        </PaddedSectionCardBody>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <SectionCardHeader>Latest Risk and Needs Assessment</SectionCardHeader>
      <PaddedSectionCardBody>
        <RiskNeedTable>
          <thead>
            <tr>
              <th>Factor</th>
              <th>Score</th>
              <th>Scale</th>
            </tr>
          </thead>
          <tbody>
            {riskAndNeedsFactors.map((row) => (
              <tr key={row.factor}>
                <td>{row.factor}</td>
                <td>{row.score}</td>
                <td>
                  <WorkflowsBadgePill
                    text={row.scale}
                    palette={paletteForScale(row.scale)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </RiskNeedTable>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
