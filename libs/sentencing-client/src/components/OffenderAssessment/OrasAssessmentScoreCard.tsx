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

import { observer } from "mobx-react-lite";
import moment from "moment";
import React from "react";

import { Banner } from "../shared/styles/Banner";
import { useStore } from "../StoreProvider/StoreProvider";
import {
  AssessmentTypeKey,
  getAssessmentTypeDisplayName,
  OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE,
} from "./assessmentTypeUtils";
import { ORASTitle } from "./FormComponents.styles";
import * as Styled from "./OrasAssessmentScoreCard.styles";
import { OrasScoreDonut } from "./OrasScoreDonut";

interface ORASHeaderProps {
  ORASLastUpdatedAt: Date | null;
  hasORASData: boolean;
  children: React.ReactNode;
  onOpenForm: () => void;
}
interface OrasAssessmentScoreCardProps {
  assessmentScore: number | null;
  assessmentType: AssessmentTypeKey | null;
  assessmentDate: Date | string | null;
  assessmentAdministeredBy: string | null;
  ORASLastUpdatedAt: Date | null;
  hasORASData: boolean;
  onOpenForm: () => void;
}

const ORASCardWrapper = observer(function ORASCardWrapper({
  ORASLastUpdatedAt,
  hasORASData,
  children,
  onOpenForm,
}: ORASHeaderProps) {
  const { activeFeatureVariants } = useStore();
  return (
    <Styled.Card>
      <Styled.CardTitle>
        <ORASTitle>ORAS Assessment Score</ORASTitle>
        <Styled.ORASUpdatedText>
          Last Updated:{" "}
          {ORASLastUpdatedAt
            ? moment.utc(ORASLastUpdatedAt).format("l")
            : "Unknown"}
        </Styled.ORASUpdatedText>
      </Styled.CardTitle>
      <Banner>ORAS data regularly updated on Monday evenings.</Banner>
      {children}
      {activeFeatureVariants["SARManualORAS"] && (
        <Styled.ORASFormButton onClick={onOpenForm}>
          {hasORASData ? "Edit ORAS Data" : "Add ORAS Data"}
        </Styled.ORASFormButton>
      )}
    </Styled.Card>
  );
});

export const OrasAssessmentScoreCard: React.FC<
  OrasAssessmentScoreCardProps
> = ({
  assessmentScore,
  assessmentType,
  assessmentDate,
  assessmentAdministeredBy,
  ORASLastUpdatedAt,
  hasORASData,
  onOpenForm,
}) => {
  const maxScore =
    assessmentType !== null
      ? OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE[assessmentType] ?? undefined
      : undefined;

  if (!assessmentDate) {
    return (
      <ORASCardWrapper
        ORASLastUpdatedAt={ORASLastUpdatedAt}
        hasORASData={hasORASData}
        onOpenForm={onOpenForm}
      >
        <Styled.EmptyState>No ORAS assessment on file.</Styled.EmptyState>
      </ORASCardWrapper>
    );
  }

  return (
    <ORASCardWrapper
      ORASLastUpdatedAt={ORASLastUpdatedAt}
      hasORASData={hasORASData}
      onOpenForm={onOpenForm}
    >
      <Styled.CardContent>
        <OrasScoreDonut score={assessmentScore} maxScore={maxScore} />
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
              {assessmentAdministeredBy ?? "N/A"}
            </Styled.MetadataValue>
          </Styled.MetadataItem>
        </Styled.MetadataSection>
      </Styled.CardContent>
    </ORASCardWrapper>
  );
};
