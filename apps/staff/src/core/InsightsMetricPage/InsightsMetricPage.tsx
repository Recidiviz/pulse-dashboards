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

import { palette } from "@recidiviz/design-system";
import { sub } from "date-fns";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerDetailPresenter } from "../../InsightsStore/presenters/SupervisionOfficerDetailPresenter";
import { formatDate, toTitleCase } from "../../utils";
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
import { InsightsSwarmPlot } from "../InsightsSwarmPlot";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";
import { MetricEventsTable } from "./MetricEventsTable";

const StyledLink = styled(Link)`
  color: ${palette.signal.links} !important;
  border-bottom: 1px solid ${palette.signal.links};
`;

export const MetricPageWithPresenter = observer(
  function MetricPageWithPresenter({
    presenter,
  }: {
    presenter: SupervisionOfficerDetailPresenter;
  }) {
    const { isLaptop } = useIsMobile(true);
    const [initialPageLoad, setInitialPageLoad] = useState(true);

    const {
      outlierOfficerData,
      defaultMetricId,
      officerPseudoId,
      metricId,
      metricInfo,
      goToSupervisorInfo,
      timePeriod,
      labels,
      methodologyUrl,
      trackMetricTabViewed,
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

    const metric = outlierOfficerData.outlierMetrics.find(
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
            outlierOfficerData.displayName
          } is not currently an outlier on ${toTitleCase(
            metricInfo.eventName,
          )}. They are an outlier on other metrics.`}
          {...linkProps}
        />
      );
    }

    if (initialPageLoad) {
      presenter.trackStaffPageViewed();
      setInitialPageLoad(false);
    }

    const pageDescription = (
      <>
        Measure {outlierOfficerData.fullName.givenNames}’s performance as
        compared to other {labels.supervisionOfficerLabel}s in the state. Rates
        for the metrics below are calculated for the time period: {timePeriod}
        .&nbsp;
        <StyledLink to={methodologyUrl}>
          How did we calculate this rate?
        </StyledLink>
      </>
    );

    const secondToLastDate = metric.benchmark.benchmarks.at(-2)?.endDate;

    const {
      eventName,
      eventNameSingular,
      eventNamePastTense,
      bodyDisplayName,
    } = metric.config;

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

    const modalText =
      eventName === "program starts"
        ? `This is the list of clients on this agents caseload who have had no program start and are therefore being counted in this metric.<br><br>
               The name of the client and their CDCR ID is included as well.`
        : `This is the list of ${eventNameSingular} events which are being counted in the numerator of this metric.<br><br>
              The name of the ${labels.supervisionJiiLabel}, their ${labels.docLabel} ID, and the date of the ${eventNameSingular} are listed within this table. <br><br>
              Click on a ${labels.supervisionJiiLabel} to see more information about this case, such as how long they had been with this ${labels.supervisionOfficerLabel} and more.`;

    return (
      <InsightsPageLayout
        pageTitle={metricInfo.titleDisplayName}
        pageSubtitle={outlierOfficerData.displayName}
        pageDescription={pageDescription}
        contentsAboveTitle={
          <InsightsBreadcrumbs
            previousPage={{
              title: outlierOfficerData.displayName,
              url: insightsUrl("supervisionStaff", {
                officerPseudoId: outlierOfficerData.pseudonymizedId,
              }),
            }}
          >
            Outcomes Metric
          </InsightsBreadcrumbs>
        }
      >
        <Wrapper isLaptop={isLaptop}>
          <Sidebar>
            <InsightsChartCard
              title={
                eventName === "program starts"
                  ? "List of clients with no Program Starts"
                  : `List of ${toTitleCase(eventName)}`
              }
              infoModal={
                <InsightsInfoModalV2
                  title={`List of ${toTitleCase(eventName)}`}
                  copy={`${modalText}`}
                  methodologyLink={methodologyUrl}
                />
              }
              hasLegend={false}
              outcomeType={metric.config.outcomeType}
              supervisorHomepage
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
                  copy={`This plot shows the selected ${labels.supervisionOfficerLabel} and all other ${labels.supervisionOfficerLabel}s in the state based on their rate for this metric. <br><br>
                        This rate is calculated by taking the total number of ${eventName} on this ${labels.supervisionOfficerLabel}'s caseload in the past 12 months and dividing it by the ${labels.supervisionOfficerLabel}'s average daily caseload. <br><br>
                        For example, if 25 ${labels.supervisionJiiLabel}s on an ${labels.supervisionOfficerLabel}'s caseload ${eventNamePastTense} in the past 12 months, and the ${labels.supervisionOfficerLabel} had an average daily caseload of 50 ${labels.supervisionJiiLabel}s, their ${bodyDisplayName} would appear as 50% in this tool. As a result, this rate can be over 100%.`}
                  methodologyLink={methodologyUrl}
                />
              }
              outcomeType={metric.config.outcomeType}
              supervisorHomepage
            >
              <InsightsSwarmPlot metric={metric} supervisorHomepage />
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
              outcomeType={metric.config.outcomeType}
              supervisorHomepage
            >
              <InsightsLinePlot
                metric={metric}
                officerName={outlierOfficerData.displayName}
                supervisorHomepage
              />
            </InsightsChartCard>
          </Body>
        </Wrapper>
      </InsightsPageLayout>
    );
  },
);

const InsightsMetricPage = observer(function InsightsMetricPage() {
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
      <MetricPageWithPresenter presenter={presenter} />
    </ModelHydrator>
  );
});

export default InsightsMetricPage;
