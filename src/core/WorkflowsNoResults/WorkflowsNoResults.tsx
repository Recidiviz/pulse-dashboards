// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { palette, Sans18, Serif34 } from "@recidiviz/design-system";
import React from "react";
import styled from "styled-components/macro";

const WorkflowsNoResultsWrapper = styled.div`
  margin: 0 20%;
  text-align: center;
`;

const HeaderText = styled(Serif34)`
  color: ${palette.pine2};
  text-align: center;
  margin-bottom: 1rem;
`;

const CallToActionText = styled(Sans18)`
  color: ${palette.slate70};
`;

type WorkflowsNoResultsProps = {
  headerText?: string;
  callToActionText: string;
};

function WorkflowsNoResults({
  headerText,
  callToActionText,
}: WorkflowsNoResultsProps): React.ReactElement | null {
  return (
    <WorkflowsNoResultsWrapper className="WorkflowsHomepageText">
      {headerText && <HeaderText>{headerText}</HeaderText>}
      <CallToActionText>{callToActionText}</CallToActionText>
    </WorkflowsNoResultsWrapper>
  );
}

export default WorkflowsNoResults;
