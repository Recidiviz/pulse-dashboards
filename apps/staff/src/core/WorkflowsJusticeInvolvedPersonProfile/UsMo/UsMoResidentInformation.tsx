// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import React from "react";
import styled from "styled-components/macro";

import UsMoAssessmentScores from "../OpportunityDetailSidebarComponents/US_MO/UsMoAssessmentScores";
import UsMoGangInvolvement from "../OpportunityDetailSidebarComponents/US_MO/UsMoGangInvolvement";
import UsMoProgramParticipation from "../OpportunityDetailSidebarComponents/US_MO/UsMoProgramParticipation";
import UsMoResidentDates from "../OpportunityDetailSidebarComponents/US_MO/UsMoResidentDates";
import UsMoSentences from "../OpportunityDetailSidebarComponents/US_MO/UsMoSentences";
import { UsMoSanctions } from "../ResidentDetailSidebarComponents/US_MO/UsMoSanctions";
import { UsMoSolitary } from "../ResidentDetailSidebarComponents/US_MO/UsMoSolitary";
import { Divider } from "../styles";
import { ResidentProfileProps } from "../types";

const Wrapper = styled.div`
  hr + hr {
    display: none; // Suppress extra dividers when sections are conditionally hidden
  }
`;

export function UsMoResidentInformation({
  resident,
}: ResidentProfileProps): React.ReactElement | null {
  const { metadata } = resident;

  if (metadata.stateCode !== "US_MO") {
    return null;
  }

  return (
    <Wrapper>
      <Divider />
      <UsMoResidentDates resident={resident} />
      <Divider />
      <UsMoAssessmentScores resident={resident} />
      <Divider />
      <UsMoSentences resident={resident} />
      <Divider />
      <UsMoGangInvolvement resident={resident} />
      <Divider />
      <UsMoSolitary resident={resident} />
      <Divider />
      <UsMoProgramParticipation resident={resident} />
      <Divider />
      <UsMoSanctions sanctions={metadata.d1SanctionInfoPastYear} />
    </Wrapper>
  );
}
