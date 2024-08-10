import {
  animation,
  Button,
  palette,
  typography,
} from "@recidiviz/design-system";
import { useEffect, useState } from "react";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

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
