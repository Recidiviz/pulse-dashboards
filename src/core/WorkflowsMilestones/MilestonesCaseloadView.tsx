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
import { useState } from "react";
import styled from "styled-components/macro";

import { ReactComponent as TealStar } from "../../assets/static/images/tealStar.svg";
import { useRootStore } from "../../components/StoreProvider";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../../WorkflowsStore";
import { optionalFieldToDate } from "../../WorkflowsStore/utils";
import CaseloadHydrator from "../CaseloadHydrator/CaseloadHydrator";
import { MilestonesCapsule } from "../PersonCapsules/MilestonesCapsule";
import WorkflowsResults from "../WorkflowsResults";
import { MilestonesSidePanel } from "./MilestonesSidePanel";
import { MilestonesTooltip } from "./MilestonesTooltip";
import { MilestonesItem, MilestonesList, MilestonesText } from "./styles";

export type MilestonesTab =
  | "NEW_MILESTONES"
  | "CONGRATULATED"
  | "DECLINED"
  | "ERRORS";

const MilestonesTabs = styled.div`
  display: flex;
  flex-flow: row nowrap;
  border-bottom: 1px solid ${palette.slate60};
  margin: 2rem 0;
  align-items: end;
`;

const MilestonesTabButton = styled.div<{ $active: boolean }>`
  ${typography.Sans16}
  color: ${(props) => (props.$active ? palette.pine4 : palette.slate60)};
  padding: 0.5rem 0;
  border-bottom: ${(props) =>
    props.$active ? `1px solid ${palette.pine4}` : "none"};
  margin-right: 2rem;
  cursor: pointer;
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
              <TealStar height="16" width="16" />
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
      return <StatusText failure>Could not send text message.</StatusText>;
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
    <MilestonesTooltip key={`tooltip-${client.externalId}`} client={client}>
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
    </MilestonesTooltip>
  ));

  return <MilestonesClientWrapper>{items}</MilestonesClientWrapper>;
}

const MilestonesCaseloadView: React.FC = observer(
  function MilestonesCaseloadView() {
    const { workflowsStore, analyticsStore } = useRootStore();
    const [activeTab, setActiveTab] = useState<MilestonesTab>("NEW_MILESTONES");

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

    const tabs: Partial<Record<MilestonesTab, string>> = {
      NEW_MILESTONES: "New Milestones",
      CONGRATULATED: "Congratulated",
      DECLINED: "Declined to Send",
    };

    const empty = (
      <WorkflowsResults callToActionText="None of the selected caseloads have milestones to display. Search for another caseload." />
    );

    const erroredMilestonesClients =
      workflowsStore.getMilestonesClientsByStatus(["FAILURE"]);
    const hasErrors = erroredMilestonesClients.length > 0;

    const clients = (tab: MilestonesTab): Client[] => {
      switch (tab) {
        case "NEW_MILESTONES":
          return uniq([
            ...workflowsStore.getMilestonesClientsByStatus(["PENDING"]),
            ...workflowsStore.getMilestonesClientsByStatus(),
          ]);
        case "CONGRATULATED":
          return workflowsStore.getMilestonesClientsByStatus([
            "CONGRATULATED_ANOTHER_WAY",
            "IN_PROGRESS",
            "SUCCESS",
          ]);
        case "DECLINED":
          return workflowsStore.getMilestonesClientsByStatus(["DECLINED"]);
        case "ERRORS":
          return erroredMilestonesClients;
        default:
          return [];
      }
    };

    return (
      <CaseloadHydrator
        initial={null}
        hydrated={
          <>
            <MilestonesTabs>
              {(Object.keys(tabs) as Array<MilestonesTab>).map((tab) => (
                <MilestonesTabButton
                  key={tab}
                  $active={activeTab === tab}
                  onClick={() => handleTabClick(tab)}
                >
                  {tabs[tab]}
                </MilestonesTabButton>
              ))}
              {hasErrors && (
                <MilestonesTabButton
                  key="ERRORS"
                  $active={activeTab === "ERRORS"}
                  onClick={() => handleTabClick("ERRORS")}
                >
                  Errors
                </MilestonesTabButton>
              )}
            </MilestonesTabs>
            <MilestonesCaseload
              clients={clients(activeTab)}
              handleRowOnClick={handleRowOnClick}
            />
            <MilestonesSidePanel activeTab={activeTab} />
          </>
        }
        empty={empty}
      />
    );
  }
);

export default MilestonesCaseloadView;
