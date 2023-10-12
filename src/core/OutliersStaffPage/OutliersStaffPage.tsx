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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link, Redirect } from "react-router-dom";
import simplur from "simplur";
import styled, { css } from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficer } from "../../OutliersStore/models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../../OutliersStore/models/SupervisionOfficerSupervisor";
import { INTERCOM_HEIGHT } from "../OutliersNavLayout/OutliersNavLayout";
import OutliersPageLayout from "../OutliersPageLayout";
import {
  Body,
  Sidebar,
  Wrapper,
} from "../OutliersPageLayout/OutliersPageLayout";
import { outliersUrl } from "../views";

const StyledTabs = styled(Tabs)<{ isMobile: boolean }>`
  margin: 0 -1.5rem;
  margin-bottom: -${({ isMobile }) => (isMobile ? 0 : rem(INTERCOM_HEIGHT))};
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

const StyledTabList = styled(TabList)<{ isMobile: boolean }>`
  display: block;
  padding: ${rem(spacing.md)} ${rem(spacing.sm)} 0;
  white-space: nowrap;
  overflow-x: auto;
  ${({ isMobile }) => isMobile && `border-bottom: none`};

  &::before {
    ${scrollShadowStyles}
    background: linear-gradient(
      90deg,
      #ffffff 3.13%,
      rgba(255, 255, 255, 0) 109.62%
    );
    left: 0;
    opacity: ${({ isMobile }) => (isMobile ? 1 : 0)};
  }

  &::after {
    ${scrollShadowStyles}
    background: linear-gradient(
      270deg,
      #ffffff 3.13%,
      rgba(255, 255, 255, 0) 109.62%
    );
    right: 0;
    opacity: ${({ isMobile }) => (isMobile ? 1 : 0)};
  }
`;

const StyledTab = styled(Tab)`
  font-size: ${rem(spacing.md)};
  color: ${palette.slate60};
  display: inline-block;

  &:hover {
    color: ${palette.pine2};
  }

  &.Tab--selected {
    border-bottom-color: ${palette.pine2};
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

const OutliersStaffPage = observer(function OutliersStaffPage() {
  const { isMobile, isTablet } = useIsMobile(true);
  const {
    outliersStore: { supervisionStore },
  } = useRootStore();
  // TODO #4072: read these from the presenter instead
  const { officerId, metricId } = supervisionStore ?? {};

  // TODO Remove local storage once data store is ready
  const supervisorData = localStorage.getItem("supervisor") || "";
  const officersData = localStorage.getItem("officers") || "";

  const currentSupervisor: SupervisionOfficerSupervisor =
    JSON.parse(supervisorData);
  const currentOfficer: SupervisionOfficer = JSON.parse(officersData).find(
    (officer: SupervisionOfficer) => officer.externalId === officerId
  );
  const [selectedTabIndex, setTabIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentOfficer) {
      currentOfficer.currentPeriodStatuses.FAR.find((metric, index: number) => {
        if (metric.metricId === metricId) {
          return setTabIndex(index);
        }
        return undefined;
      });
    }
  }, [currentOfficer, metricId]);

  if (!currentOfficer || !currentSupervisor || !officerId) return <NotFound />;

  const currentMetricId =
    metricId || currentOfficer.currentPeriodStatuses.FAR[0].metricId;

  const pageTitle = simplur`${currentOfficer.displayName} is an outlier on ${currentOfficer.currentPeriodStatuses.FAR.length} metric[|s]`;

  const infoItems = [
    {
      title: "caseload types",
      info: currentOfficer.caseloadType,
    },
    { title: "district", info: currentOfficer.district },
    { title: "unit supervisor", info: currentSupervisor.displayName },
  ];

  return (
    <>
      <Redirect
        from={outliersUrl("supervisionStaff", {
          officerId,
        })}
        to={outliersUrl("supervisionStaffMetric", {
          officerId,
          metricId: currentMetricId,
        })}
      />
      <OutliersPageLayout pageTitle={pageTitle} infoItems={infoItems}>
        <StyledTabs
          isMobile={isMobile}
          selectedIndex={selectedTabIndex}
          onSelect={(index) => setTabIndex(index)}
        >
          <StyledTabList isMobile={isMobile}>
            {currentOfficer.currentPeriodStatuses.FAR.map((metric) => (
              <Link
                key={metric.metricId}
                to={outliersUrl("supervisionStaffMetric", {
                  officerId: currentOfficer.externalId,
                  metricId: metric.metricId,
                })}
              >
                <StyledTab key={metric.metricId}>{metric.metricId}</StyledTab>
              </Link>
            ))}
          </StyledTabList>
          {currentOfficer.currentPeriodStatuses.FAR.map((metric) => (
            <StyledTabPanel key={metric.metricId}>
              <Wrapper isLaptop={isTablet}>
                <Sidebar isLaptop={isTablet}>{metric.metricId}</Sidebar>
                <Body>{metric.metricId}</Body>
              </Wrapper>
            </StyledTabPanel>
          ))}
        </StyledTabs>
      </OutliersPageLayout>
    </>
  );
});

export default OutliersStaffPage;
