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
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import simplur from "simplur";
import styled from "styled-components/macro";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerSupervisorsPresenter } from "../../InsightsStore/presenters/SupervisionOfficerSupervisorsPresenter";
import { PersonInitialsAvatar } from "../Avatar";
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

const SupervisorsList = observer(function SupervisorsList({
  presenter,
}: {
  presenter: SupervisionOfficerSupervisorsPresenter;
}) {
  const { isMobile, isTablet, isLaptop } = useIsMobile(true);
  const {
    supervisorsWithOutliersByDistrict,
    supervisorsWithOutliersCount,
    labels,
  } = presenter;

  const districtViz = supervisorsWithOutliersByDistrict.map(
    ({ district, supervisors }, districtIndex) => (
      <div key={district}>
        <DistrictName>{district ?? "Unknown"}</DistrictName>
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

  const pageTitle = simplur`${supervisorsWithOutliersCount} ${labels.supervisionSupervisorLabel}[|s] across the state have one or more outlier ${labels.supervisionOfficerLabel}s in their ${labels.supervisionUnitLabel}`;

  return (
    <Wrapper isLaptop={isLaptop} isTablet={isTablet}>
      <Title isMobile={isMobile}>{pageTitle}</Title>
      {districtViz}
    </Wrapper>
  );
});

const InsightsSupervisorsListPage = observer(
  function InsightsSupervisorsListPage() {
    const { insightsLeadershipPageAllDistricts } = useFeatureVariants();
    const {
      insightsStore: { supervisionStore },
    } = useRootStore();

    if (!supervisionStore) return null;

    const presenter = new SupervisionOfficerSupervisorsPresenter(
      supervisionStore,
      insightsLeadershipPageAllDistricts,
    );

    return (
      <ModelHydrator model={presenter}>
        <SupervisorsList presenter={presenter} />
      </ModelHydrator>
    );
  },
);

export default InsightsSupervisorsListPage;
