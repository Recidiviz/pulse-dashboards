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
import { debounce, xor } from "lodash";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import styled from "styled-components/macro";

import Checkbox from "../../components/Checkbox/Checkbox";
import { useRootStore } from "../../components/StoreProvider";
import { DeclineReason } from "../../FirestoreStore";
import { Client } from "../../WorkflowsStore";
import { OTHER_KEY } from "../../WorkflowsStore/utils";
import { OtherReasonInput } from "../sharedComponents";
import {
  ActionButton,
  MenuItem,
  OtherReasonWrapper,
  SidePanelContents,
} from "./styles";

export const DECLINED_REASONS_MAP: Record<DeclineReason, string> = {
  MILESTONE_NOT_MET: "Client has not met one or more milestones",
  CLIENT_DECLINED_TEXTS: "Client asked me not to text them",
  MISSING_CONTACT_INFO: "Client contact information is missing",
  [OTHER_KEY]: "Other reason",
};

const DeclineMessageHeading = styled(Sans18)`
  color: ${palette.pine1};
  margin: 0 0 2rem 0;
`;

interface SidePanelViewProps {
  client: Client;
  closeModal: () => void;
}

const DeclineMessageView = observer(function DeclineMessageView({
  client,
  closeModal,
}: SidePanelViewProps): JSX.Element {
  const { analyticsStore } = useRootStore();
  const [reasons, setReasons] = useState<DeclineReason[]>([]);
  const [otherReason, setOtherReason] = useState<DeclineReason>();

  const handleSubmit = async () => {
    await client.updateMilestonesDeclineReasons(reasons, otherReason);
    analyticsStore.trackMilestonesMessageDeclined({
      justiceInvolvedPersonId: client.pseudonymizedId,
      declineReasons: [...reasons, ...(otherReason ? [otherReason] : [])],
    });
    if (closeModal) closeModal();
  };

  const disableConfirmButton =
    reasons.length === 0 || (reasons.includes(OTHER_KEY) && !otherReason);

  return (
    <SidePanelContents>
      <DeclineMessageHeading>
        Decline sending a congratulations to {client.displayPreferredName}?
        Specify why:
      </DeclineMessageHeading>
      <>
        {Object.entries(DECLINED_REASONS_MAP).map(([code, description]) => (
          <MenuItem
            key={code}
            onClick={() => setReasons(xor(reasons, [code]) as DeclineReason[])}
          >
            <Checkbox
              value={code}
              checked={reasons.includes(code as DeclineReason)}
              name="denial reason"
              disabled
            >
              {description}
            </Checkbox>
          </MenuItem>
        ))}
        {reasons.includes(OTHER_KEY) && (
          <OtherReasonWrapper>
            <OtherReasonInput
              placeholder="Please specify a reason…"
              onChange={debounce(
                (event) => setOtherReason(event.target.value),
                500,
              )}
            />
          </OtherReasonWrapper>
        )}
      </>
      <ActionButton
        width="117px"
        disabled={disableConfirmButton}
        onClick={handleSubmit}
      >
        Confirm
      </ActionButton>
    </SidePanelContents>
  );
});

export default DeclineMessageView;
