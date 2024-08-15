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

import {
  Icon,
  IconSVG,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import { useState } from "react";
import { Link } from "react-router-dom";
import simplur from "simplur";
import styled from "styled-components/macro";

import { OpportunityInfo } from "../../InsightsStore/models/OpportunityInfo";
import { insightsUrl } from "../views";

const OfficerWithOpportunityDetailsName = styled.h1`
  ${typography.Sans14}
  color: ${palette.pine1};
`;
const OfficerWithOpportunityDetailsInfo = styled.div`
  gap: ${rem(spacing.xs)};
  flex-direction: row;
  display: inline-flex;
  flex-wrap: nowrap;
  width: fit-content;
`;

const ClientsCountText = styled.p`
  ${typography.Sans12}
  color: ${palette.slate60};
`;

const ArrowWrapper = styled.span`
  margin-left: ${rem(spacing.xs)};
`;

const LIST_HEIGHT = rem(352);
const LIST_WIDTH = rem(261);
const LIST_ITEM_HEIGHT = rem(44);
const LIST_ITEM_WIDTH = `100%`;

const OfficerWithOpportunityDetailList = styled.ul`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  list-style-type: none;
  width: ${LIST_WIDTH};
  height: ${LIST_HEIGHT};
  scrollbar-width: thin;
  overflow-y: scroll;
  padding-bottom: 48px;
  padding-left: 0;
  mask-image: linear-gradient(
    to bottom,
    white calc(100% - 48px),
    transparent 100%
  );
`;

const OfficerWithOpportunityDetailListItem = styled.li<{ hovered?: boolean }>`
  width: ${LIST_ITEM_WIDTH};
  height: ${LIST_ITEM_HEIGHT};
  padding: ${rem(spacing.md)} ${rem(spacing.md)} ${rem(spacing.md)} ${rem(0)};
  gap: 0;
  border-top: ${rem(1)} solid ${palette.slate20};
  color: ${palette.pine1};

  ${({ hovered }) =>
    hovered &&
    `
  ${OfficerWithOpportunityDetailsName} {
      color: ${palette.pine4};
    }`}

  &:hover {
    ${OfficerWithOpportunityDetailsName} {
      color: ${palette.pine4};
    }

    ${ArrowWrapper} {
      opacity: 1;
    }
  }
`;

const StaffPageLink = styled(Link)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export type InsightsSupervisorOpportunityDetailOfficerListProps = {
  officersWithEligibleClients: OpportunityInfo["officersWithEligibleClients"];
  supervisionJiiLabel: string;
  label: string;
};

export const InsightsSupervisorOpportunityDetailOfficerList: React.FC<
  InsightsSupervisorOpportunityDetailOfficerListProps
> = ({ officersWithEligibleClients, supervisionJiiLabel }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <OfficerWithOpportunityDetailList>
      {officersWithEligibleClients.map((officer) => (
        <OfficerWithOpportunityDetailListItem
          key={officer.externalId}
          onMouseEnter={() => setHoveredItem(officer.externalId)}
          onMouseLeave={() => setHoveredItem(null)}
        >
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
              {hoveredItem === officer.externalId && (
                <Icon
                  strokeWidth={1.5}
                  kind={IconSVG.Arrow}
                  color={palette.pine4}
                  width={12}
                  height={12}
                />
              )}
            </OfficerWithOpportunityDetailsInfo>
          </StaffPageLink>
        </OfficerWithOpportunityDetailListItem>
      ))}
    </OfficerWithOpportunityDetailList>
  );
};
