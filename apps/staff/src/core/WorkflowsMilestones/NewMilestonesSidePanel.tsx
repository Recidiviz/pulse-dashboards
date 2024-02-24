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
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import { useRootStore } from "../../components/StoreProvider";
import { TextMessageStatus, TextMessageStatuses } from "../../FirestoreStore";
import { Client } from "../../WorkflowsStore";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import ComposeMessageView from "./ComposeMessage";
import CongratulatedAnotherWayView from "./CongratulatedAnotherWay";
import DeclineMessageView from "./DeclineMessage";
import { MessageSentView } from "./MessageSentView";
import ReviewMessageView from "./ReviewMessage";

export type NEW_MILESTONES_SIDE_PANEL_VIEW =
  | "COMPOSING"
  | "REVIEWING"
  | "DECLINING"
  | "CONGRATULATED_ANOTHER_WAY"
  | "MESSAGE_SENT";

interface NewMilestonesSidePanelProps {
  client: Client;
}

const messageAlreadySent = (status: TextMessageStatus | undefined): boolean => {
  return (
    !!status &&
    [TextMessageStatuses.SUCCESS, TextMessageStatuses.IN_PROGRESS].includes(
      status
    )
  );
};

const NewMilestonesSidePanel = function NewMilestonesSidePanel({
  client,
}: NewMilestonesSidePanelProps): JSX.Element {
  const { workflowsStore } = useRootStore();
  const [currentView, setCurrentView] =
    useState<NEW_MILESTONES_SIDE_PANEL_VIEW>(
      messageAlreadySent(client.milestoneMessagesUpdates?.status)
        ? "MESSAGE_SENT"
        : "COMPOSING"
    );

  // This ensures that the status doesn't get into a weird state if two people are viewing/editing the
  // same client's ComposeMessageView simultaneously
  useEffect(() => {
    if (messageAlreadySent(client.milestoneMessagesUpdates?.status))
      setCurrentView("MESSAGE_SENT");
  }, [client.milestoneMessagesUpdates?.status]);

  switch (currentView) {
    case "COMPOSING":
      return (
        <WorkflowsPreviewModal
          isOpen={!!client}
          pageContent={
            <ComposeMessageView
              client={client}
              setCurrentView={setCurrentView}
            />
          }
        />
      );
    case "REVIEWING":
      return (
        <WorkflowsPreviewModal
          isOpen={!!client}
          onBackClick={() => {
            setCurrentView("COMPOSING");
          }}
          pageContent={
            <ReviewMessageView
              client={client}
              setCurrentView={setCurrentView}
            />
          }
        />
      );
    case "DECLINING":
      return (
        <WorkflowsPreviewModal
          isOpen={!!client}
          onBackClick={() => {
            setCurrentView("COMPOSING");
          }}
          pageContent={
            <DeclineMessageView
              client={client}
              closeModal={() => workflowsStore.updateSelectedPerson(undefined)}
            />
          }
        />
      );
    case "CONGRATULATED_ANOTHER_WAY":
      return (
        <WorkflowsPreviewModal
          isOpen={!!client}
          pageContent={<CongratulatedAnotherWayView client={client} />}
        />
      );
    case "MESSAGE_SENT":
      return (
        <WorkflowsPreviewModal
          isOpen={!!client}
          pageContent={<MessageSentView client={client} />}
        />
      );
    default:
      return <div />;
  }
};

export default observer(NewMilestonesSidePanel);
