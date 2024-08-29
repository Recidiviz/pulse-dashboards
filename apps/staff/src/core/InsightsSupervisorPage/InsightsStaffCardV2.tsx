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
import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import GreenCheckmark from "../../assets/static/images/greenCheckmark.svg?react";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficer } from "../../InsightsStore/models/SupervisionOfficer";
import {
  ByMetricAndCategory2DMap,
  MetricAndOutliersInfo,
  OutlierOfficerData,
} from "../../InsightsStore/presenters/types";
import { toTitleCase } from "../../utils";
import InsightsInfoModalV2 from "../InsightsInfoModal/InsightsInfoModalV2";
import { InsightsSwarmPlotContainerV2 } from "../InsightsSwarmPlot";
import { formatTargetAndHighlight } from "../InsightsSwarmPlot/utils";
import { insightsUrl } from "../views";

const CardWrapper = styled.div<{
  noFlex: boolean;
  isSticky?: boolean;
  height?: number;
}>`
  border: 1px solid ${palette.slate30};
  display: ${({ noFlex }) => (noFlex ? "block" : "flex")};
  color: ${palette.slate85};
  border-radius: 4px;

  ${({ isSticky }) => isSticky && `position: sticky; top: 5rem;`}
  ${({ height }) => height && `height: ${height}px;`}
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

const CardTitle = styled.h1`
  display: inline-block;
  font-size: 16px;
  ${typography.Sans16};
  color: ${palette.pine1} !important;
  font-weight: 600;
  border-bottom: 1px solid transparent;
  margin-bottom: ${rem(10)};
`;

const CardHeaderItem = styled(Link)<{ hovered?: boolean }>`
  display: block;
  padding: ${rem(spacing.md)};
  min-width: ${rem(200)};
  border-bottom: 1px solid ${palette.slate30};
  ${({ hovered }) =>
    hovered &&
    `background-color: ${palette.slate10};
  
  ${CardTitle} {
      border-bottom: 1px solid ${palette.pine1};
    }`}

  &:hover {
    background-color: ${palette.slate10};

    ${CardTitle} {
      border-bottom: 1px solid ${palette.pine1};
    }
  }
`;

const CardSubtitle = styled.h2`
  display: flex;
  justify-content: space-between;
  align-items: end;
  ${typography.Sans14}
  color: ${palette.pine1};
  margin-top: ${rem(spacing.xs)};
  margin-bottom: 0;
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
  border-bottom: 1px solid ${palette.slate30};

  & + div {
    width: 100%;
  }
`;

const PlotHeader = styled.div`
  display: flex;
  justify-content: start;
  flex-wrap: wrap;
  gap: ${rem(spacing.xs)};
`;

const PlotTitle = styled.div`
  ${typography.Sans16}
  color: ${palette.pine1};
  display: flex;
`;

const PlotSubtitle = styled.div`
  ${typography.Sans14}
  color: ${palette.slate85};
  padding: ${rem(spacing.xs)} 0;
`;

const PlotHint = styled.div`
  button {
    color: ${palette.slate85};
    text-decoration: none !important;
  }
`;

const EmptyWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  margin: 0 auto;
  padding: 40px 16px;
  color: ${palette.slate85};
`;

export const EmptyCard = ({
  message,
  height,
}: {
  message: string;
  height?: number;
}) => {
  return (
    <CardWrapper noFlex={false} height={height}>
      <EmptyWrapper>
        <GreenCheckmark width={16} />
        {message}
      </EmptyWrapper>
    </CardWrapper>
  );
};

type InsightsStaffCardType = {
  outlierOfficersByMetricAndCaseloadCategory:
    | ByMetricAndCategory2DMap<MetricAndOutliersInfo>
    | undefined;
  officers: OutlierOfficerData<SupervisionOfficer>[] | undefined;
  emptyMessage: string;
  title?: string;
};

const InsightsStaffCardV2: React.FC<InsightsStaffCardType> = ({
  outlierOfficersByMetricAndCaseloadCategory,
  officers,
  title,
  emptyMessage,
}) => {
  const { isTablet } = useIsMobile(true);

  const [hoveredOfficer, setHoveredOfficer] = useState<string>("");

  /**
   * Highlight the officer in the side panel when the user hovers over the officer's
   * highlighted dot in the swarm plot.
   */
  const onDotHover = useCallback(
    (officerId: string) => setHoveredOfficer(officerId),
    [setHoveredOfficer],
  );

  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore) return null;

  const { metricConfigsById, methodologyUrl } = supervisionStore;

  if (
    !officers ||
    officers.length === 0 ||
    !outlierOfficersByMetricAndCaseloadCategory ||
    outlierOfficersByMetricAndCaseloadCategory.size === 0
  ) {
    return <EmptyCard message={emptyMessage} />;
  }

  return (
    <CardWrapper noFlex={isTablet}>
      {!isTablet && (
        <CardHeader hasBorder={!isTablet}>
          {officers
            // We want multiple-metric outlier officers to display first in the list.
            .sort((a, b) => b.outlierMetrics.length - a.outlierMetrics.length)
            .map((officer) => (
              <CardHeaderItem
                key={officer.externalId}
                hovered={officer.externalId === hoveredOfficer}
                to={insightsUrl("supervisionStaff", {
                  officerPseudoId: officer.pseudonymizedId,
                })}
              >
                <CardTitle>{title || officer.displayName}</CardTitle>
                {officer.outlierMetrics.map((metric) => (
                  <CardSubtitle
                    key={metric.metricId}
                    id={`subtitle-${metric.config.titleDisplayName}`}
                  >
                    {metric.config.titleDisplayName}
                    <span
                      aria-describedby={`subtitle-${metric.config.titleDisplayName}`}
                    >
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
        {Array.from(outlierOfficersByMetricAndCaseloadCategory.entries()).map(
          ([metricId, officersAndBenchmarkByCaseloadCategory]) => {
            return Array.from(
              officersAndBenchmarkByCaseloadCategory.entries(),
            ).map(([caseloadCategory, officersAndBenchmark]) => {
              const generalMetricConfig = metricConfigsById?.get(metricId);

              if (!generalMetricConfig) return null;

              const {
                metricConfigWithBenchmark,
                officersForMetric,
                caseloadCategoryName,
              } = officersAndBenchmark;

              return (
                <React.Fragment key={`${metricId} / ${caseloadCategory}`}>
                  {isTablet &&
                    officersForMetric.map((officer) => {
                      const currentMetric = officer.outlierMetrics.find(
                        (officerMetric) => officerMetric.metricId === metricId,
                      );

                      if (!currentMetric) return null;

                      return (
                        <CardHeaderItem
                          key={officer.externalId}
                          to={insightsUrl("supervisionStaffMetric", {
                            officerPseudoId: officer.pseudonymizedId,
                            metricId: currentMetric.metricId,
                          })}
                        >
                          <CardTitle>{title || officer.displayName}</CardTitle>

                          <CardSubtitle
                            key={`${currentMetric.metricId} / ${caseloadCategory}`}
                            id={`subtitle-${currentMetric.metricId}`}
                          >
                            {currentMetric.config.titleDisplayName}
                            <span
                              aria-describedby={`subtitle-${currentMetric.metricId}`}
                            >
                              {formatTargetAndHighlight(
                                currentMetric.currentPeriodData.metricRate,
                              )}
                            </span>
                          </CardSubtitle>
                        </CardHeaderItem>
                      );
                    })}

                  <PlotSection key={`${metricId} / ${caseloadCategory}`}>
                    <PlotHeader>
                      <PlotTitle>
                        {toTitleCase(generalMetricConfig.eventName)}
                      </PlotTitle>
                      <PlotHint>
                        <InsightsInfoModalV2
                          title={toTitleCase(generalMetricConfig.eventName)}
                          copy={generalMetricConfig.descriptionMarkdown}
                          methodologyLink={methodologyUrl}
                        />
                      </PlotHint>
                    </PlotHeader>
                    {caseloadCategoryName && (
                      <PlotSubtitle>{caseloadCategoryName}</PlotSubtitle>
                    )}
                    <CardContent>
                      <InsightsSwarmPlotContainerV2
                        metric={metricConfigWithBenchmark}
                        officersForMetric={officersForMetric}
                        onDotHover={onDotHover}
                      />
                    </CardContent>
                  </PlotSection>
                </React.Fragment>
              );
            });
          },
        )}
      </CardBody>
    </CardWrapper>
  );
};

export default InsightsStaffCardV2;
