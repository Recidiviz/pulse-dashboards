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
import { useState } from "react";

import { useRootStore } from "../../components/StoreProvider";
import { Client } from "../../WorkflowsStore";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import ComposeMessage from "./ComposeMessage";
import CongratulatedAnotherWay from "./CongratulatedAnotherWay";
import DeclineMessageView from "./DeclineMessageView";
import { MilestonesTab } from "./MilestonesCaseloadView";
import ReviewMessageView from "./ReviewMessage";

export type NEW_MILESTONES_SIDE_PANEL_VIEW =
  | "COMPOSING"
  | "REVIEWING"
  | "DECLINING"
  | "CONGRATULATED_ANOTHER_WAY"
  | "OPPORTUNITY_AVAILABLE"
  | "MESSAGE_SENT";

interface NewMilestonesSidePanelProps {
  client: Client;
}

const NewMilestonesSidePanel = function NewMilestonesSidePanel({
  client,
}: NewMilestonesSidePanelProps): JSX.Element {
  const { workflowsStore } = useRootStore();
  const [currentView, setCurrentView] =
    useState<NEW_MILESTONES_SIDE_PANEL_VIEW>("COMPOSING");

  switch (currentView) {
    case "COMPOSING":
      return (
        <WorkflowsPreviewModal
          isOpen={!!client}
          pageContent={
            <ComposeMessage client={client} setCurrentView={setCurrentView} />
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
          pageContent={<CongratulatedAnotherWay client={client} />}
        />
      );
    case "OPPORTUNITY_AVAILABLE":
      return <div>TODO Opportunity Available</div>;
    case "MESSAGE_SENT":
      return <div>TODO Message Sent</div>;
    default:
      return <div>Default page</div>;
  }
};

export const MilestonesSidePanel = observer(function MilestonesSidePanel({
  activeTab,
}: {
  activeTab: MilestonesTab;
}) {
  const {
    workflowsStore: { selectedClient },
  } = useRootStore();
  if (!selectedClient) return null;

  switch (activeTab) {
    case "NEW_MILESTONES":
      return <NewMilestonesSidePanel client={selectedClient} />;
    case "CONGRATULATED":
      return <div>TODO CONGRATULATED</div>;
    case "DECLINED":
      return <div>TODO DECLINED</div>;
    case "ERRORS":
      return <div>TODO ERRORS</div>;
    default:
      return <div>Default page</div>;
  }
});
