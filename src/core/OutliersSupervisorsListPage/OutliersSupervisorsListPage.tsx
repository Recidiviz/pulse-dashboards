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
import groupBy from "lodash/fp/groupBy";
import map from "lodash/fp/map";
import pipe from "lodash/fp/pipe";
import values from "lodash/fp/values";
import { rem } from "polished";
import { Link } from "react-router-dom";
import simplur from "simplur";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import { supervisionOfficerSupervisorsFixture } from "../../OutliersStore/models/offlineFixtures/SupervisionOfficerSupervisor";
import { SupervisionOfficerSupervisor } from "../../OutliersStore/models/SupervisionOfficerSupervisor";
import { PersonInitialsAvatar } from "../Avatar";
import { SectionLabelText } from "../sharedComponents";
import { outliersUrl } from "../views";

const Wrapper = styled.div<{ isLaptop: boolean }>`
  max-width: ${({ isLaptop }) => (isLaptop ? "unset" : "50vw")};
  padding-top: ${rem(spacing.xl)};
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

const OutliersSupervisorsListPage = () => {
  const { isMobile, isLaptop } = useIsMobile(true);

  // TODO #4146 Ensure we are filtering only to supervisors with outlying officers
  const supervisorsByDistrict = pipe(
    groupBy((d: SupervisionOfficerSupervisor) => d.district),
    values,
    map((dataset) => {
      return {
        district: dataset[0].district,
        supervisors: dataset as SupervisionOfficerSupervisor[],
      };
    })
  )(supervisionOfficerSupervisorsFixture);

  const districtViz = supervisorsByDistrict.map(({ district, supervisors }) => (
    <div key={district}>
      <DistrictName>{district ?? "Unknown"}</DistrictName>
      <SupervisorLinksWrapper isMobile={isMobile}>
        {supervisors.map((supervisor) => (
          <SupervisorWrapper>
            <TooltipTrigger contents="See insights">
              <StyledLink
                key={supervisor.externalId}
                to={outliersUrl("supervisionSupervisor", {
                  supervisorId: supervisor.externalId,
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
  ));

  const pageTitle = simplur`${supervisionOfficerSupervisorsFixture.length} supervisor[|s] across the state have one or more outlier officers in their unit`;

  return (
    <Wrapper isLaptop={isLaptop}>
      <Title isMobile={isMobile}>{pageTitle}</Title>
      {districtViz}
    </Wrapper>
  );
};

export default OutliersSupervisorsListPage;
