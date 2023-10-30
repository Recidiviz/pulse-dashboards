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
import { noop } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link, Redirect } from "react-router-dom";
import simplur from "simplur";
import styled, { css } from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerDetailPresenter } from "../../OutliersStore/presenters/SupervisionOfficerDetailPresenter";
import { formatDate, toTitleCase } from "../../utils";
import ModelHydrator from "../ModelHydrator";
import OutliersChartCard from "../OutliersChartCard";
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
`;

const StyledTabList = styled(TabList)<{ $isMobile: boolean }>`
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
    opacity: ${({ $isMobile }) => ($isMobile ? 1 : 0)};
  }

  &::after {
    ${scrollShadowStyles}
    background: linear-gradient(
      270deg,
      #ffffff 3.13%,
      rgba(255, 255, 255, 0) 109.62%
    );
    right: 0;
    opacity: ${({ $isMobile }) => ($isMobile ? 1 : 0)};
  }
`;

const StyledTab = styled(Tab)`
  font-size: ${rem(spacing.md)};
  display: inline-block;
  padding: 0;
  border: 0;

  & a {
    display: inline-block;
    padding: ${rem(spacing.sm)} 0;
    color: ${palette.slate60};
    border-bottom: ${rem(4)} solid transparent;

    &:hover {
      color: ${palette.pine2};
    }
  }

  &.Tab--selected {
    & a {
      border-bottom-color: ${palette.pine2};
      color: ${palette.pine2};
    }
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

const StaffPageWithPresenter = observer(function StaffPageWithPresenter({
  presenter,
}: {
  presenter: SupervisionOfficerDetailPresenter;
}) {
  const { isMobile, isTablet } = useIsMobile(true);

  const { outlierOfficerData, defaultMetricId, officerPseudoId, metricId } =
    presenter;

  // if the presenter is hydrated, this stuff should never be missing in practice
  if (!outlierOfficerData || !defaultMetricId) return <NotFound />;

  // if current metric is not set, we need to redirect to the default metric URL
  if (!metricId) {
    return (
      <Redirect
        to={outliersUrl("supervisionStaffMetric", {
          officerPseudoId,
          metricId: defaultMetricId,
        })}
      />
    );
  }

  const currentSupervisor = presenter.supervisorInfo;
  const pageTitle = simplur`${outlierOfficerData.displayName} is an outlier on ${outlierOfficerData.outlierMetrics.length} metric[|s]`;

  const infoItems = [
    {
      title: "caseload types",
      info: outlierOfficerData.caseloadType,
    },
    { title: "district", info: outlierOfficerData.district },
    { title: "unit supervisor", info: currentSupervisor?.displayName },
  ];

  return (
    <OutliersPageLayout pageTitle={pageTitle} infoItems={infoItems}>
      <StyledTabs
        $isMobile={isMobile}
        selectedIndex={presenter.currentMetricIndex}
        // tab navigation is handled by router Link components,
        // so we don't actually have to maintain any tab state here
        onSelect={noop}
      >
        <StyledTabList $isMobile={isMobile}>
          {outlierOfficerData.outlierMetrics.map((metric) => (
            <StyledTab key={metric.metricId}>
              <Link
                to={outliersUrl("supervisionStaffMetric", {
                  officerPseudoId: outlierOfficerData.pseudonymizedId,
                  metricId: metric.metricId,
                })}
              >
                {toTitleCase(metric.config.eventName)}
              </Link>
            </StyledTab>
          ))}
        </StyledTabList>
        {outlierOfficerData.outlierMetrics.map((metric) => {
          const firstDate = metric.benchmark.benchmarks[0]?.endDate;
          const lastDate = metric.benchmark.benchmarks.slice(-1)[0]?.endDate;

          return (
            <StyledTabPanel key={metric.metricId}>
              <Wrapper isLaptop={isTablet}>
                <Sidebar>
                  <MetricEventsTable
                    officerPseudoId={presenter.officerPseudoId}
                    metricId={metric.metricId}
                  />
                </Sidebar>
                <Body>
                  <OutliersChartCard
                    title={`${toTitleCase(
                      metric.config.bodyDisplayName
                    )} Compared to State`}
                  >
                    <OutliersSwarmPlot metric={metric} />
                  </OutliersChartCard>
                  <OutliersChartCard
                    title={`Historical ${toTitleCase(
                      metric.config.bodyDisplayName
                    )}`}
                    subtitle={`${formatDate(
                      firstDate,
                      "MMMM yyyy"
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
    officerPseudoId
  );

  return (
    <ModelHydrator model={presenter}>
      <StaffPageWithPresenter presenter={presenter} />
    </ModelHydrator>
  );
});

export default OutliersStaffPage;
