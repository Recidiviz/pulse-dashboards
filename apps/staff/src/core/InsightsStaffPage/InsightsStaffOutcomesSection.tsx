// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { toTitleCase } from "@artsy/to-title-case";
import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerOutcomesPresenter } from "../../InsightsStore/presenters/SupervisionOfficerOutcomesPresenter";
import InsightsChartCard from "../InsightsChartCard";
import { EmptyCard } from "../InsightsSupervisorPage/InsightsStaffCardV2";
import { InsightsSwarmPlotContainerV2 } from "../InsightsSwarmPlot/InsightsSwarmPlotContainerV2";
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

const ManagedComponent = observer(function InsightsStaffOutcomesSection({
  presenter,
}: {
  presenter: SupervisionOfficerOutcomesPresenter;
}) {
  const { officerPseudoId, labels, timePeriod, officerOutcomesData } =
    presenter;

  const { isTablet } = useIsMobile(true);

  return officerOutcomesData?.outlierMetrics?.length ? (
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
            rate={formatTargetAndHighlight(metric.currentPeriodData.metricRate)}
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
  ) : (
    <EmptyCard message={labels.officerHasNoOutlierMetricsLabel} />
  );
});

function usePresenter() {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore?.officerPseudoId) return null;

  return new SupervisionOfficerOutcomesPresenter(
    supervisionStore,
    supervisionStore.officerPseudoId,
  );
}

export const InsightsStaffOutcomesSection = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: ModelHydrator,
});
