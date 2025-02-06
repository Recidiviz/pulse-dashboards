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

import { toTitleCase } from "@artsy/to-title-case";
import { sub } from "date-fns";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { withPresenterManager } from "~hydration-utils";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerDetailPresenter } from "../../InsightsStore/presenters/SupervisionOfficerDetailPresenter";
import { formatDate } from "../../utils";
import InsightsChartCard from "../InsightsChartCard";
import InsightsEmptyPage from "../InsightsEmptyPage";
import InsightsInfoModalV2 from "../InsightsInfoModal/InsightsInfoModalV2";
import InsightsLinePlot from "../InsightsLinePlot";
import InsightsPageLayout from "../InsightsPageLayout";
import {
  Body,
  Sidebar,
  Wrapper,
} from "../InsightsPageLayout/InsightsPageLayout";
import { InsightsBreadcrumbs } from "../InsightsSupervisorPage/InsightsBreadcrumbs";
import { InsightsSwarmPlotContainerV2 } from "../InsightsSwarmPlot";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";
import { MetricEventsTable } from "./MetricEventsTable";

const ManagedComponent = observer(function MetricPage({
  presenter,
}: {
  presenter: SupervisionOfficerDetailPresenter;
}) {
  const { isLaptop } = useIsMobile(true);
  const [initialPageLoad, setInitialPageLoad] = useState<boolean>(true);

  const {
    officerOutcomesData,
    defaultMetricId,
    officerPseudoId,
    metricId,
    metricInfo,
    goToSupervisorInfo,
    timePeriod,
    labels,
    methodologyUrl,
    userCanAccessAllSupervisors,
    ctaText,
  } = presenter;

  const supervisorLinkProps = goToSupervisorInfo && {
    linkText: `Go to ${
      goToSupervisorInfo.displayName || labels.supervisionSupervisorLabel
    }'s ${labels.supervisionUnitLabel}`,
    link: insightsUrl("supervisionSupervisor", {
      supervisorPseudoId: goToSupervisorInfo.pseudonymizedId,
    }),
  };

  // empty page where the staff member is not an outlier on any metrics
  if (officerOutcomesData && !officerOutcomesData.outlierMetrics.length) {
    return (
      <InsightsEmptyPage
        headerText={`${officerOutcomesData.displayName} is not currently an outlier on any metrics.`}
        {...supervisorLinkProps}
      />
    );
  }

  // if the presenter is hydrated, this stuff should never be missing in practice
  if (!officerOutcomesData || !defaultMetricId || !metricInfo)
    return <NotFound />;

  const metric = officerOutcomesData.outlierMetrics.find(
    (metric) => metric.metricId === metricId,
  );

  // empty page where the staff is not an outlier on the page the user landed at
  if (!metric) {
    const linkProps = {
      linkText: "Navigate to their profile",
      link: insightsUrl("supervisionStaff", {
        officerPseudoId,
      }),
    };

    return (
      <InsightsEmptyPage
        headerText={`${
          officerOutcomesData.displayName
        } is not currently an outlier on ${toTitleCase(
          metricInfo.eventName,
        )}. They are an outlier on other metrics.`}
        {...linkProps}
      />
    );
  }

  if (initialPageLoad && metricId) {
    presenter.trackMetricViewed(metricId);
    setInitialPageLoad(false);
  }

  const secondToLastDate = metric.benchmark.benchmarks.at(-2)?.endDate;

  const {
    eventName,
    eventNameSingular,
    eventNamePastTense,
    bodyDisplayName,
    descriptionMarkdown,
  } = metric.config;

  const infoItems = [
    {
      title: "avg daily caseload",
      info: officerOutcomesData.avgDailyPopulation,
    },
  ];

  const secondToLastDateHint = secondToLastDate
    ? `The dot before the most recent one shows the ${
        labels.supervisionOfficerLabel
      }’s ${bodyDisplayName} from ${formatDate(
        sub(secondToLastDate, { years: 1 }),
        "MMMM yyyy",
      )} to ${formatDate(
        secondToLastDate,
        "MMMM yyyy",
      )} — again representing the ${
        labels.supervisionOfficerLabel
      }’s rate for a full year, but starting a month earlier.`
    : "";

  const listLearnMoreText =
    eventName === "program starts"
      ? `This is the list of clients on this agents caseload who have had no program start and are therefore being counted in this metric.<br><br>
               The name of the client and their CDCR ID is included as well.
          ${ctaText.insightsLanternStateCaseLearnMore}`
      : `This is the list of ${eventNameSingular} events which are being counted in the numerator of this metric.<br><br>
              The name of the ${labels.supervisionJiiLabel}, their ${labels.docLabel} ID, and the date of the ${eventNameSingular} are listed within this table.<br><br>
              ${ctaText.insightsLanternStateCaseLearnMore}`;

  const dotPlotLearnMoreText = `This plot shows the selected ${labels.supervisionOfficerLabel} and all other ${labels.supervisionOfficerLabel}s in the state based on their rate for this metric.<br><br>
        This rate is calculated by taking the total number of ${eventName} on this ${labels.supervisionOfficerLabel}'s caseload in the past 12 months and dividing it by the ${labels.supervisionOfficerLabel}'s average daily caseload.<br><br>
        ${descriptionMarkdown}<br><br>
        As a result, this rate can be over 100%. For example, if 60 ${labels.supervisionJiiLabel}s on an ${labels.supervisionOfficerLabel}’s caseload ${eventNamePastTense} in the past 12 months, and their average daily caseload was 50 ${eventName}, the rate would be 120%.
            `;

  const pageDescription = (
    <>
      Measure {officerOutcomesData.fullName.givenNames}’s performance as
      compared to other {labels.supervisionOfficerLabel}s in the state. Rates
      for the metrics below are calculated for the time period: {timePeriod}
      .&nbsp;
      <InsightsInfoModalV2
        title="How did we calculate this rate?"
        buttonText="How did we calculate this rate?"
        copy={dotPlotLearnMoreText}
        methodologyLink={methodologyUrl}
      />
    </>
  );

  return (
    <InsightsPageLayout
      pageTitle={metricInfo.titleDisplayName}
      pageSubtitle={officerOutcomesData.displayName}
      pageDescription={pageDescription}
      infoItems={infoItems}
      contentsAboveTitle={
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
            ...(goToSupervisorInfo
              ? [
                  {
                    title: `${goToSupervisorInfo.displayName || labels.supervisionSupervisorLabel} Overview`,
                    url: insightsUrl("supervisionSupervisor", {
                      supervisorPseudoId: goToSupervisorInfo.pseudonymizedId,
                    }),
                  },
                ]
              : []),
            {
              title: `${officerOutcomesData.displayName} Profile`,
              url: insightsUrl("supervisionStaff", {
                officerPseudoId: officerOutcomesData.pseudonymizedId,
              }),
            },
          ]}
        >
          {toTitleCase(eventName)} Metric
        </InsightsBreadcrumbs>
      }
    >
      <Wrapper isFlex isLaptop={isLaptop}>
        <Sidebar>
          <InsightsChartCard
            title={
              eventName === "program starts"
                ? "List of clients with no Program Starts"
                : `List of ${toTitleCase(eventName)}`
            }
            subtitle={metric.config.listTableText}
            infoModal={
              <InsightsInfoModalV2
                title={`List of ${toTitleCase(eventName)}`}
                copy={`${listLearnMoreText}`}
                methodologyLink={methodologyUrl}
              />
            }
          >
            <MetricEventsTable
              officerPseudoId={presenter.officerPseudoId}
              metricId={metric.metricId}
            />
          </InsightsChartCard>
        </Sidebar>
        <Body>
          <InsightsChartCard
            title={`${toTitleCase(bodyDisplayName)} Compared to State`}
            infoModal={
              <InsightsInfoModalV2
                title="Rate Compared to State"
                copy={dotPlotLearnMoreText}
                methodologyLink={methodologyUrl}
              />
            }
          >
            <InsightsSwarmPlotContainerV2
              metric={metric}
              officersForMetric={[officerOutcomesData]}
            />
          </InsightsChartCard>
          <InsightsChartCard
            title={`Historical ${toTitleCase(metric.config.bodyDisplayName)}`}
            infoModal={
              <InsightsInfoModalV2
                title="Historical Rate"
                copy={`This chart shows a “yearly rolling window,” which means that each dot on the line represents the ${labels.supervisionOfficerLabel}’s ${metric.config.bodyDisplayName} for a full year. 
                        The most recent dot on the line chart matches up with the rate that is shown in the chart above and represents the ${bodyDisplayName} over the past 12 months. 
                        ${secondToLastDateHint} <br><br>
                        12-month rates are used in order to ensure this line plot is less affected by seasonal spikes or dips.`}
                methodologyLink={methodologyUrl}
              />
            }
          >
            <InsightsLinePlot
              metric={metric}
              officerName={officerOutcomesData.displayName}
              supervisionOfficerLabel={labels.supervisionOfficerLabel}
              methodologyUrl={methodologyUrl}
              eventName={metricInfo.eventName}
            />
          </InsightsChartCard>
        </Body>
      </Wrapper>
    </InsightsPageLayout>
  );
});

function usePresenter() {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  const officerPseudoId = supervisionStore?.officerPseudoId;
  const metricId = supervisionStore?.metricId;

  // TODO: If/when we remove the original insights layout, we should refactor the
  // officer detail presenter to take the metric ID as a parameter.
  if (!officerPseudoId || !metricId) return null;

  return new SupervisionOfficerDetailPresenter(
    supervisionStore,
    officerPseudoId,
  );
}

const InsightsMetricPage = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
  HydratorComponent: ModelHydrator,
});

export default InsightsMetricPage;
