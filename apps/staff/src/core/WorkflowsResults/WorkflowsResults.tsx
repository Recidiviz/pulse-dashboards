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

import { Sans18, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import useIsMobile from "../../hooks/useIsMobile";

const WorkflowsResultsWrapper = styled.div<{
  centered?: boolean;
  largeMargin?: boolean;
  verticallyCentered?: boolean;
}>`
  margin-top: ${({ largeMargin }) => (largeMargin ? rem(108) : 0)} !important;

  ${({ verticallyCentered }) =>
    verticallyCentered &&
    `height: 70vh;
      display: grid;
      align-content: center;`}

  ${({ centered }) =>
    centered
      ? `margin: 0 auto;
          max-width: 40rem;
          text-align: center;`
      : `margin: 0;`}
`;

const HeaderText = styled.div<{
  centered?: boolean;
  largeMargin?: boolean;
  isMobile: boolean;
}>`
  ${({ isMobile }) => (isMobile ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
  margin-bottom: ${({ largeMargin }) => (largeMargin ? 3 : 1)}rem;

  ${({ centered, isMobile }) =>
    centered ? `text-align: center;` : `margin-right: ${isMobile ? 0 : 20}%;`}
`;

export const CallToActionText = styled(Sans18)`
  color: ${palette.slate70};
  text-wrap: balance;
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
  const { isMobile } = useIsMobile(true);

  return (
    <WorkflowsResultsWrapper
      verticallyCentered={!!callToActionText && isMobile}
      largeMargin={!!callToActionText && !isMobile}
      centered={!!callToActionText}
      className="WorkflowsHomepageText"
    >
      {headerText && (
        <HeaderText
          isMobile={isMobile}
          centered={!!callToActionText}
          largeMargin={!callToActionText}
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
