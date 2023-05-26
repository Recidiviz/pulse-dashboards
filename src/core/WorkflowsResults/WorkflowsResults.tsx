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

import { useRootStore } from "../../components/StoreProvider";

const WorkflowsResultsWrapper = styled.div<{
  centered?: boolean;
}>`
  ${({ centered }) =>
    centered
      ? `margin: 0 20%;
          text-align: center;`
      : `margin: 0;`}
`;

const HeaderText = styled(Serif34)<{
  centered?: boolean;
  largeMargin?: boolean;
}>`
  color: ${palette.pine2};
  margin-bottom: ${({ largeMargin }) => (largeMargin ? 3 : 1)}rem;

  ${({ centered }) =>
    centered ? `text-align: center;` : `  margin-right: 20%;`}
`;

const CallToActionText = styled(Sans18)`
  color: ${palette.slate70};
`;

type WorkflowsResultsProps = {
  headerText?: string;
  callToActionText?: string;
  children?: React.ReactNode;
};

function WorkflowsResults({
  headerText,
  callToActionText,
  children,
}: WorkflowsResultsProps): React.ReactElement | null {
  const {
    workflowsStore: { featureVariants },
  } = useRootStore();

  return (
    <WorkflowsResultsWrapper
      centered={!featureVariants.responsiveRevamp}
      className="WorkflowsHomepageText"
    >
      {headerText && (
        <HeaderText
          centered={!featureVariants.responsiveRevamp}
          largeMargin={!callToActionText && !!featureVariants.responsiveRevamp}
        >
          {headerText}
        </HeaderText>
      )}
      {callToActionText && (
        <CallToActionText>{callToActionText}</CallToActionText>
      )}
      {children}
    </WorkflowsResultsWrapper>
  );
}

export default WorkflowsResults;
