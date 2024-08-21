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

import { palette, Sans18 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import GrayAlert from "../../assets/static/images/grayAlert.svg?react";
import { Client } from "../../WorkflowsStore";
import { OTHER_KEY } from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsJusticeInvolvedPersonProfile/Heading";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import Banner from "./Banner";
import { DECLINED_REASONS_MAP } from "./DeclineMessage";
import { ClientMilestones } from "./MilestonesCaseloadView";
import {
  MilestonesItem,
  MilestonesList,
  MilestonesText,
  SidePanelContents,
  SidePanelHeader,
  TextLink,
} from "./styles";

interface DeclinedSidePanelProps {
  client: Client;
  closeModal: () => void;
}

const BulletPoint = styled(Sans18)`
  color: ${palette.pine4};
`;

const DeclinedSidePanel = observer(function DeclinedSidePanel({
  client,
  closeModal,
}: DeclinedSidePanelProps): JSX.Element | null {
  const { milestonesDeclinedReasons } = client;
  const handleUndoDecline = async () => {
    await client.undoMilestonesDeclined();
    closeModal();
  };
  return (
    <WorkflowsPreviewModal
      isOpen={!!client}
      pageContent={
        <SidePanelContents data-testid="DeclinedSidePanel">
          <Heading person={client} />
          <Banner
            icon={GrayAlert}
            text="Declined"
            actionLink={<TextLink onClick={handleUndoDecline}>Undo</TextLink>}
          />
          <SidePanelHeader>Reasons</SidePanelHeader>
          <MilestonesList>
            {milestonesDeclinedReasons?.reasons.map((reason) => {
              const reasonText =
                reason === OTHER_KEY
                  ? `Other reason: ${milestonesDeclinedReasons.otherReason}`
                  : DECLINED_REASONS_MAP[reason];
              return (
                <MilestonesItem key={reason}>
                  <BulletPoint>&#x2022;</BulletPoint>
                  <MilestonesText>{reasonText}</MilestonesText>
                </MilestonesItem>
              );
            })}
          </MilestonesList>
          <SidePanelHeader>Milestones</SidePanelHeader>
          <ClientMilestones client={client} showAll />
        </SidePanelContents>
      }
    />
  );
});

export default DeclinedSidePanel;
