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
import { SupervisionOfficerDetailPresenter } from "../../OutliersStore/presenters/SupervisionOfficerDetailPresenter";
import { getDistrictWithoutLabel } from "../../OutliersStore/presenters/utils";
import { formatDate, toTitleCase } from "../../utils";
import ModelHydrator from "../ModelHydrator";
import { NavigationBackButton } from "../NavigationBackButton";
import OutliersChartCard from "../OutliersChartCard";
import OutliersEmptyPage from "../OutliersEmptyPage";
import OutliersInfoModal from "../OutliersInfoModal";
import OutliersLinePlot from "../OutliersLinePlot";
import { INTERCOM_HEIGHT } from "../OutliersNavLayout/OutliersNavLayout";
import OutliersPageLayout from "../OutliersPageLayout";
import {
  Body,
  Sidebar,
  Wrapper,
} from "../OutliersPageLayout/OutliersPageLayout";
import { OutliersSwarmPlot } from "../OutliersSwarmPlot";
import { outliersUrl } from "../views";
import { MetricEventsTable } from "./MetricEventsTable";

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

  const {
    outlierOfficerData,
    defaultMetricId,
    officerPseudoId,
    metricId,
    metricInfo,
    supervisorInfo,
    timePeriod,
    labels,
    methodologyUrl,
  } = presenter;

  useEffect(() => {
    presenter.trackViewed();
  }, [presenter]);

  useEffect(() => {
    setTabListEl(document.getElementById("outliersStaffTabList"));
  }, []);

  const supervisorLinkProps = supervisorInfo && {
    linkText: `Go to ${
      supervisorInfo.displayName || labels.supervisionSupervisorLabel
    }'s ${labels.supervisionUnitLabel}`,
    link: outliersUrl("supervisionSupervisor", {
      supervisorPseudoId: supervisorInfo.pseudonymizedId,
    }),
  };
  // empty page where the staff member is not an outlier on any metrics
  if (outlierOfficerData && !outlierOfficerData.outlierMetrics.length) {
    return (
      <OutliersEmptyPage
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
        to={outliersUrl("supervisionStaffMetric", {
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
      link: outliersUrl("supervisionStaff", {
        officerPseudoId,
      }),
    };

    return (
      <OutliersEmptyPage
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
      title: `${labels.supervisionUnitLabel} ${labels.supervisionSupervisorLabel}`,
      info: supervisorInfo?.displayName,
    },
    {
      title: "time period",
      info: timePeriod,
    },
  ];

  return (
    <OutliersPageLayout
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
          id="outliersStaffTabList"
          $isMobile={isMobile}
          $showScrollShadow={isMobile && isTabListOverflown}
        >
          {outlierOfficerData.outlierMetrics.map((metric) => {
            const handleTabClick = () => {
              navigate(
                outliersUrl("supervisionStaffMetric", {
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

          return (
            <StyledTabPanel key={metric.metricId}>
              <Wrapper isLaptop={isTablet}>
                <Sidebar>
                  <OutliersChartCard
                    title={`List of ${toTitleCase(eventName)}`}
                    infoModal={
                      <OutliersInfoModal
                        title={`List of ${toTitleCase(eventName)}`}
                        copy={`This is the list of ${eventNameSingular} events which are being counted in the numerator of this metric.
                        The name of the ${labels.supervisionJiiLabel}, their DOC ID, and the date of the ${eventNameSingular} are listed within this table. <br><br>
                        Click on a ${labels.supervisionJiiLabel} to see more information about this case, such as how long they had been with this ${labels.supervisionOfficerLabel} and more.`}
                        methodologyLink={methodologyUrl}
                      />
                    }
                    hasLegend={false}
                  >
                    <MetricEventsTable
                      officerPseudoId={presenter.officerPseudoId}
                      metricId={metric.metricId}
                    />
                  </OutliersChartCard>
                </Sidebar>
                <Body>
                  <OutliersChartCard
                    title={`${toTitleCase(bodyDisplayName)} Compared to State`}
                    infoModal={
                      <OutliersInfoModal
                        title="Rate Compared to State"
                        copy={`This plot shows the selected ${labels.supervisionOfficerLabel} and all other ${labels.supervisionOfficerLabel}s in the state based on their rate for this metric. <br><br>
                        This rate is calculated by taking the total number of ${eventName} on this ${labels.supervisionOfficerLabel}'s caseload in the past 12 months and dividing it by the ${labels.supervisionOfficerLabel}'s average daily caseload. <br><br>
                        For example, if 25 ${labels.supervisionJiiLabel}s on an ${labels.supervisionOfficerLabel}'s caseload ${eventNamePastTense} in the past 12 months, and the ${labels.supervisionOfficerLabel} had an average daily caseload of 50 ${labels.supervisionJiiLabel}s, their ${bodyDisplayName} would appear as 50% in this tool. As a result, this rate can be over 100%.`}
                        methodologyLink={methodologyUrl}
                      />
                    }
                  >
                    <OutliersSwarmPlot metric={metric} />
                  </OutliersChartCard>
                  <OutliersChartCard
                    title={`Historical ${toTitleCase(
                      metric.config.bodyDisplayName,
                    )}`}
                    infoModal={
                      <OutliersInfoModal
                        title="Historical Rate"
                        copy={`This chart shows a “yearly rolling window,” which means that each dot on the line represents the ${labels.supervisionOfficerLabel}’s ${metric.config.bodyDisplayName} for a full year. 
                        The most recent dot on the line chart matches up with the rate that is shown in the chart above and represents the ${bodyDisplayName} over the past 12 months. 
                        ${secondToLastDateHint} <br><br>
                        12-month rates are used in order to ensure this line plot is less affected by seasonal spikes or dips.`}
                        methodologyLink={methodologyUrl}
                      />
                    }
                    subtitle={`${formatDate(
                      firstDate,
                      "MMMM yyyy",
                    )} - ${formatDate(lastDate, "MMMM yyyy")}`}
                  >
                    <OutliersLinePlot metric={metric} />
                  </OutliersChartCard>
                </Body>
              </Wrapper>
            </StyledTabPanel>
          );
        })}
      </StyledTabs>
    </OutliersPageLayout>
  );
});

const OutliersStaffPage = observer(function OutliersStaffPage() {
  const {
    outliersStore: { supervisionStore },
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

export default OutliersStaffPage;