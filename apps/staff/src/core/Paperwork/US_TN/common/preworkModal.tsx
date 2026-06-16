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

import React, { useState } from "react";
import styled from "styled-components";

import { isDemoMode } from "~client-env-utils";

import { DialogModal, DialogView, ModalText } from "../../../DialogModal";
import { useOpportunityFormContext } from "../../OpportunityFormContext";

const LATEST_RECORD_QS = [3, 4, 5, 6];
const JOB_HISTORY_QS = [7];

function joinNumbers(numbers: number[]): string {
  const { length } = numbers;
  switch (length) {
    case 0:
      return "";
    case 1:
      return `question ${numbers[0]}`;
    case 2:
      return `questions ${numbers[0]} and ${numbers[1]}`;
    default:
      return `questions ${numbers.slice(0, -1).join(", ")} and ${numbers[length - 1]}`;
  }
}

const ReviewList = styled.ol`
  & li {
    margin-top: 0.5rem;
  }
`;

export function PreworkModal() {
  const [showModal, setShowModal] = useState(!isDemoMode());
  const form = useOpportunityFormContext();

  const handleClose = () => setShowModal(false);

  const showReviewFlow = form.opportunity.reviewStatus === "SUBMITTED";

  if (showReviewFlow) {
    return (
      <DialogModal isOpen={showModal} onRequestClose={handleClose}>
        <DialogView
          title="Reviewing a Packet"
          onSubmit={handleClose}
          isSubmitDisabled={false}
          submitButtonText="Understood"
        >
          <ModalText>
            <ReviewList>
              <li>
                Double check that all scores in Recidiviz match the paper packet
              </li>
              <li>Update the questions if any corrections made on paper</li>
              <li>Update final overrides in Recidiviz summary sheet, if any</li>
              <li>
                Update Trustee checkboxes + required approvals in Recidiviz, if
                given
              </li>
            </ReviewList>
          </ModalText>
        </DialogView>
      </DialogModal>
    );
  }

  return (
    <DialogModal isOpen={showModal} onRequestClose={handleClose}>
      <DialogView
        title="About CAF Scores"
        onSubmit={handleClose}
        isSubmitDisabled={false}
        submitButtonText="Got it"
      >
        <ModalText>
          <b>For {joinNumbers(LATEST_RECORD_QS)}</b>, Recidiviz is auto-filling
          scores based on any{" "}
          <b>changes to the resident's disciplinary record</b> using data from
          eTOMIS.
          <br />
          <br />
          <b>For {joinNumbers(JOB_HISTORY_QS)}</b>, Recidiviz is auto-filling
          scores based on <b>the resident’s class and job history</b> in eTOMIS.
        </ModalText>
      </DialogView>
    </DialogModal>
  );
}
