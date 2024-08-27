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

import { palette, Pill, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import ClientEventsTableImage from "../../assets/static/images/ClientEventsTableImage.png";
import DotPlotAgentImage from "../../assets/static/images/DotPlot-Agent.png";
import DotPlotOfficerImage from "../../assets/static/images/DotPlot-Officer.png";
import LineChartAgentImage from "../../assets/static/images/LineChart-Agent.png";
import LineChartOfficerImage from "../../assets/static/images/LineChart-Officer.png";
import OfficerEventsTableImage from "../../assets/static/images/OfficerEventsTableImage.png";
import WorkflowsUsIdImage from "../../assets/static/images/Workflows-US_ID.png";
import useIsMobile from "../../hooks/useIsMobile";
import { ConfigLabels } from "../../InsightsStore/presenters/types";
import { US_ID } from "../../RootStore/TenantStore/pathwaysTenants";
import { TenantId } from "../../RootStore/types";
import { toTitleCase } from "../../utils";
import { createLabelString } from "./utils";

const Wrapper = styled.div`
  margin-top: ${rem(spacing.md * 5)};
`;

const Feature = styled.div`
  display: grid;
  justify-items: center;
  margin-bottom: ${rem(spacing.md * 10)};
`;

const Header = styled.div`
  max-width: ${rem(555)};
`;

const Title = styled.h2`
  display: flex;
  align-items: center;
  ${typography.Sans24}
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.lg)};
`;

const StyledPill = styled(Pill)`
  width: ${rem(spacing.xl)};
  margin-right: ${rem(spacing.md)};
`;

const StyledMarkdownView = styled(MarkdownView)`
  p {
    ${typography.Sans18};
    color: ${palette.slate85};
    line-height: ${rem(spacing.xl)};
    margin-left: ${rem(spacing.xxl)};
    margin-bottom: ${rem(spacing.xxl)};
  }

  strong {
    font-weight: normal;
    color: ${palette.pine2};
  }
`;

const ImageCard = styled.div<{ isTablet: boolean }>`
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  padding: ${({ isTablet }) =>
    isTablet
      ? `${rem(spacing.lg)}`
      : `${rem(spacing.xl)} ${rem(spacing.md * 5)}`};
  padding-bottom: 0;
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(spacing.lg)};

  img {
    width: 100%;
  }
`;

const ImageTitle = styled.div`
  ${typography.Sans18}
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.md)};

  span {
    color: ${palette.slate70};
  }
`;

function getWorkflowsOnboardingFeature(
  tenantId: TenantId | undefined,
  isWorkflowsHomepageEnabled: boolean,
) {
  if (!isWorkflowsHomepageEnabled) return;
  switch (tenantId) {
    case US_ID:
      return {
        title: "Track officer progress toward granting opportunities",
        description:
          "For each opportunity, including early discharge and LSU, see the **number of clients eligible for each officer**.",
        imageTitle: "Clients Eligible Per Opportunity",
        image: WorkflowsUsIdImage,
      };
    default:
      return;
  }
}

const OnboardingFeatures: React.FC<{
  labels: ConfigLabels;
  eventLabels: string[];
  tenantId: TenantId | undefined;
  isWorkflowsHomepageEnabled: boolean;
  isInsightsLanternState: boolean;
}> = ({
  labels,
  eventLabels,
  tenantId,
  isWorkflowsHomepageEnabled,
  isInsightsLanternState,
}) => {
  const { isTablet } = useIsMobile(true);
  const { supervisionOfficerLabel, supervisionJiiLabel } = labels;
  const isAgentState = supervisionOfficerLabel === "agent";

  const workflowsOnboardingFeature = getWorkflowsOnboardingFeature(
    tenantId,
    isWorkflowsHomepageEnabled,
  );
  const clientEventsFeature = {
    title: `Track events for each ${supervisionJiiLabel}`,
    description: `Understand the full story by seeing the full list of events that lead to each ${supervisionJiiLabel} outcome.`,
    imageTitle: "History of Events",
    image: ClientEventsTableImage,
  };
  const officerEventsFeature = {
    title: `Track events for each ${supervisionOfficerLabel}`,
    description: `Understand the full story by seeing the full list of ${supervisionJiiLabel}s included in the metric.`,
    imageTitle: "History of Events",
    image: OfficerEventsTableImage,
  };

  const onboardingFeatures = [
    ...(workflowsOnboardingFeature ? [workflowsOnboardingFeature] : []),
    {
      title: "See which officers have outlying rates",
      description: `See whose ${createLabelString(eventLabels, "and/or")} rates are **significantly higher than the statewide rate**.`,
      imageTitle: `Incarcerations Rate of all ${toTitleCase(
        supervisionOfficerLabel,
      )}s`,
      image: isAgentState ? DotPlotAgentImage : DotPlotOfficerImage,
    },
    {
      title: "Discover trends over time",
      description: `For each staff member, get a better understanding of how caseload-level outcome metrics have changed over time.`,
      imageTitle: `Historical Incarceration Rate`,
      image: isAgentState ? LineChartAgentImage : LineChartOfficerImage,
    },
    isInsightsLanternState ? clientEventsFeature : officerEventsFeature,
  ];

  return (
    <Wrapper>
      {onboardingFeatures.map((feature, index) => (
        <Feature key={feature.title}>
          <Header>
            <Title>
              <StyledPill filled color={palette.pine3}>
                {index + 1}
              </StyledPill>
              {feature.title}
            </Title>
            <StyledMarkdownView markdown={feature.description} />
          </Header>
          <ImageCard isTablet={isTablet}>
            <ImageTitle>
              {feature.imageTitle} <span>(sample data not real)</span>
            </ImageTitle>

            <img src={feature.image} alt={feature.title} />
          </ImageCard>
        </Feature>
      ))}
    </Wrapper>
  );
};

export default OnboardingFeatures;
