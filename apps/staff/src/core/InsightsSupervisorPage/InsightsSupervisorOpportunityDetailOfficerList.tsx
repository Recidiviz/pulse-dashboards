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

import { OpportunityInfo, OpportunityType } from "~datatypes";

import { useFeatureVariants } from "../../components/StoreProvider";
import InsightsPill from "../InsightsPill";
import { insightsUrl } from "../views";

const OfficerWithOpportunityDetailsName = styled.div<{
  showZeroGrantsPill: boolean;
}>`
  ${typography.Sans14}
  color: ${palette.pine1};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: ${rem(spacing.sm)};
  ${({ showZeroGrantsPill }) => showZeroGrantsPill && "max-width: 48%;"}
`;
const OfficerWithOpportunityDetailsInfo = styled.div<{
  showZeroGrantsPill: boolean;
}>`
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: ${({ showZeroGrantsPill }) =>
    showZeroGrantsPill ? "space-between" : "flex-end"};
  flex-wrap: nowrap;
  width: ${({ showZeroGrantsPill }) =>
    showZeroGrantsPill ? "52%" : "fit-content"};
`;

const ClientsCountText = styled.div`
  ${typography.Sans12}
  color: ${palette.slate60};
`;

const LIST_HEIGHT = rem(496);
const LIST_WIDTH = rem(305);
const LIST_ITEM_HEIGHT = rem(62);
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
  padding: ${rem(20)} ${rem(spacing.md)} ${rem(20)} ${rem(spacing.sm)};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export type InsightsSupervisorOpportunityDetailOfficerListProps = {
  officersWithEligibleClients: OpportunityInfo["officersWithEligibleClients"];
  supervisionJiiLabel: string;
  label: string;
  opportunityType: OpportunityType;
};

export const InsightsSupervisorOpportunityDetailOfficerList: React.FC<
  InsightsSupervisorOpportunityDetailOfficerListProps
> = ({ officersWithEligibleClients, supervisionJiiLabel, opportunityType }) => {
  const { zeroGrantsFlag } = useFeatureVariants();

  const isOverflowing = officersWithEligibleClients.length > 7;

  return (
    <OfficerWithOpportunityDetailList isOverflowing={isOverflowing}>
      {officersWithEligibleClients.map((officer) => {
        const showZeroGrantsPill =
          zeroGrantsFlag &&
          officer.zeroGrantOpportunities?.includes(opportunityType);
        return (
          <OfficerWithOpportunityDetailListItem key={officer.externalId}>
            <StaffPageLink
              to={insightsUrl("supervisionStaff", {
                officerPseudoId: officer.pseudonymizedId,
              })}
            >
              <OfficerWithOpportunityDetailsName
                showZeroGrantsPill={!!showZeroGrantsPill}
              >
                {officer.displayName}
              </OfficerWithOpportunityDetailsName>

              <OfficerWithOpportunityDetailsInfo
                showZeroGrantsPill={!!showZeroGrantsPill}
              >
                {showZeroGrantsPill && (
                  <InsightsPill
                    label="Zero Grants"
                    // TODO(#6450): Pull tooltip copy from opportunity config
                    tooltipCopy="This officer has not granted any clients this opportunity in the past 12 months."
                  />
                )}
                <ClientsCountText>
                  {" "}
                  {simplur`${officer.clientsEligibleCount} ${supervisionJiiLabel}[|s]`}
                </ClientsCountText>
              </OfficerWithOpportunityDetailsInfo>
            </StaffPageLink>
          </OfficerWithOpportunityDetailListItem>
        );
      })}
    </OfficerWithOpportunityDetailList>
  );
};
