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

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  ExcludedSupervisionOfficer,
  SupervisionOfficer,
} from "../../InsightsStore/models/SupervisionOfficer";
import { SupervisionOfficerPresenter } from "../../InsightsStore/presenters/SupervisionOfficerPresenter";
import { OutlierOfficerData } from "../../InsightsStore/presenters/types";
import { toTitleCase } from "../../utils";
import InsightsChartCard from "../InsightsChartCard";
import InsightsPageLayout from "../InsightsPageLayout";
import InsightsPageSection from "../InsightsPageSection/InsightsPageSection";
import { InsightsBreadcrumbs } from "../InsightsSupervisorPage/InsightsBreadcrumbs";
import { EmptyCard } from "../InsightsSupervisorPage/InsightsStaffCardV2";
import { InsightsSwarmPlotContainerV2 } from "../InsightsSwarmPlot";
import { formatTargetAndHighlight } from "../InsightsSwarmPlot/utils";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";
import { OpportunitySummaries } from "../WorkflowsHomepage/OpportunitySummaries";

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
  presenter: SupervisionOfficerPresenter<
    SupervisionOfficer | ExcludedSupervisionOfficer
  >;
}) {
  const { isTablet } = useIsMobile(true);
  const [initialPageLoad, setInitialPageLoad] = useState<boolean>(true);

  const {
    outlierOfficerData,
    officerPseudoId,
    supervisorsInfo,
    goToSupervisorInfo,
    labels,
    timePeriod,
    userCanAccessAllSupervisors,
    numClientsOnCaseload,
    numEligibleOpportunities,
    opportunitiesByType,
    opportunityTypes,
  } = presenter;

  // TODO(#5780): move infoItems to presenter
  const infoItems = [
    {
      title: "current clients",
      info: numClientsOnCaseload,
    },
    {
      title: "avg daily caseload",
      info: outlierOfficerData?.avgDailyPopulation,
    },
    {
      title: "caseload type",
      info:
        (presenter.areCaseloadTypeBreakdownsEnabled &&
          outlierOfficerData?.caseloadCategoryName) ||
        null,
    },
  ];

  if (initialPageLoad) {
    presenter.trackStaffPageViewed();
    setInitialPageLoad(false);
  }

  return (
    <InsightsPageLayout
      pageTitle={outlierOfficerData?.displayName}
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
            {outlierOfficerData?.displayName} Profile
          </InsightsBreadcrumbs>
        )
      }
    >
      {outlierOfficerData?.outlierMetrics?.length ? (
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
                supervisorHomepage
              >
                <InsightsSwarmPlotContainerV2
                  metric={metric}
                  officersForMetric={[
                    outlierOfficerData as OutlierOfficerData<SupervisionOfficer>,
                  ]}
                  isMinimized
                />
              </InsightsChartCard>
            );
          })}
        </Wrapper>
      ) : (
        <EmptyCard message={labels.officerHasNoOutlierMetricsLabel} />
      )}
      {opportunitiesByType && (
        <InsightsPageSection
          sectionTitle={`Opportunities (${numEligibleOpportunities ?? 0})`}
        >
          {numEligibleOpportunities ? (
            <OpportunitySummaries
              opportunitiesByType={opportunitiesByType}
              opportunityTypes={opportunityTypes}
              officerPseudoId={officerPseudoId}
            />
          ) : (
            <EmptyCard
              message={labels.officerHasNoEligibleClientsLabel}
              height={200}
            />
          )}
        </InsightsPageSection>
      )}
    </InsightsPageLayout>
  );
});

const InsightsStaffPageV2 = observer(function InsightsStaffPageV2() {
  const {
    insightsStore: { supervisionStore },
    workflowsRootStore: {
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    },
  } = useRootStore();
  const officerPseudoId = supervisionStore?.officerPseudoId;

  if (!officerPseudoId || !justiceInvolvedPersonsStore) return null;

  const presenter = new SupervisionOfficerPresenter(
    supervisionStore,
    officerPseudoId,
    justiceInvolvedPersonsStore,
    opportunityConfigurationStore,
  );

  return (
    <ModelHydrator model={presenter}>
      <StaffPageWithPresenter presenter={presenter} />
    </ModelHydrator>
  );
});

export default InsightsStaffPageV2;
