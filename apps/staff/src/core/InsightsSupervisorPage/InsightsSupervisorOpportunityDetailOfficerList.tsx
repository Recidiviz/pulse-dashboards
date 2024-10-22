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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { Link } from "react-router-dom";
import simplur from "simplur";
import styled from "styled-components/macro";

import { OpportunityInfo } from "~datatypes";

import { insightsUrl } from "../views";

const OfficerWithOpportunityDetailsName = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
`;
const OfficerWithOpportunityDetailsInfo = styled.div`
  flex-direction: row;
  display: inline-flex;
  flex-wrap: nowrap;
  width: fit-content;
`;

const ClientsCountText = styled.div`
  ${typography.Sans12}
  color: ${palette.slate60};
`;

const LIST_HEIGHT = rem(352);
const LIST_WIDTH = rem(261);
const LIST_ITEM_HEIGHT = rem(44);
const LIST_ITEM_WIDTH = `100%`;

const OfficerWithOpportunityDetailList = styled.ul<{ isOverflowing: boolean }>`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  list-style-type: none;
  width: ${LIST_WIDTH};
  height: ${LIST_HEIGHT};
  scrollbar-width: thin;
  padding-bottom: 2px;
  padding-left: 0;
  border-top: ${rem(1)} solid ${palette.slate20};

  ${({ isOverflowing }) =>
    isOverflowing &&
    `
    overflow-y: scroll;
    mask-image: linear-gradient(
      to bottom,
      white calc(100% - 24px),
      transparent 100%
    );
  `}
`;

const OfficerWithOpportunityDetailListItem = styled.li`
  width: ${LIST_ITEM_WIDTH};
  height: ${LIST_ITEM_HEIGHT};
  gap: 0;
  border-top: ${rem(1)} solid ${palette.slate20};
  color: ${palette.pine1};
  display: flex;
  flex-direction: column;
  justify-content: center;

  &:first-child {
    border-top: none;
  }

  &:hover {
    ${OfficerWithOpportunityDetailsName} {
      color: ${palette.signal.links};
      text-decoration: underline;
    }

    background-color: ${palette.slate10};
  }
`;

const StaffPageLink = styled(Link)`
  padding: ${rem(spacing.md)} ${rem(spacing.md)} ${rem(spacing.md)}
    ${rem(spacing.sm)};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export type InsightsSupervisorOpportunityDetailOfficerListProps = {
  officersWithEligibleClients: OpportunityInfo["officersWithEligibleClients"];
  supervisionJiiLabel: string;
  label: string;
};

export const InsightsSupervisorOpportunityDetailOfficerList: React.FC<
  InsightsSupervisorOpportunityDetailOfficerListProps
> = ({ officersWithEligibleClients, supervisionJiiLabel }) => {
  const isOverflowing = officersWithEligibleClients.length > 7;

  return (
    <OfficerWithOpportunityDetailList isOverflowing={isOverflowing}>
      {officersWithEligibleClients.map((officer) => (
        <OfficerWithOpportunityDetailListItem key={officer.externalId}>
          <StaffPageLink
            to={insightsUrl("supervisionStaff", {
              officerPseudoId: officer.pseudonymizedId,
            })}
          >
            <OfficerWithOpportunityDetailsName>
              {officer.displayName}
            </OfficerWithOpportunityDetailsName>
            <OfficerWithOpportunityDetailsInfo>
              <ClientsCountText>
                {" "}
                {simplur`${officer.clientsEligibleCount} ${supervisionJiiLabel}[|s]`}
              </ClientsCountText>
            </OfficerWithOpportunityDetailsInfo>
          </StaffPageLink>
        </OfficerWithOpportunityDetailListItem>
      ))}
    </OfficerWithOpportunityDetailList>
  );
};
