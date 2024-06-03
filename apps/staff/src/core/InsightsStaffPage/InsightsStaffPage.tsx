// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import {
  palette,
  spacing,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  zindex,
} from "@recidiviz/design-system";
import { sub } from "date-fns";
import { noop } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import simplur from "simplur";
import styled, { css } from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import useIsOverflown from "../../hooks/useIsOverflown";
import { SupervisionOfficerDetailPresenter } from "../../InsightsStore/presenters/SupervisionOfficerDetailPresenter";
import { getDistrictWithoutLabel } from "../../InsightsStore/presenters/utils";
import { formatDate, toTitleCase } from "../../utils";
import InsightsChartCard from "../InsightsChartCard";
import InsightsEmptyPage from "../InsightsEmptyPage";
import InsightsInfoModal from "../InsightsInfoModal";
import InsightsLinePlot from "../InsightsLinePlot";
import { MetricEventsTable } from "../InsightsMetricPage/MetricEventsTable";
import { INTERCOM_HEIGHT } from "../InsightsNavLayout/InsightsNavLayout";
import InsightsPageLayout from "../InsightsPageLayout";
import {
  Body,
  Sidebar,
  Wrapper,
} from "../InsightsPageLayout/InsightsPageLayout";
import { InsightsSwarmPlot } from "../InsightsSwarmPlot";
import ModelHydrator from "../ModelHydrator";
import { NavigationBackButton } from "../NavigationBackButton";
import { insightsUrl } from "../views";

const StyledTabs = styled(Tabs)<{ $isMobile: boolean }>`
  margin: 0 -1.5rem;
  margin-bottom: -${({ $isMobile }) => ($isMobile ? 0 : rem(INTERCOM_HEIGHT))};
  display: flex;
  flex-direction: column;
  flex: auto;
`;

const scrollShadowStyles = css`
  content: "";
  pointer-events: none;
  position: absolute;
  transition: all 200ms ease;
  width: ${rem(16)};
  height: ${rem(40)};
  z-index: ${zindex.tooltip - 1};
  margin: 0 -${rem(spacing.md)};
`;

const StyledTabList = styled(TabList)<{
  $isMobile: boolean;
  $showScrollShadow: boolean;
}>`
  display: block;
  padding: ${rem(spacing.md)} ${rem(spacing.sm)} 0;
  white-space: nowrap;
  overflow-x: auto;
  ${({ $isMobile }) => $isMobile && `border-bottom: none`};

  &::before {
    ${scrollShadowStyles}
    background: linear-gradient(
      90deg,
      #ffffff 3.13%,
      rgba(255, 255, 255, 0) 109.62%
    );
    left: 0;
    opacity: ${({ $showScrollShadow }) => ($showScrollShadow ? 1 : 0)};
  }

  &::after {
    ${scrollShadowStyles}
    background: linear-gradient(
      270deg,
      #ffffff 3.13%,
      rgba(255, 255, 255, 0) 109.62%
    );
    right: 0;
    opacity: ${({ $showScrollShadow }) => ($showScrollShadow ? 1 : 0)};
  }
`;

const StyledTab = styled(Tab)`
  font-size: ${rem(spacing.md)};
  display: inline-block;
  padding: ${rem(spacing.sm)} 0;
  color: ${palette.slate60};
  border-bottom: ${rem(4)} solid transparent;

  &:hover {
    color: ${palette.pine2};
  }

  &.Tab--selected {
    border-bottom-color: ${palette.pine2};
    color: ${palette.pine2};
  }
`;

const StyledTabPanel = styled(TabPanel)`
  background: #f4f5f6;
  padding: ${rem(spacing.lg)};
  &.TabPanel--selected {
    display: flex;
    flex-direction: column;
    flex: auto;
  }
`;

export const StaffPageWithPresenter = observer(function StaffPageWithPresenter({
  presenter,
}: {
  presenter: SupervisionOfficerDetailPresenter;
}) {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useIsMobile(true);
  const [tabListEl, setTabListEl] = useState<HTMLElement | null>(null);
  const isTabListOverflown = useIsOverflown(tabListEl);
  const [initialPageLoad, setInitialPageLoad] = useState(true);

  const {
    outlierOfficerData,
    defaultMetricId,
    officerPseudoId,
    metricId,
    metricInfo,
    supervisorsInfo,
    timePeriod,
    labels,
    methodologyUrl,
    trackMetricTabViewed,
    goToSupervisorInfo,
  } = presenter;

  useEffect(() => {
    setTabListEl(document.getElementById("insightsStaffTabList"));
  }, []);

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

  // if current metric is not set, we need to redirect to the default metric URL
  if (!metricId) {
    return (
      <Navigate
        replace
        to={insightsUrl("supervisionStaffMetric", {
          officerPseudoId,
          metricId: defaultMetricId,
        })}
      />
    );
  }

  // empty page where the staff is not an outlier on the page the user landed at
  if (
    !outlierOfficerData.outlierMetrics.find(
      (metric) => metric.metricId === metricInfo.name,
    )
  ) {
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

  const pageTitle = simplur`${outlierOfficerData.displayName} is an outlier on ${outlierOfficerData.outlierMetrics.length} metric[|s]`;
  const supervisorNames = supervisorsInfo?.map((s) => s.displayName).join(", ");

  const infoItems = [
    {
      title: "caseload types",
      info:
        (presenter.areCaseloadTypeBreakdownsEnabled &&
          outlierOfficerData.caseloadType) ||
        null,
    },
    {
      title: labels.supervisionDistrictLabel,
      info: getDistrictWithoutLabel(
        outlierOfficerData.district,
        labels.supervisionDistrictLabel,
      ),
    },
    {
      title: simplur`${labels.supervisionUnitLabel} ${[supervisorsInfo?.length]}${labels.supervisionSupervisorLabel}[|s]`,
      info: supervisorNames,
    },
    {
      title: "time period",
      info: timePeriod,
    },
  ];

  if (initialPageLoad) {
    presenter.trackStaffPageViewed();
    setInitialPageLoad(false);
  }

  return (
    <InsightsPageLayout
      pageTitle={pageTitle}
      infoItems={infoItems}
      contentsAboveTitle={
        !!supervisorLinkProps && (
          <NavigationBackButton action={{ url: supervisorLinkProps.link }}>
            {supervisorLinkProps?.linkText}
          </NavigationBackButton>
        )
      }
    >
      <StyledTabs
        $isMobile={isMobile}
        selectedIndex={presenter.currentMetricIndex}
        // tab navigation is handled by router Link components,
        // so we don't actually have to maintain any tab state here
        onSelect={noop}
      >
        <StyledTabList
          id="insightsStaffTabList"
          $isMobile={isMobile}
          $showScrollShadow={isMobile && isTabListOverflown}
        >
          {outlierOfficerData.outlierMetrics.map((metric) => {
            const handleTabClick = () => {
              navigate(
                insightsUrl("supervisionStaffMetric", {
                  officerPseudoId: outlierOfficerData.pseudonymizedId,
                  metricId: metric.metricId,
                }),
              );
            };

            return (
              <StyledTab key={metric.metricId} onClick={handleTabClick}>
                {toTitleCase(metric.config.eventName)}
              </StyledTab>
            );
          })}
        </StyledTabList>
        {outlierOfficerData.outlierMetrics.map((metric) => {
          const firstDate = metric.benchmark.benchmarks[0]?.endDate;
          const secondToLastDate = metric.benchmark.benchmarks.at(-2)?.endDate;
          const lastDate = metric.benchmark.benchmarks.at(-1)?.endDate;

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
            <StyledTabPanel key={metric.metricId}>
              <Wrapper isLaptop={isTablet}>
                <Sidebar>
                  <InsightsChartCard
                    title={
                      eventName === "program starts"
                        ? "List of clients with no Program Starts"
                        : `List of ${toTitleCase(eventName)}`
                    }
                    infoModal={
                      <InsightsInfoModal
                        title={`List of ${toTitleCase(eventName)}`}
                        copy={`${modalText}`}
                        methodologyLink={methodologyUrl}
                      />
                    }
                    hasLegend={false}
                    outcomeType={metric.config.outcomeType}
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
                      <InsightsInfoModal
                        title="Rate Compared to State"
                        copy={`This plot shows the selected ${labels.supervisionOfficerLabel} and all other ${labels.supervisionOfficerLabel}s in the state based on their rate for this metric. <br><br>
                        This rate is calculated by taking the total number of ${eventName} on this ${labels.supervisionOfficerLabel}'s caseload in the past 12 months and dividing it by the ${labels.supervisionOfficerLabel}'s average daily caseload. <br><br>
                        For example, if 25 ${labels.supervisionJiiLabel}s on an ${labels.supervisionOfficerLabel}'s caseload ${eventNamePastTense} in the past 12 months, and the ${labels.supervisionOfficerLabel} had an average daily caseload of 50 ${labels.supervisionJiiLabel}s, their ${bodyDisplayName} would appear as 50% in this tool. <br><br>
                        As a result, this rate can be over 100%. For example, if 60 ${labels.supervisionJiiLabel}s on an ${labels.supervisionOfficerLabel}'s caseload ${eventNamePastTense} in the past 12 months, and their average daily caseload was 50 ${labels.supervisionJiiLabel}s, their rate would be 120%.`}
                        methodologyLink={methodologyUrl}
                      />
                    }
                    outcomeType={metric.config.outcomeType}
                  >
                    <InsightsSwarmPlot metric={metric} />
                  </InsightsChartCard>
                  <InsightsChartCard
                    title={`Historical ${toTitleCase(
                      metric.config.bodyDisplayName,
                    )}`}
                    infoModal={
                      <InsightsInfoModal
                        title="Historical Rate"
                        copy={`This chart shows a “yearly rolling window,” which means that each dot on the line represents the ${labels.supervisionOfficerLabel}’s ${metric.config.bodyDisplayName} for a full year. 
                        The most recent dot on the line chart matches up with the rate that is shown in the chart above and represents the ${bodyDisplayName} over the past 12 months. 
                        ${secondToLastDateHint} <br><br>
                        12-month rates are used in order to ensure this line plot is less affected by seasonal spikes or dips.`}
                        methodologyLink={methodologyUrl}
                      />
                    }
                    outcomeType={metric.config.outcomeType}
                    subtitle={`${formatDate(
                      firstDate,
                      "MMMM yyyy",
                    )} - ${formatDate(lastDate, "MMMM yyyy")}`}
                  >
                    <InsightsLinePlot metric={metric} />
                  </InsightsChartCard>
                </Body>
              </Wrapper>
            </StyledTabPanel>
          );
        })}
      </StyledTabs>
    </InsightsPageLayout>
  );
});

const InsightsStaffPage = observer(function InsightsStaffPage() {
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

export default InsightsStaffPage;
