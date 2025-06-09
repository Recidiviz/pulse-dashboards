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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { insightsUrl } from "../views";

const OfficerName = styled.div<{
  showPill: boolean;
}>`
  ${typography.Sans14}
  color: ${palette.pine1};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: ${rem(spacing.sm)};
  ${({ showPill }) => showPill && "max-width: 48%;"}
`;
const OfficerDetailsInfo = styled.div<{
  showPill: boolean;
}>`
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: ${({ showPill }) =>
    showPill ? "space-between" : "flex-end"};
  flex-wrap: nowrap;
  width: ${({ showPill }) => (showPill ? "52%" : "fit-content")};
`;

const OfficerValueText = styled.div`
  ${typography.Sans12}
  color: ${palette.slate60};
`;

const LIST_ITEM_HEIGHT = rem(62);
const LIST_ITEM_WIDTH = `100%`;

const OfficerListItem = styled.li`
  width: ${LIST_ITEM_WIDTH};
  height: ${LIST_ITEM_HEIGHT};
  min-height: ${LIST_ITEM_HEIGHT};
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
    ${OfficerName} {
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

export type InsightsSupervisorDetailCardListItemProps = {
  officerName: string;
  officerPseudoId: string;
  officerValue: string;
  showPill: boolean;
  children: ReactNode;
};

export const InsightsSupervisorDetailCardListItem: React.FC<
  InsightsSupervisorDetailCardListItemProps
> = ({ officerName, officerPseudoId, officerValue, showPill, children }) => {
  return (
    <OfficerListItem key={officerPseudoId}>
      <StaffPageLink
        to={insightsUrl("supervisionStaff", {
          officerPseudoId: officerPseudoId,
        })}
      >
        <OfficerName showPill={showPill}>{officerName}</OfficerName>
        <OfficerDetailsInfo showPill={!!showPill}>
          {children}
          <OfficerValueText> {officerValue}</OfficerValueText>
        </OfficerDetailsInfo>
      </StaffPageLink>
    </OfficerListItem>
  );
};
