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

import { palette, typography } from "@recidiviz/design-system";
import { reduce } from "lodash";
import { uniq } from "lodash/fp";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components/macro";

import TealStarBase from "../../assets/static/images/tealStar.svg?react";
import { useRootStore } from "../../components/StoreProvider";
import { TextMessageStatus } from "../../FirestoreStore";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../../WorkflowsStore";
import { optionalFieldToDate } from "../../WorkflowsStore/utils";
import CaseloadHydrator from "../CaseloadHydrator/CaseloadHydrator";
import { MilestonesCapsule } from "../PersonCapsules/MilestonesCapsule";
import { WorkflowsCaseloadControlBar } from "../WorkflowsCaseloadControlBar/WorkflowsCaseloadControlBar";
import WorkflowsResults from "../WorkflowsResults";
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
  const numOfMilestones = client.congratulationsMilestones?.length || 0;
  let maxMilestonesShown = 2;

  const numOfRemainingMilestones = numOfMilestones - maxMilestonesShown;
  maxMilestonesShown =
    numOfRemainingMilestones === 1 ? numOfMilestones : maxMilestonesShown;
  return (
    <MilestonesList>
      {client.congratulationsMilestones?.map((milestone, index) => {
        if (index < maxMilestonesShown || showAll) {
          return (
            <MilestonesItem key={`${client.pseudonymizedId}-${milestone.type}`}>
              <TealStar />
              <MilestonesText>{milestone.text}</MilestonesText>
            </MilestonesItem>
          );
        }
        if (numOfRemainingMilestones > 1 && !showAll) {
          return (
            <SeeMoreText key={`${client.pseudonymizedId}-See more`}>
              +{numOfRemainingMilestones} more
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

const MilestonesCaseload = observer(function MilestonesCaseload({
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
});

const MILESTONES_TAB_STATUS_MAPPING = {
  "New Milestones": ["PENDING"], // and `undefined`
  Congratulated: ["CONGRATULATED_ANOTHER_WAY", "IN_PROGRESS", "SUCCESS"],
  "Declined to Send": ["DECLINED"],
  Errors: ["FAILURE"],
} as const;

export type MilestonesTab = keyof typeof MILESTONES_TAB_STATUS_MAPPING;

const MILESTONES_TABS = Object.keys(
  MILESTONES_TAB_STATUS_MAPPING,
) as MilestonesTab[];

const MilestonesCaseloadView: React.FC = observer(
  function MilestonesCaseloadView() {
    const { workflowsStore, analyticsStore } = useRootStore();

    const milestonesClients = reduce(
      MILESTONES_TAB_STATUS_MAPPING,
      (acc, statuses, tab) => {
        if (tab === "New Milestones")
          acc[tab] = uniq([
            ...workflowsStore.getMilestonesClientsByStatus(
              statuses as unknown as TextMessageStatus[],
            ),
            ...workflowsStore.getMilestonesClientsByStatus(),
          ]);
        else {
          acc[tab as MilestonesTab] =
            workflowsStore.getMilestonesClientsByStatus(
              statuses as unknown as TextMessageStatus[],
            );
        }

        return acc;
      },
      {} as {
        [tab in MilestonesTab]: Client[];
      },
    ) satisfies Record<MilestonesTab, Client[]>;

    const tabs = MILESTONES_TABS.filter((tab) =>
      tab !== "New Milestones" ? milestonesClients[tab].length > 0 : tab,
    );

    const [activeTab, setActiveTab] = useState<MilestonesTab>(tabs[0]);
    const numOfNewMilestones = milestonesClients["New Milestones"].length;

    const handleTabClick = (tab: MilestonesTab) => {
      analyticsStore.trackMilestonesTabClick({ tab });
      setActiveTab(tab);
    };

    const handleRowOnClick = useCallback(
      (client: Client) => {
        workflowsStore.updateSelectedPerson(client.pseudonymizedId);
        analyticsStore.trackMilestonesSidePanel({
          tab: activeTab,
          justiceInvolvedPersonId: client.pseudonymizedId,
        });
      },
      [activeTab, workflowsStore, analyticsStore],
    );

    useEffect(() => {
      if (!milestonesClients?.[activeTab]?.length) {
        setActiveTab(tabs?.[0] || (undefined as unknown as MilestonesTab));
      }
    }, [milestonesClients, activeTab, tabs]);

    return (
      <CaseloadHydrator
        initial={null}
        hydrated={
          activeTab && (
            <>
              <WorkflowsCaseloadControlBar
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={handleTabClick}
                sortable={false}
              />
              {numOfNewMilestones === 0 && activeTab === "New Milestones" ? (
                milestonesClients["Congratulated"] &&
                milestonesClients["Congratulated"]?.length > 0 ? (
                  <WorkflowsResults
                    callToActionText={
                      "You've reached out to everyone for now. Check back next month."
                    }
                  />
                ) : (
                  <WorkflowsResults
                    callToActionText={
                      "None of the selected caseloads have" +
                      " new milestones to display. Search for another caseload."
                    }
                  />
                )
              ) : (
                <>
                  <MilestonesCaseload
                    clients={milestonesClients[activeTab] || []}
                    handleRowOnClick={handleRowOnClick}
                  />
                  <MilestonesSidePanel activeTab={activeTab} />
                </>
              )}
            </>
          )
        }
        empty={
          <WorkflowsResults
            callToActionText={
              "None of the selected caseloads have" +
              " milestones to display. Search for another caseload."
            }
          />
        }
      />
    );
  },
);

export default MilestonesCaseloadView;
