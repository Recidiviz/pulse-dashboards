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

import { format } from "date-fns";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { UsMoClientMetadata } from "~datatypes";
import { palette, typography } from "~design-system";
import {
  getAssessmentTypeDisplayName,
  OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE,
} from "~sentencing-client/components/OffenderAssessment/assessmentTypeUtils";
import { OrasScoreDonut } from "~sentencing-client/components/OffenderAssessment/OrasScoreDonut";

import { LabelValue } from "../shared/LabelValue";
import { mapMoAssessmentType } from "./mapMoAssessmentType";

// --- ORAS Assessment section ----------------------------------------------

const OrasSection = styled.section`
  display: flex;
  flex-direction: column;
  padding: ${rem(16)} ${rem(20)};
`;

const OrasHeader = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${rem(16)};
  justify-content: space-between;
  margin-bottom: ${rem(16)};
`;

const OrasTitle = styled.div`
  ${typography.Sans16}
  color: ${palette.slate85};
`;

const OrasSubtitle = styled.div`
  ${typography.Sans12}
  color: ${palette.slate60};
  white-space: nowrap;
`;

const OrasBody = styled.div`
  align-items: center;
  display: flex;
  gap: ${rem(24)};
  justify-content: center;
`;

const DonutColumn = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
`;

const MetadataColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(16)};
  min-width: 0;
`;

/** Empty state shown inside the ORAS section (when no assessment is on file). */
const OrasEmptyState = styled.div`
  ${typography.Sans14}
  color: ${palette.slate60};
  padding: ${rem(8)} 0 ${rem(16)};
  text-align: center;
`;

type OrasAssessmentCardProps = {
  orasAssessment: UsMoClientMetadata["orasAssessment"];
  // Date the ORAS data was last synced from the source agency. Optional/nullish
  // — the header omits the "Last Updated" line when it's absent.
  lastUpdated?: Date | null;
};

/**
 * "ORAS Assessment" section for the US_MO Case Planning module. Mirrors the SAR
 * Builder's `OrasAssessmentScoreCard` chrome (donut + metadata column) but with
 * MO-specific framing: an empty state when no assessment is on file and an
 * optional "Last Updated" header date. Rendered as a `<section>` inside the
 * module's single `CardFrame`, not as a standalone bordered card.
 *
 * The donut intentionally uses the raw score / max score (consistent with the
 * SAR Builder requirement) rather than any bucketed/normalized value.
 */
export const OrasAssessmentCard: React.FC<OrasAssessmentCardProps> = ({
  orasAssessment,
  lastUpdated,
}) => {
  const header = (
    <OrasHeader>
      <OrasTitle>ORAS Assessment</OrasTitle>
      {lastUpdated && (
        <OrasSubtitle>
          Last Updated {format(lastUpdated, "M/d/yyyy")}
        </OrasSubtitle>
      )}
    </OrasHeader>
  );

  if (!orasAssessment || !orasAssessment.assessmentDate) {
    return (
      <OrasSection>
        {header}
        <OrasEmptyState>No ORAS assessment on file.</OrasEmptyState>
      </OrasSection>
    );
  }

  const {
    assessmentType,
    assessmentScore,
    assessmentDate,
    assessmentAdministeredBy,
  } = orasAssessment;
  const mapped = mapMoAssessmentType(assessmentType);
  const maxScore = mapped
    ? OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE[mapped] ?? undefined
    : undefined;

  return (
    <OrasSection>
      {header}
      <OrasBody>
        <DonutColumn>
          {/*
           * Reuses the SAR Builder's donut, showing the raw assessment score
           * relative to the tool's max (e.g. 23/49 for ORAS-CST) — the value
           * relative to the assessment, not a fixed "X/9" scale.
           */}
          <OrasScoreDonut score={assessmentScore ?? 0} maxScore={maxScore} />
        </DonutColumn>
        <MetadataColumn>
          <LabelValue label="Assessment type">
            {getAssessmentTypeDisplayName(mapped)}
          </LabelValue>
          <LabelValue label="Assessment date">
            {format(assessmentDate, "MM/dd/yyyy")}
          </LabelValue>
          <LabelValue label="Administered by">
            {assessmentAdministeredBy ?? "N/A"}
          </LabelValue>
        </MetadataColumn>
      </OrasBody>
    </OrasSection>
  );
};
