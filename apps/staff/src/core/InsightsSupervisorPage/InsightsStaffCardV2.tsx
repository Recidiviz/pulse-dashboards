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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import GreenCheckmark from "../../assets/static/images/greenCheckmark.svg?react";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { ModelHydratorWithoutLoader } from "../../InsightsStore/hydrators/ModelHydratorWithoutLoader";
import { SupervisionSupervisorOutcomesPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorOutcomesPresenter";
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

const CardHeaderItemWrapper = styled.div<{ hovered?: boolean }>`
  ${({ hovered }) =>
    hovered &&
    `background-color: ${palette.slate10};
      
    ${CardTitle} {
      border-bottom: 1px solid ${palette.pine1};
    }`}
`;

const CardHeaderItem = styled(Link)`
  display: block;
  padding: ${rem(spacing.md)};
  min-width: ${rem(200)};
  border-bottom: 1px solid ${palette.slate30};

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

function InsightsStaffCard({
  presenter,
}: {
  presenter: SupervisionSupervisorOutcomesPresenter;
}) {
  const { isTablet } = useIsMobile(true);

  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  const {
    outlierOfficersByMetricAndCaseloadCategory,
    outcomesDataForOutlierOfficers: officers,
    labels: { supervisorHasNoOutlierOfficersLabel: emptyMessage },
  } = presenter;

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
              <CardHeaderItemWrapper
                key={officer.externalId}
                onMouseOver={() => {
                  presenter?.updateHoveredOfficerId(officer.externalId);
                }}
                onMouseLeave={() => {
                  presenter?.updateHoveredOfficerId(undefined);
                }}
                hovered={presenter?.hoveredOfficerId === officer.externalId}
              >
                <CardHeaderItem
                  to={insightsUrl("supervisionStaff", {
                    officerPseudoId: officer.pseudonymizedId,
                  })}
                >
                  <CardTitle>{officer.displayName}</CardTitle>
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
              </CardHeaderItemWrapper>
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
                          <CardTitle>{officer.displayName}</CardTitle>

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
                        presenterWithHoverManager={presenter}
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
}

const ManagedComponent: React.FC<{
  presenter: SupervisionSupervisorOutcomesPresenter;
}> = observer(function InsightsStaffCardV2({ presenter }) {
  return <InsightsStaffCard presenter={presenter} />;
});

const usePresenter = () => {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  return supervisionStore?.supervisorPseudoId
    ? new SupervisionSupervisorOutcomesPresenter(
        supervisionStore,
        supervisionStore?.supervisorPseudoId,
      )
    : null;
};

const InsightsStaffCardV2 = withPresenterManager({
  managerIsObserver: true,
  usePresenter,
  HydratorComponent: ModelHydratorWithoutLoader,
  ManagedComponent,
});

export default InsightsStaffCardV2;
