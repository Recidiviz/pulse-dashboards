// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { rem } from "polished";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { StaffRecord } from "~datatypes";
import { palette } from "~design-system";

import { CharacterCountTextField } from "../../components/CharacterCountTextField/CharacterCountTextField";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { WorkflowsStore } from "../../WorkflowsStore";
import { Opportunity } from "../../WorkflowsStore/Opportunity";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";
import { workflowsUrl } from "../views";
import WorkflowsOfficerName from "../WorkflowsOfficerName/WorkflowsOfficerName";
import {
  CancelButton,
  ChangeLabel,
  ModalFooter,
  ModalTitle,
  NameLabel,
  SendButton,
  StyledDropdown,
  StyledDropdownMenu,
  StyledDropdownMenuItem,
  StyledDropdownToggle,
  StyledModal,
} from "./ModalStyles";

const CurrentReviewer = styled.div`
  color: ${palette.pine3};
  font-family: "Public Sans";
  font-size: ${rem(12)};
  font-style: normal;
  font-weight: 500;
  line-height: ${rem(16)}; /* 133.333% */
  letter-spacing: ${rem(-0.12)};
`;

const StyledCharacterCountTextField = styled(CharacterCountTextField)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: ${rem(8)};
  align-self: stretch;

  border-radius: ${rem(8)};
  background: ${palette.slate05};

  textarea {
    border: none;
    resize: none;
  }
`;

type submitRevisionModalProps = {
  showModal: boolean;
  onCloseFn: () => void;
  opportunity: Opportunity<JusticeInvolvedPerson>;
  workflowsStore: WorkflowsStore;
};

export const SubmitRevisionModal = observer(function SubmitRevisionModal({
  showModal,
  onCloseFn,
  opportunity,
  workflowsStore,
}: submitRevisionModalProps) {
  const navigate = useNavigate();
  const { availableOfficersWithOrWithoutCaseloads } = workflowsStore;

  const previousReviewerIds = new Set(
    opportunity.actionHistory
      ?.map((a) => a.type === "APPROVAL" && a.updateById)
      .filter(Boolean),
  );

  const currentReviewerId = opportunity.currentReviewerId;

  const actionHistoryOfficers = availableOfficersWithOrWithoutCaseloads.filter(
    (o) => previousReviewerIds.has(o.staffExternalId),
  );
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const [reason, setReason] = useState("");

  return (
    <StyledModal
      isOpen={showModal}
      onRequestClose={onCloseFn}
      className="SubmitRevisionModal"
      shouldReturnFocusAfterClose={false}
    >
      <ModalTitle>Send Back to:</ModalTitle>
      <StyledDropdown>
        <StyledDropdownToggle>
          <NameLabel>
            {selectedStaff ? (
              <WorkflowsOfficerName
                officerId={selectedStaff.staffExternalId}
                availableOfficers={availableOfficersWithOrWithoutCaseloads}
              />
            ) : (
              "Select a previous reviewer"
            )}
          </NameLabel>
          {selectedStaff && <ChangeLabel>Change</ChangeLabel>}
        </StyledDropdownToggle>
        <StyledDropdownMenu>
          {actionHistoryOfficers.map((officer) => (
            <StyledDropdownMenuItem
              key={officer.staffExternalId}
              onClick={() => setSelectedStaff(officer)}
            >
              <WorkflowsOfficerName
                officerId={officer.staffExternalId}
                availableOfficers={availableOfficersWithOrWithoutCaseloads}
              />
            </StyledDropdownMenuItem>
          ))}
        </StyledDropdownMenu>
      </StyledDropdown>
      {currentReviewerId && (
        <CurrentReviewer>
          Current Reviewer:{" "}
          <WorkflowsOfficerName
            officerId={currentReviewerId}
            availableOfficers={availableOfficersWithOrWithoutCaseloads}
          />
        </CurrentReviewer>
      )}
      <ModalTitle>Reason:</ModalTitle>
      <StyledCharacterCountTextField
        value={reason}
        onChange={(e) => setReason(e)}
        placeholder="Placeholder text"
        label={"Add a reason"}
        showCountBottomRight
        showRequired
      />
      <ModalFooter>
        <CancelButton
          kind="link"
          onClick={() => {
            setSelectedStaff(null);
            setReason("");
            onCloseFn();
          }}
        >
          Cancel
        </CancelButton>
        <SendButton
          kind="primary"
          shape="block"
          disabled={!selectedStaff || !reason}
          onClick={() => {
            if (!selectedStaff || !reason) {
              return;
            }
            opportunity.setSupervisorResponse({
              type: "REVISION",
              notes: reason,
              reviewerId: selectedStaff.staffExternalId,
            });
            toast(
              <OpportunityStatusUpdateToast
                toastText={`${opportunity.person.displayName} Sent back for revisions to ${selectedStaff.surname}, ${selectedStaff.givenNames}`}
              />,
              {
                id: "revisionsToast",
                position: "bottom-left",
                duration: 7000,
              },
            );
            setSelectedStaff(null);
            setReason("");

            onCloseFn();
            navigate(
              workflowsUrl("opportunityClients", {
                urlSection: opportunity.config.urlSection,
              }),
            );
          }}
        >
          Send
        </SendButton>
      </ModalFooter>
    </StyledModal>
  );
});
