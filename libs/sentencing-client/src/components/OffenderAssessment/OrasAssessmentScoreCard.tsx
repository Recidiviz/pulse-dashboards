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

import moment from "moment";
import React from "react";

import { Banner } from "../shared/styles/Banner";
import {
  AssessmentTypeKey,
  getAssessmentTypeDisplayName,
  OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE,
} from "./assessmentTypeUtils";
import * as Styled from "./OrasAssessmentScoreCard.styles";
import { OrasScoreDonut } from "./OrasScoreDonut";

interface ORASHeaderProps {
  ORASLastUpdatedAt: Date | null;
  children: React.ReactNode;
}

interface OrasAssessmentScoreCardProps {
  score: number;
  assessmentType: AssessmentTypeKey | null;
  assessmentDate: Date | string | null;
  administeredBy: string | null;
  ORASLastUpdatedAt: Date | null;
}

const ORASCardWrapper: React.FC<ORASHeaderProps> = ({
  ORASLastUpdatedAt,
  children,
}) => {
  return (
    <Styled.Card>
      <Styled.CardTitle>
        <Styled.ORASTitle>ORAS Assessment Score</Styled.ORASTitle>
        <Styled.ORASUpdatedText>
          Last Updated: {moment.utc(ORASLastUpdatedAt).format("l")}
        </Styled.ORASUpdatedText>
      </Styled.CardTitle>
      <Banner>ORAS data regularly updated on Monday evenings.</Banner>
      {children}
    </Styled.Card>
  );
};

export const OrasAssessmentScoreCard: React.FC<
  OrasAssessmentScoreCardProps
> = ({
  score,
  assessmentType,
  assessmentDate,
  administeredBy,
  ORASLastUpdatedAt,
}) => {
  const maxScore =
    assessmentType !== null
      ? OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE[assessmentType] ?? undefined
      : undefined;

  if (!assessmentDate) {
    return (
      <ORASCardWrapper ORASLastUpdatedAt={ORASLastUpdatedAt}>
        <Styled.EmptyState>No ORAS assessment on file.</Styled.EmptyState>
      </ORASCardWrapper>
    );
  }

  return (
    <ORASCardWrapper ORASLastUpdatedAt={ORASLastUpdatedAt}>
      <Styled.CardContent>
        <OrasScoreDonut score={score} maxScore={maxScore} />
        <Styled.MetadataSection>
          <Styled.MetadataItem>
            <Styled.MetadataLabel>Assessment type</Styled.MetadataLabel>
            <Styled.MetadataValue>
              {getAssessmentTypeDisplayName(assessmentType)}
            </Styled.MetadataValue>
          </Styled.MetadataItem>
          <Styled.MetadataItem>
            <Styled.MetadataLabel>Assessment date</Styled.MetadataLabel>
            <Styled.MetadataValue>
              {moment(assessmentDate).utc().format("l")}
            </Styled.MetadataValue>
          </Styled.MetadataItem>
          <Styled.MetadataItem>
            <Styled.MetadataLabel>Administered by</Styled.MetadataLabel>
            <Styled.MetadataValue>
              {administeredBy ?? "N/A"}
            </Styled.MetadataValue>
          </Styled.MetadataItem>
        </Styled.MetadataSection>
      </Styled.CardContent>
    </ORASCardWrapper>
  );
};
