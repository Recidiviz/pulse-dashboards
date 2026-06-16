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

import { Modal, Sans24 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { StaffRecord } from "~datatypes";
import { palette } from "~design-system";
import { Button } from "~design-system";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { WorkflowsStore } from "../../WorkflowsStore";
import { Opportunity } from "../../WorkflowsStore/Opportunity";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";
import { StaffLookup } from "../PersonLookup/StaffLookup";
import { workflowsUrl } from "../views";

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    display: flex;
    width: ${rem(627)};
    padding: ${rem(40)};
    flex-direction: column;
    align-items: flex-start;
    gap: ${rem(16)};
    overflow: visible;

    border-radius: ${rem(4)};
    background: ${palette.white};
  }
`;

const ModalSection = styled.div`
  display: flex;
  padding-bottom: ${rem(24)};
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(8)};
  align-self: stretch;
`;

const ModalTitle = styled(Sans24)`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: ${rem(18)};
  font-style: normal;
  font-weight: 500;
  line-height: ${rem(21.6)}; /* 120% */
  letter-spacing: ${rem(-0.36)};
`;

const ModalFooter = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${rem(8)};
  align-self: stretch;
`;

const CancelButton = styled(Button).attrs({ kind: "link" })`
  display: flex;
  width: ${rem(160)};
  height: ${rem(40)};
  padding: ${rem(8)} ${rem(16)};
  justify-content: center;
  align-items: center;
  gap: ${rem(8)};

  border-radius: ${rem(4)};
  border: ${rem(1)} solid rgba(53, 83, 98, 0.2);

  &:hover {
    text-decoration: none;
  }
`;

const ForwardButton = styled(Button)`
  display: flex;
  height: ${rem(40)};
  padding: 0 ${rem(16)};
  justify-content: center;
  align-items: center;
  gap: ${rem(10)};
  flex: 1 0 0;

  border-radius: ${rem(4)};
  background: ${palette.pine4};
`;

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
        <ForwardButton
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
        </ForwardButton>
      </ModalFooter>
    </StyledModal>
  );
});
