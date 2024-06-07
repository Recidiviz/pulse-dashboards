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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useState } from "react";
import styled from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerDetailPresenter } from "../../InsightsStore/presenters/SupervisionOfficerDetailPresenter";
import { toTitleCase } from "../../utils";
import InsightsChartCard from "../InsightsChartCard";
import InsightsEmptyPage from "../InsightsEmptyPage";
import InsightsPageLayout from "../InsightsPageLayout";
import { InsightsBreadcrumbs } from "../InsightsSupervisorPage/InsightsBreadcrumbs";
import { InsightsSwarmPlot } from "../InsightsSwarmPlot";
import { formatTargetAndHighlight } from "../InsightsSwarmPlot/utils";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";

const Wrapper = styled.div<{ isTablet: boolean }>`
  display: grid;
  grid-template-columns: repeat(
    2,
    minmax(${({ isTablet }) => (isTablet ? "unset" : rem(300))}, 1fr)
  );
  gap: ${rem(spacing.md)};
`;

export const StaffPageWithPresenter = observer(function StaffPageWithPresenter({
  presenter,
}: {
  presenter: SupervisionOfficerDetailPresenter;
}) {
  const { isTablet } = useIsMobile(true);
  const [initialPageLoad, setInitialPageLoad] = useState(true);

  const {
    outlierOfficerData,
    defaultMetricId,
    officerPseudoId,
    metricId,
    metricInfo,
    supervisorsInfo,
    goToSupervisorInfo,
    labels,
    trackMetricTabViewed,
    timePeriod,
  } = presenter;

  useEffect(() => {
    if (metricId) trackMetricTabViewed(metricId);
  }, [metricId, trackMetricTabViewed]);

  const supervisorLinkProps = goToSupervisorInfo && {
    linkText: `Go to ${
      goToSupervisorInfo.displayName || labels.supervisionSupervisorLabel
    }'s ${labels.supervisionUnitLabel}`,
    link: insightsUrl("supervisionSupervisor", {
      supervisorPseudoId: goToSupervisorInfo.pseudonymizedId,
    }),
  };

  // empty page where the staff member is not an outlier on any metrics
  if (outlierOfficerData && !outlierOfficerData.outlierMetrics.length) {
    return (
      <InsightsEmptyPage
        headerText={`${outlierOfficerData.displayName} is not currently an outlier on any metrics.`}
        {...supervisorLinkProps}
      />
    );
  }

  // if the presenter is hydrated, this stuff should never be missing in practice
  if (!outlierOfficerData || !defaultMetricId || !metricInfo)
    return <NotFound />;

  const infoItems = [
    {
      title: "caseload types",
      info:
        (presenter.areCaseloadTypeBreakdownsEnabled &&
          outlierOfficerData.caseloadType) ||
        null,
    },
  ];

  if (initialPageLoad) {
    presenter.trackStaffPageViewed();
    setInitialPageLoad(false);
  }

  return (
    <InsightsPageLayout
      pageTitle={outlierOfficerData.displayName}
      pageSubtitle="Outcomes"
      infoItems={infoItems}
      contentsAboveTitle={
        supervisorsInfo &&
        goToSupervisorInfo && (
          <InsightsBreadcrumbs
            previousPage={{
              title: `${goToSupervisorInfo.displayName || labels.supervisionSupervisorLabel} Overview`,
              url: insightsUrl("supervisionSupervisor", {
                supervisorPseudoId: goToSupervisorInfo.pseudonymizedId,
              }),
            }}
          >
            {toTitleCase(labels.supervisionOfficerLabel)} Profile
          </InsightsBreadcrumbs>
        )
      }
    >
      <Wrapper isTablet={isTablet}>
        {outlierOfficerData.outlierMetrics.map((metric) => {
          const { bodyDisplayName } = metric.config;

          return (
            <InsightsChartCard
              key={metric.metricId}
              url={insightsUrl("supervisionStaffMetric", {
                officerPseudoId,
                metricId: metric.metricId,
              })}
              title={toTitleCase(bodyDisplayName)}
              subtitle={timePeriod}
              rate={formatTargetAndHighlight(
                metric.currentPeriodData.metricRate,
              )}
            >
              <InsightsSwarmPlot metric={metric} isMinimized />
            </InsightsChartCard>
          );
        })}
      </Wrapper>
    </InsightsPageLayout>
  );
});

const InsightsStaffPageV2 = observer(function InsightsStaffPageV2() {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  const officerPseudoId = supervisionStore?.officerPseudoId;

  if (!officerPseudoId) return null;

  const presenter = new SupervisionOfficerDetailPresenter(
    supervisionStore,
    officerPseudoId,
  );

  return (
    <ModelHydrator model={presenter}>
      <StaffPageWithPresenter presenter={presenter} />
    </ModelHydrator>
  );
});

export default InsightsStaffPageV2;
