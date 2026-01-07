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

import { spacing, TooltipTrigger, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { now } from "mobx-utils";
import { rem } from "polished";
import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { Button, Icon, IconSVG, palette } from "~design-system";
import { PersonInitialsAvatar } from "~ui";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerSupervisorsPresenter } from "../../InsightsStore/presenters/SupervisionOfficerSupervisorsPresenter";
import { THIRTY_SECONDS } from "../../InsightsStore/presenters/utils";
import ModelHydrator from "../ModelHydrator";
import { SectionLabelText } from "../sharedComponents";
import { insightsUrl } from "../views";

const Wrapper = styled.div<{ isLaptop: boolean; isTablet: boolean }>`
  max-width: ${({ isLaptop }) => (isLaptop ? "unset" : rem(1200))};
  padding: ${rem(spacing.xl)} ${({ isTablet }) => (isTablet ? 0 : rem(56))} 0;
  margin: 0 auto;
`;

const Title = styled.div<{
  isMobile: boolean;
}>`
  ${({ isMobile }) => (isMobile ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.md)};
`;

const DistrictName = styled(SectionLabelText)`
  margin-top: ${rem(spacing.xxl)};
`;

const SupervisorLinksWrapper = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ isMobile }) => (isMobile ? "column" : "row")};
  flex-wrap: wrap;
  row-gap: ${rem(spacing.md)};
  margin-top: ${rem(spacing.lg)};
`;

const SupervisorWrapper = styled.div`
  flex-basis: 50%;
`;

const SupervisorName = styled.div`
  color: ${palette.pine2};
  font-size: 18px;
  border-bottom: 1px solid transparent;
`;

const StyledLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.md)};

  &:hover ${SupervisorName} {
    color: ${palette.signal.links};
    border-bottom: 1px solid ${palette.signal.links};
  }
`;

const DownloadUserDataButton = styled(Button)`
  border: solid;
  border-color: ${palette.slate40};
  border-radius: 0.2rem;

  background-color: ${palette.white};
  color: ${palette.text.primary};

  .DownloadArrow {
    opacity: 0;
  }

  &:hover .DownloadArrow,
  &:focus-visible .DownloadArrow {
    opacity: 1;
  }

  &:focus {
    outline: none;
  }

  &:hover,
  &:focus-visible {
    background-color: ${palette.slate10};
  }

  ,
  &:active,
  &[aria-expanded="true"] {
    background-color: ${palette.slate05};
  }

  &:disabled {
    background-color: ${palette.slate05};
    color: ${palette.slate80};
  }

  ${({ waiting }) =>
    waiting &&
    `
      cursor: wait !important;
      * {
        cursor: wait !important;
      }
    `}
`;

const SupervisorsList = observer(function SupervisorsList({
  presenter,
}: {
  presenter: SupervisionOfficerSupervisorsPresenter;
}) {
  const { isMobile, isTablet, isLaptop } = useIsMobile(true);
  const [initialPageLoad, setInitialPageLoad] = useState<Date | undefined>(
    undefined,
  );

  const { supervisorsByLocation, pageTitle } = presenter;

  // trackPageViewed30Seconds every 30 seconds after the initial page load
  if (
    initialPageLoad &&
    initialPageLoad.getTime() < now(THIRTY_SECONDS) - THIRTY_SECONDS
  ) {
    presenter.trackPageViewed30Seconds(location.pathname);
  }

  if (!initialPageLoad) {
    presenter.trackViewed();
    setInitialPageLoad(new Date());
  }

  const districtViz = supervisorsByLocation.map(
    ({ location, supervisors }, districtIndex) => (
      <div key={location}>
        <DistrictName>{location}</DistrictName>
        <SupervisorLinksWrapper isMobile={isMobile}>
          {supervisors.map((supervisor, supervisorIndex) => (
            <SupervisorWrapper
              key={supervisor.externalId}
              data-intercom-target={
                districtIndex === 0 && supervisorIndex === 0
                  ? "First supervisor in list"
                  : undefined
              }
            >
              <TooltipTrigger contents="See insights">
                <StyledLink
                  key={supervisor.externalId}
                  to={insightsUrl("supervisionSupervisor", {
                    supervisorPseudoId: supervisor.pseudonymizedId,
                  })}
                >
                  <PersonInitialsAvatar square name={supervisor.displayName} />
                  <SupervisorName>{supervisor.displayName}</SupervisorName>
                </StyledLink>
              </TooltipTrigger>
            </SupervisorWrapper>
          ))}
        </SupervisorLinksWrapper>
      </div>
    ),
  );

  const { tenantStore } = useRootStore();

  return (
    <Wrapper isLaptop={isLaptop} isTablet={isTablet}>
      <Title isMobile={isMobile}>{pageTitle}</Title>
      {tenantStore.stateCode === "TX" && (
        <>
          <div style={{ color: palette.slate, marginBottom: "0.5rem" }}>
            Download Eligible Clients
          </div>
          <DownloadUserDataButton
            onClick={presenter.downloadUserDataButtonOnClick}
            waiting={presenter.isDownloadingUserData}
          >
            <Icon
              kind={IconSVG.ZipFile}
              fill={palette.slate50}
              height={18}
              style={{ padding: 2 }}
            />
            TDCJ Parole ARS ERS Eligible Clients.zip
            <Icon
              kind={IconSVG.DownloadArrow}
              fill={"#004d48"}
              height={18}
              style={{ padding: 2 }}
              className="DownloadArrow"
            />
          </DownloadUserDataButton>
        </>
      )}
      {districtViz}
    </Wrapper>
  );
});

const InsightsSupervisorsListPage = observer(
  function InsightsSupervisorsListPage() {
    const { insightsLeadershipPageAllDistricts } = useFeatureVariants();
    const {
      insightsStore: { supervisionStore },
      tenantStore,
      userStore,
    } = useRootStore();

    if (!supervisionStore) return null;

    const presenter = new SupervisionOfficerSupervisorsPresenter(
      supervisionStore,
      tenantStore,
      userStore,
      insightsLeadershipPageAllDistricts,
    );

    return (
      <ModelHydrator hydratable={presenter}>
        <SupervisorsList presenter={presenter} />
      </ModelHydrator>
    );
  },
);

export default InsightsSupervisorsListPage;
