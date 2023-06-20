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
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { ReactComponent as TealStar } from "../../assets/static/images/tealStar.svg";
import { useRootStore } from "../../components/StoreProvider";
import { Client, JusticeInvolvedPerson } from "../../WorkflowsStore";
import CaseloadHydrator from "../CaseloadHydrator/CaseloadHydrator";
import { MilestonesCapsule } from "../PersonCapsules/MilestonesCapsule";
import { workflowsUrl } from "../views";
import WorkflowsResults from "../WorkflowsResults";

type MilestonesTab = "NEW_MILESTONES" | "CONGRATULATED" | "DECLINED" | "ERRORS";

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

const MilestonesItem = styled.div`
  display: flex;
  flex-flow: row nowrap;
  padding: 4px 0;
`;

const MilestonesList = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const MilestonesText = styled.span`
  ${typography.Sans14}
  color: ${palette.pine4};
  margin-left: 6px;
`;

const MilestonesClientRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 1.5rem 0;
  cursor: pointer;
`;

const SeeMoreText = styled.span`
  ${typography.Sans12}
  padding: 4px 0;
  color: ${palette.slate60};
`;

function ClientMilestones({ client }: { client: Client }): JSX.Element {
  const numMilestonesLeft = (client.milestones?.length || 0) - 2;

  return (
    <MilestonesList>
      {client.milestones?.map((milestone, index) => {
        if (index < 2) {
          return (
            <MilestonesItem key={`${client.pseudonymizedId}-${milestone.type}`}>
              <TealStar height="16" width="16" />
              <MilestonesText>{milestone.text}</MilestonesText>
            </MilestonesItem>
          );
        }
        return (
          <SeeMoreText key="See more">+{numMilestonesLeft} more</SeeMoreText>
        );
      })}
    </MilestonesList>
  );
}

function MilestonesCaseload({
  persons,
}: {
  persons: JusticeInvolvedPerson[];
}): JSX.Element {
  const items = persons.map((person) => (
    <MilestonesClientRow key={person.externalId}>
      <Link
        to={workflowsUrl("clientProfile", {
          justiceInvolvedPersonId: person.pseudonymizedId,
        })}
      >
        <MilestonesCapsule person={person} />
      </Link>
      <ClientMilestones client={person as Client} />
    </MilestonesClientRow>
  ));

  return <MilestonesClientWrapper>{items}</MilestonesClientWrapper>;
}

const MilestonesCaseloadView: React.FC = observer(
  function MilestonesCaseloadView() {
    const {
      workflowsStore: { milestonesClients },
    } = useRootStore();
    const [activeTab, setActiveTab] = useState<MilestonesTab>("NEW_MILESTONES");

    const handleTabClick = (tab: MilestonesTab) => {
      setActiveTab(tab);
    };

    const hasErrors = false;

    const tabs: Partial<Record<MilestonesTab, string>> = {
      NEW_MILESTONES: "New Milestones",
      CONGRATULATED: "Congratulated",
      DECLINED: "Declined to Send",
    };

    const empty = (
      <WorkflowsResults callToActionText="None of the selected caseloads have milestones to display. Search for another caseload." />
    );

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
                  $active={activeTab === "ERRORS"}
                  onClick={() => handleTabClick("ERRORS")}
                >
                  Errors
                </MilestonesTabButton>
              )}
            </MilestonesTabs>
            {activeTab === "NEW_MILESTONES" && (
              <MilestonesCaseload persons={milestonesClients} />
            )}
            {activeTab === "CONGRATULATED" && (
              <MilestonesCaseload persons={[]} />
            )}
            {activeTab === "DECLINED" && <MilestonesCaseload persons={[]} />}
            {activeTab === "ERRORS" && <MilestonesCaseload persons={[]} />}
          </>
        }
        empty={empty}
      />
    );
  }
);

export default MilestonesCaseloadView;
