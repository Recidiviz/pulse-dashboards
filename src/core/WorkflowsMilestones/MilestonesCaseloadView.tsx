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

import { palette, typography } from "@recidiviz/design-system";
import { uniq } from "lodash/fp";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components/macro";

import { ReactComponent as TealStarBase } from "../../assets/static/images/tealStar.svg";
import { useRootStore } from "../../components/StoreProvider";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../../WorkflowsStore";
import { optionalFieldToDate } from "../../WorkflowsStore/utils";
import CaseloadHydrator from "../CaseloadHydrator/CaseloadHydrator";
import { MilestonesCapsule } from "../PersonCapsules/MilestonesCapsule";
import WorkflowsResults from "../WorkflowsResults";
import WorkflowsTabbedPersonList from "../WorkflowsTabbedPersonList/WorkflowsTabbedPersonList";
import { TasksOpportunitiesSection } from "../WorkflowsTasks/TasksOpportunitiesSection";
import { TooltipDetails, WorkflowsTooltip } from "../WorkflowsTooltip";
import { MilestonesSidePanel } from "./MilestonesSidePanel";
import { MilestonesItem, MilestonesList, MilestonesText } from "./styles";

const MILESTONE_ICON_SIZING = rem(16);

const TealStar = styled(TealStarBase)`
  height: ${MILESTONE_ICON_SIZING};
  width: ${MILESTONE_ICON_SIZING};
  min-width: ${MILESTONE_ICON_SIZING};
`;

const MilestonesClientWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const MilestonesClientRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 1.5rem 0;
  cursor: pointer;
`;

const PersonCapsuleWrapper = styled.div``;

const SeeMoreText = styled.span`
  ${typography.Sans12}
  padding: 4px 0;
  color: ${palette.slate60};
`;

const StatusText = styled.span<{ failure?: boolean }>`
  ${typography.Sans14}
  color: ${({ failure }) => (failure ? palette.signal.error : palette.slate60)};

  & div {
    padding-bottom: 0.5rem;
  }
`;

export function ClientMilestones({
  client,
  showAll = false,
}: {
  client: Client;
  showAll?: boolean;
}): JSX.Element {
  const numMilestonesLeft = (client.congratulationsMilestones?.length || 0) - 2;

  return (
    <MilestonesList>
      {client.congratulationsMilestones?.map((milestone, index) => {
        if (index < 2 || showAll) {
          return (
            <MilestonesItem key={`${client.pseudonymizedId}-${milestone.type}`}>
              <TealStar />
              <MilestonesText>{milestone.text}</MilestonesText>
            </MilestonesItem>
          );
        }
        if (index === 2 && !showAll) {
          return (
            <SeeMoreText key={`${client.pseudonymizedId}-See more`}>
              +{numMilestonesLeft} more
            </SeeMoreText>
          );
        }
        return null;
      })}
    </MilestonesList>
  );
}

function CongratulationStatus({ client }: { client: Client }): JSX.Element {
  const updated = client.milestonesMessageUpdateLog;
  const date = formatWorkflowsDate(optionalFieldToDate(updated?.date));
  const errors = client.milestonesMessageErrors;

  switch (client.milestonesMessageStatus) {
    case "SUCCESS":
    case "CONGRATULATED_ANOTHER_WAY":
      return <StatusText>Congratulated on {date}.</StatusText>;
    case "DECLINED":
      return (
        <StatusText>
          {updated?.by} declined to congratulate on {date}.
        </StatusText>
      );
    case "FAILURE":
      return (
        <StatusText failure>
          {errors?.map((error) => {
            return <div>{error}</div>;
          })}
        </StatusText>
      );
    default:
      return <StatusText />;
  }
}

function MilestonesCaseload({
  clients,
  handleRowOnClick,
}: {
  clients: Client[];
  handleRowOnClick: (p: Client) => void;
}): JSX.Element {
  const items = clients.map((client) => (
    <WorkflowsTooltip
      contents={
        <TooltipDetails
          person={client}
          OpportunitiesSection={TasksOpportunitiesSection}
        />
      }
      key={`tooltip-${client.externalId}`}
      person={client}
    >
      <MilestonesClientRow
        onClick={() => handleRowOnClick(client)}
        key={client.externalId}
      >
        <PersonCapsuleWrapper>
          <MilestonesCapsule person={client} />
        </PersonCapsuleWrapper>
        <ClientMilestones client={client} />
        <CongratulationStatus client={client} />
      </MilestonesClientRow>
    </WorkflowsTooltip>
  ));

  return <MilestonesClientWrapper>{items}</MilestonesClientWrapper>;
}

const MILESTONES_TABS = [
  "New Milestones",
  "Congratulated",
  "Declined to Send",
  "Errors",
] as const;

export type MilestonesTab = typeof MILESTONES_TABS[number];

const MilestonesCaseloadView: React.FC = observer(
  function MilestonesCaseloadView() {
    const { workflowsStore, analyticsStore } = useRootStore();
    const [activeTab, setActiveTab] = useState<MilestonesTab>(
      MILESTONES_TABS[0]
    );

    const handleTabClick = (tab: MilestonesTab) => {
      analyticsStore.trackMilestonesTabClick({ tab });
      setActiveTab(tab);
    };

    const handleRowOnClick = (client: Client) => {
      workflowsStore.updateSelectedPerson(client.pseudonymizedId);
      analyticsStore.trackMilestonesSidePanel({
        tab: activeTab,
        justiceInvolvedPersonId: client.pseudonymizedId,
      });
    };

    const empty = (
      <WorkflowsResults callToActionText="None of the selected caseloads have milestones to display. Search for another caseload." />
    );

    const erroredMilestonesClients =
      workflowsStore.getMilestonesClientsByStatus(["FAILURE"]);
    const hasErrors = erroredMilestonesClients.length > 0;

    const clients = (tab: MilestonesTab): Client[] => {
      switch (tab) {
        case "New Milestones":
          return uniq([
            ...workflowsStore.getMilestonesClientsByStatus(["PENDING"]),
            ...workflowsStore.getMilestonesClientsByStatus(),
          ]);
        case "Congratulated":
          return workflowsStore.getMilestonesClientsByStatus([
            "CONGRATULATED_ANOTHER_WAY",
            "IN_PROGRESS",
            "SUCCESS",
          ]);
        case "Declined to Send":
          return workflowsStore.getMilestonesClientsByStatus(["DECLINED"]);
        case "Errors":
          return erroredMilestonesClients;
        default:
          return [];
      }
    };

    return (
      <CaseloadHydrator
        initial={null}
        hydrated={
          <WorkflowsTabbedPersonList<MilestonesTab>
            tabs={
              hasErrors
                ? [...MILESTONES_TABS]
                : MILESTONES_TABS.filter((t) => t !== "Errors")
            }
            activeTab={activeTab}
            onClick={handleTabClick}
          >
            <MilestonesCaseload
              clients={clients(activeTab)}
              handleRowOnClick={handleRowOnClick}
            />
            <MilestonesSidePanel activeTab={activeTab} />
          </WorkflowsTabbedPersonList>
        }
        empty={empty}
      />
    );
  }
);

export default MilestonesCaseloadView;
