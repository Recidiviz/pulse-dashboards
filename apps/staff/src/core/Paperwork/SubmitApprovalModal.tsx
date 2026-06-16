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
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { StaffRecord } from "~datatypes";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { WorkflowsStore } from "../../WorkflowsStore";
import { Opportunity } from "../../WorkflowsStore/Opportunity";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";
import { StaffLookup } from "../PersonLookup/StaffLookup";
import { workflowsUrl } from "../views";
import {
  CancelButton,
  ModalFooter,
  ModalSection,
  ModalTitle,
  SendButton,
  StyledModal,
} from "./ModalStyles";

type SubmitApprovalModalProps = {
  showModal: boolean;
  onCloseFn: () => void;
  opportunity: Opportunity<JusticeInvolvedPerson>;
  workflowsStore: WorkflowsStore;
};

export const SubmitApprovalModal = observer(function SubmitApprovalModal({
  showModal,
  onCloseFn,
  opportunity,
}: SubmitApprovalModalProps) {
  const navigate = useNavigate();
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);

  return (
    <StyledModal
      isOpen={showModal}
      onRequestClose={onCloseFn}
      className="SubmitApprovalModal"
      shouldReturnFocusAfterClose={false}
    >
      <ModalSection>
        <ModalTitle>Approve and forward to:</ModalTitle>
        <StaffLookup opportunity={opportunity} onSelect={setSelectedStaff} />
      </ModalSection>

      <ModalFooter>
        <CancelButton
          onClick={() => {
            setSelectedStaff(null);
            onCloseFn();
          }}
        >
          Cancel
        </CancelButton>
        <SendButton
          disabled={!selectedStaff}
          onClick={() => {
            if (!selectedStaff) {
              return;
            }
            // If the opportunity is currently in review, it means the current user is responding
            // to an existing review request, and we should set a response before
            // forwarding the approval on down the chain.
            if (opportunity.isInGrantReview) {
              opportunity.setSupervisorResponse({ type: "APPROVAL" });
            }
            opportunity.setOfficerAction({
              type: "APPROVAL",
              reviewerId: selectedStaff.id,
            });
            toast(
              <OpportunityStatusUpdateToast
                toastText={`${opportunity.person.displayName} Submitted for Review to ${selectedStaff.surname}, ${selectedStaff.givenNames}`}
              />,
              {
                id: "approvalForwardToast",
                position: "bottom-left",
                duration: 7000,
              },
            );
            onCloseFn();
            navigate(
              workflowsUrl("opportunityClients", {
                urlSection: opportunity.config.urlSection,
              }),
            );
          }}
        >
          Forward
        </SendButton>
      </ModalFooter>
    </StyledModal>
  );
});
