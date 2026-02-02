// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import React from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";

import { Icon, IconSVG, palette } from "~design-system";

import { OpportunityNotification } from "../../WorkflowsStore";

const AlertBanner = styled.div`
  max-width: 100%;
  min-height: fit-content;
  background: #fff5f5;
  border-left: ${rem(4)} solid ${palette.logoRed};
  padding: ${rem(16)} ${rem(16)} ${rem(16)} ${rem(22)};
  display: flex;
  flex-direction: column;
  gap: ${rem(16)};
  margin-bottom: ${rem(spacing.lg)};

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

const Title = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const ArrowIcon = styled(Icon)`
  transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
`;

const NotificationList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${rem(8)};
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NotificationLink = styled(Link)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${rem(4)};
  &:hover {
    ${ArrowIcon} {
      transform: translateX(${rem(4)});
    }
  }
`;

const NotificationItem = styled.li``;

const NotificationBody = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
  line-height: 1.4;
  flex: 1;
  max-width: fit-content;
  margin: 0;
`;

const SeeMoreLink = styled(Link)`
  ${typography.Sans14}
  color: ${palette.pine4};
  text-decoration: underline;
  margin-top: ${rem(8)};

  &:hover {
    color: ${palette.text.links};
  }
`;

interface InsightsNotificationSupervisorOpportunityBannerProps {
  title: string;
  seeMoreLink: string;
  notifications: Pick<OpportunityNotification, "body" | "link" | "id">[];
  seeMoreLinkText: string;
}

export const InsightsNotificationSupervisorOpportunityBanner: React.FC<
  InsightsNotificationSupervisorOpportunityBannerProps
> = ({ title, seeMoreLink, notifications, seeMoreLinkText }) => {
  const location = useLocation();
  if (notifications.length === 0) {
    return null;
  }


  const maxDisplayed = 5;
  const displayedNotifications = notifications.slice(0, maxDisplayed);
  const remainingCount = notifications.length - maxDisplayed;

  return (
    <AlertBanner>
      {/* TODO (#11236): Update title to be better per opportunity type.*/}
      <Title>{title}</Title>
      <NotificationList>
        {displayedNotifications.map(({ body, link: personLink, id }) => (
          <NotificationItem key={id}>
            <NotificationLink
              to={personLink ?? ""}
              state={{ previousPage: location.pathname }}
            >
              <Icon
                kind={IconSVG.Warning}
                fill={palette.signal.warning}
                height={16}
                width={16}
              />
              <NotificationBody>{body}</NotificationBody>
              {personLink && (
                <ArrowIcon
                  kind={IconSVG.Arrow}
                  color={palette.slate80}
                  height={12}
                  width={12}
                  strokeWidth={2}
                />
              )}
            </NotificationLink>
          </NotificationItem>
        ))}
      </NotificationList>
      {remainingCount > 0 && (
        <SeeMoreLink
          to={seeMoreLink}
          state={{ previousPage: location.pathname }}
        >
          {seeMoreLinkText}
        </SeeMoreLink>
      )}
    </AlertBanner>
  );
};

export default InsightsNotificationSupervisorOpportunityBanner;
