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
import { useState } from "react";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerPresenter } from "../../InsightsStore/presenters/SupervisionOfficerPresenter";
import { toTitleCase } from "../../utils";
import InsightsActionStrategyBanner from "../InsightsActionStrategyBanner";
import InsightsChartCard from "../InsightsChartCard";
import InsightsHighlightedOfficersBanner from "../InsightsHighlightedOfficersBanner";
import InsightsPageLayout from "../InsightsPageLayout";
import { InsightsBreadcrumbs } from "../InsightsSupervisorPage/InsightsBreadcrumbs";
import { EmptyCard } from "../InsightsSupervisorPage/InsightsStaffCardV2";
import { InsightsSwarmPlotContainerV2 } from "../InsightsSwarmPlot";
import { formatTargetAndHighlight } from "../InsightsSwarmPlot/utils";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";
import { InsightsOpportunitySummary } from "./InsightsOpportunitySummary";
import { InsightsStaffVitals } from "./InsightsStaffVitals";

const Wrapper = styled.div<{ isTablet: boolean }>`
  display: grid;
  grid-template-columns: repeat(
    2,
    minmax(${({ isTablet }) => (isTablet ? "unset" : rem(300))}, 1fr)
  );
  gap: ${rem(spacing.md)};
`;

const ManagedComponent = observer(function StaffPage({
  presenter,
}: {
  presenter: SupervisionOfficerPresenter;
}) {
  const { isTablet } = useIsMobile(true);
  const [initialPageLoad, setInitialPageLoad] = useState<boolean>(true);

  const {
    officerOutcomesData,
    officerRecord,
    officerPseudoId,
    supervisorsInfo,
    goToSupervisorInfo,
    labels,
    timePeriod,
    numClientsOnCaseload,
    userCanAccessAllSupervisors,
    actionStrategyCopy,
    setUserHasSeenActionStrategy,
    disableSurfaceActionStrategies,
    isVitalsEnabled,
    officerHighlights,
  } = presenter;

  // TODO(#5780): move infoItems to presenter
  const infoItems = [
    {
      title: "active clients",
      info: numClientsOnCaseload,
    },
    {
      title: "avg daily caseload",
      info: officerOutcomesData?.avgDailyPopulation,
    },
    {
      title: "caseload type",
      info:
        (presenter.areCaseloadCategoryBreakdownsEnabled &&
          officerOutcomesData?.caseloadCategoryName) ||
        null,
    },
  ];

  if (initialPageLoad) {
    presenter.trackStaffPageViewed();
    setInitialPageLoad(false);
  }

  return (
    <InsightsPageLayout
      pageTitle={officerRecord?.displayName}
      pageSubtitle="Outcomes"
      infoItems={infoItems}
      contentsAboveTitle={
        supervisorsInfo &&
        goToSupervisorInfo && (
          <InsightsBreadcrumbs
            previousPages={[
              ...(userCanAccessAllSupervisors
                ? [
                    {
                      title: "All Supervisors",
                      url: insightsUrl("supervisionSupervisorsList"),
                    },
                  ]
                : []),
              {
                title: `${goToSupervisorInfo.displayName || labels.supervisionSupervisorLabel} Overview`,
                url: insightsUrl("supervisionSupervisor", {
                  supervisorPseudoId: goToSupervisorInfo.pseudonymizedId,
                }),
              },
            ]}
          >
            {officerOutcomesData?.displayName} Profile
          </InsightsBreadcrumbs>
        )
      }
      highlightedOfficers={
        <InsightsHighlightedOfficersBanner
          highlightedOfficers={officerHighlights}
          supervisionOfficerLabel={labels.supervisionOfficerLabel}
          staffPage
        />
      }
    >
      {officerOutcomesData?.outlierMetrics?.length ? (
        <>
          {actionStrategyCopy && (
            <InsightsActionStrategyBanner
              actionStrategy={actionStrategyCopy}
              bannerViewedCallback={setUserHasSeenActionStrategy}
              disableBannerCallback={disableSurfaceActionStrategies}
            />
          )}
          <Wrapper isTablet={isTablet}>
            {officerOutcomesData.outlierMetrics.map((metric) => {
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
                  supervisorHomepage
                >
                  <InsightsSwarmPlotContainerV2
                    metric={metric}
                    officersForMetric={[officerOutcomesData]}
                    isMinimized
                  />
                </InsightsChartCard>
              );
            })}
          </Wrapper>
        </>
      ) : (
        <EmptyCard message={labels.officerHasNoOutlierMetricsLabel} />
      )}
      <InsightsOpportunitySummary />
      {isVitalsEnabled && (
        <InsightsStaffVitals officerPseudoId={officerPseudoId} />
      )}
    </InsightsPageLayout>
  );
});

function usePresenter() {
  const {
    insightsStore: { supervisionStore },
    workflowsRootStore: { justiceInvolvedPersonsStore },
  } = useRootStore();
  const officerPseudoId = supervisionStore?.officerPseudoId;

  if (!officerPseudoId || !justiceInvolvedPersonsStore) return null;

  return new SupervisionOfficerPresenter(
    supervisionStore,
    officerPseudoId,
    justiceInvolvedPersonsStore,
  );
}

const InsightsStaffPageV2 = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: ModelHydrator,
});

export default InsightsStaffPageV2;
