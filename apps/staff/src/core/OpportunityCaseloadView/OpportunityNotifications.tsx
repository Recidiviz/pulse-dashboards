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

import { animation, Button, typography } from "@recidiviz/design-system";
import { useEffect, useState } from "react";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { OpportunityNotification } from "../../WorkflowsStore";
import cssVars from "../CoreConstants.module.scss";

interface OpportunityNotificationsProps {
  notifications: OpportunityNotification[];
  handleDismiss: (id: string) => void;
}

interface OpportunityNotificationDisplayProps {
  notification: OpportunityNotification;
  handleDismiss: () => void;
}

const Notification = styled.div<{ cta: boolean; fade: boolean }>`
  background-color: #edf8ff;
  border-left: 5px solid #00a1ff;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: ${({ cta }) => (cta ? "center" : "flex-start")};
  margin-bottom: 20px;

  ${({ fade }) => fade && "opacity: 0"};
  transition: opacity ${animation.defaultDurationMs}ms;

  @media screen and (max-width: ${cssVars.breakpointXxs}) {
    ${({ cta }) =>
      cta
        ? `
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    `
        : `align-items: flex-start`}
  }
`;

const Title = styled.div`
  ${typography.Sans12}
  color: ${palette.slate70};
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const Body = styled(MarkdownView)`
  padding-right: 1rem;

  p {
    ${typography.Sans14}
    margin: 0;
    color: ${palette.pine2};
    line-height: 1.4;
    margin: 0;
  }

  a {
    color: ${palette.pine4};
    text-decoration: underline;
  }

  a:hover {
    color: ${palette.text.links};
  }
`;

const DismissButtonCTA = styled(Button)`
  height: 1em;
  text-wrap: nowrap;
  padding: 0 25px;
`;

const DismissButtonIcon = styled(Button)`
  min-width: unset;
`;

const OpportunityNotificationDisplay = ({
  notification,
  handleDismiss,
}: OpportunityNotificationDisplayProps) => {
  const [dismissed, setDismissed] = useState(false);

  // Call parent handleDismiss after fade-out animation
  useEffect(() => {
    if (dismissed) {
      setTimeout(() => handleDismiss(), animation.defaultDurationMs);
    }
  }, [dismissed, handleDismiss]);

  const { cta, id, title, body } = notification;
  const dismissButton = cta ? (
    <DismissButtonCTA onClick={() => setDismissed(true)}>
      {cta}
    </DismissButtonCTA>
  ) : (
    <DismissButtonIcon
      icon="Close"
      kind="borderless"
      onClick={() => setDismissed(true)}
    />
  );

  return (
    <Notification key={id} cta={!!cta} fade={dismissed}>
      <div>
        {title && <Title>{title.toUpperCase()}</Title>}
        <Body markdown={body} />
      </div>
      {dismissButton}
    </Notification>
  );
};

const OpportunityNotifications = ({
  notifications,
  handleDismiss,
}: OpportunityNotificationsProps) => {
  return (
    <div>
      {notifications.map((notification) => (
        <OpportunityNotificationDisplay
          key={notification.id}
          notification={notification}
          handleDismiss={() => handleDismiss(notification.id)}
        />
      ))}
    </div>
  );
};

export default OpportunityNotifications;
