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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import GreenCheckmark from "../../assets/static/images/greenCheckmark.svg?react";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { OutlierOfficerData } from "../../InsightsStore/presenters/types";
import { toTitleCase } from "../../utils";
import InsightsInfoModal from "../InsightsInfoModal";
import { InsightsSwarmPlot } from "../InsightsSwarmPlot";
import { formatTargetAndHighlight } from "../InsightsSwarmPlot/utils";
import { insightsUrl } from "../views";

const CardWrapper = styled.div<{
  noFlex: boolean;
  isSticky?: boolean;
}>`
  border: 1px solid ${palette.slate30};
  display: ${({ noFlex }) => (noFlex ? "block" : "flex")};
  color: ${palette.slate85};
  border-radius: 4px;

  ${({ isSticky }) => isSticky && `position: sticky; top: 5rem;`}
`;

const CardHeader = styled.div<{
  hasBorder: boolean;
}>`
  flex-basis: 24%;
  padding: 0;
  border-right: ${({ hasBorder }) =>
    hasBorder ? `1px solid ${palette.slate30}` : "none"};
  min-width: ${rem(264)};
`;

const CardHeaderItem = styled.div`
  padding: ${rem(spacing.md)};
  min-width: ${rem(200)};

  &:not(:last-child) {
    border-bottom: 1px solid ${palette.slate30};
  }
`;

const CardTitle = styled(Link)`
  display: inline-block;
  font-size: 16px;
  color: ${palette.pine1} !important;
  font-weight: 600;
  border-bottom: 1px solid transparent;
  margin-bottom: ${rem(10)};

  &:hover {
    border-bottom: 1px solid ${palette.pine1};
  }
`;

const CardSubtitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  ${typography.Sans14}
  color: ${palette.pine1};
  margin-top: ${rem(spacing.xs)};
  gap: ${rem(spacing.sm)};

  span {
    color: ${palette.signal.error};
    font-weight: 700;
  }
`;

const CardContent = styled.div`
  padding-top: ${rem(spacing.md)};
`;

const CardBody = styled.div`
  width: 100%;
`;

const PlotSection = styled.div`
  padding: ${rem(spacing.md)};
  display: block;

  & + div {
    border-top: 1px solid ${palette.slate30};
    width: 100%;
  }
`;

const PlotHeader = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${rem(spacing.xs)};
`;

const PlotTitle = styled.div`
  ${typography.Sans16}
  color: ${palette.pine1};
  display: flex;
  gap: ${rem(spacing.xs)};
`;

const PlotHint = styled.div``;

const EmptyWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  margin: 0 auto;
  padding: 40px 16px;
  color: ${palette.slate85};
`;

export const EmptyCard = ({ message }: { message: string }) => {
  return (
    <CardWrapper noFlex={false}>
      <EmptyWrapper>
        <GreenCheckmark width={16} />
        {message}
      </EmptyWrapper>
    </CardWrapper>
  );
};

type InsightsStaffCardType = {
  outlierOfficersByMetric: {
    metricId: string;
    officersForMetric: OutlierOfficerData[];
  }[];
  officers: OutlierOfficerData[] | undefined;
  title?: string;
};

const InsightsStaffCardV2: React.FC<InsightsStaffCardType> = ({
  outlierOfficersByMetric,
  officers,
  title,
}) => {
  const { isTablet } = useIsMobile(true);

  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore) return null;

  const { metricConfigsById, methodologyUrl } = supervisionStore;

  if (!officers || officers.length === 0) {
    return <EmptyCard message="No officer outcomes to review this month." />;
  }

  return (
    <CardWrapper noFlex={isTablet}>
      {!isTablet && (
        <CardHeader hasBorder={!isTablet}>
          {officers.map((officer) => (
            <CardHeaderItem key={officer.externalId}>
              <CardTitle
                to={insightsUrl("supervisionStaff", {
                  officerPseudoId: officer.pseudonymizedId,
                })}
              >
                {title || officer.displayName}
              </CardTitle>
              {officer.outlierMetrics.map((metric) => (
                <CardSubtitle key={metric.metricId}>
                  {metric.config.titleDisplayName}
                  <span>
                    {formatTargetAndHighlight(
                      metric.currentPeriodData.metricRate,
                    )}
                  </span>
                </CardSubtitle>
              ))}
            </CardHeaderItem>
          ))}
        </CardHeader>
      )}

      <CardBody>
        {outlierOfficersByMetric.map(({ metricId, officersForMetric }) => {
          const generalMetricConfig = metricConfigsById?.get(metricId);

          if (!generalMetricConfig) return null;

          /* TODO (#5325): Add new swarm presenter, container, and data-preparer */
          const swarmPlotMetric = officersForMetric[0].outlierMetrics.find(
            (m) => m.metricId === metricId,
          );

          if (!swarmPlotMetric) return null;

          return (
            <React.Fragment key={metricId}>
              {isTablet &&
                officersForMetric.map((officer) => {
                  const currentMetric = officer.outlierMetrics.find(
                    (officerMetric) => officerMetric.metricId === metricId,
                  );

                  if (!currentMetric) return null;

                  return (
                    <CardHeaderItem key={officer.externalId}>
                      <CardTitle
                        to={insightsUrl("supervisionStaffMetric", {
                          officerPseudoId: officer.pseudonymizedId,
                          metricId: currentMetric.metricId,
                        })}
                      >
                        {title || officer.displayName}
                      </CardTitle>

                      <CardSubtitle key={currentMetric.metricId}>
                        {currentMetric.config.titleDisplayName}
                        <span>
                          {formatTargetAndHighlight(
                            currentMetric.currentPeriodData.metricRate,
                          )}
                        </span>
                      </CardSubtitle>
                    </CardHeaderItem>
                  );
                })}

              <PlotSection key={metricId}>
                <PlotHeader>
                  <PlotTitle>
                    {toTitleCase(generalMetricConfig.eventName)}
                  </PlotTitle>
                  <PlotHint>
                    {/* TODO (#5489): "Learn more" should be a panel instead of a modal  */}
                    <InsightsInfoModal
                      title={toTitleCase(generalMetricConfig.eventName)}
                      copy={generalMetricConfig.descriptionMarkdown}
                      methodologyLink={methodologyUrl}
                      buttonText="Learn More"
                    />
                  </PlotHint>
                </PlotHeader>
                <CardContent>
                  {/* TODO (#5325): Add new swarm presenter, container, and data-preparer */}
                  <InsightsSwarmPlot metric={swarmPlotMetric} />
                </CardContent>
              </PlotSection>
            </React.Fragment>
          );
        })}
      </CardBody>
    </CardWrapper>
  );
};

export default InsightsStaffCardV2;
